import { Injectable, CanActivate, ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { SecurityService } from '../services/security.service';
import { AuditService } from '../services/audit.service';

export interface RateLimitOptions {
  windowMs: number; // Time window in milliseconds
  max: number; // Maximum number of requests per window
  message?: string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  keyGenerator?: (req: Request) => string;
}

@Injectable()
export class RateLimitGuard implements CanActivate {
  private readonly rateLimitStore: Map<string, { count: number; resetTime: number }> = new Map();
  private readonly defaultOptions: RateLimitOptions = {
    windowMs: 60000, // 1 minute
    max: 100, // 100 requests per minute
    message: 'Too many requests',
  };

  constructor(
    private readonly securityService: SecurityService,
    private readonly auditService: AuditService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const options = this.getRateLimitOptions(context);

    const key = this.generateKey(request, options);
    const now = Date.now();
    const windowStart = now - options.windowMs;

    // Clean up expired entries
    this.cleanupExpiredEntries(now);

    // Get or create rate limit entry
    const entry = this.rateLimitStore.get(key) || { count: 0, resetTime: now + options.windowMs };

    // Check if window has expired
    if (now > entry.resetTime) {
      entry.count = 0;
      entry.resetTime = now + options.windowMs;
    }

    // Check rate limit
    if (entry.count >= options.max) {
      this.logRateLimitExceeded(request, options);
      throw new HttpException(
        {
          error: 'Rate limit exceeded',
          message: options.message,
          retryAfter: Math.ceil((entry.resetTime - now) / 1000),
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    // Increment counter
    entry.count++;
    this.rateLimitStore.set(key, entry);

    // Log successful request
    this.logRateLimitSuccess(request, options, entry.count);

    return true;
  }

  /**
   * Get rate limit options from metadata or use defaults
   */
  private getRateLimitOptions(context: ExecutionContext): RateLimitOptions {
    // In production, get from metadata or configuration
    return this.defaultOptions;
  }

  /**
   * Generate rate limit key
   */
  private generateKey(request: Request, options: RateLimitOptions): string {
    if (options.keyGenerator) {
      return options.keyGenerator(request);
    }

    // Default key generation based on IP and user ID
    const ip = this.getClientIP(request);
    const userId = this.getUserId(request);
    return `rate_limit:${ip}:${userId}`;
  }

  /**
   * Get client IP address
   */
  private getClientIP(request: Request): string {
    const forwarded = request.headers['x-forwarded-for'];
    if (forwarded) {
      return Array.isArray(forwarded) ? forwarded[0] : forwarded.split(',')[0];
    }
    return request.connection.remoteAddress || request.socket.remoteAddress || 'unknown';
  }

  /**
   * Get user ID from request
   */
  private getUserId(request: Request): string {
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return 'anonymous';
    }

    try {
      const token = authHeader.substring(7);
      // In production, decode JWT token to get user ID
      return 'user-from-token';
    } catch (error) {
      return 'anonymous';
    }
  }

  /**
   * Clean up expired rate limit entries
   */
  private cleanupExpiredEntries(now: number): void {
    for (const [key, entry] of this.rateLimitStore.entries()) {
      if (now > entry.resetTime) {
        this.rateLimitStore.delete(key);
      }
    }
  }

  /**
   * Log rate limit exceeded event
   */
  private async logRateLimitExceeded(request: Request, options: RateLimitOptions): Promise<void> {
    try {
      const ip = this.getClientIP(request);
      const userId = this.getUserId(request);

      await this.auditService.logSecurityEvent({
        type: 'authorization',
        severity: 'medium',
        description: 'Rate limit exceeded',
        context: {
          userId,
          sessionId: 'no-session',
          ipAddress: ip,
          userAgent: request.headers['user-agent'] || 'unknown',
          timestamp: new Date(),
          requestId: `req_${Date.now()}`,
          roles: ['anonymous'],
        },
        metadata: {
          rateLimit: {
            windowMs: options.windowMs,
            max: options.max,
            path: request.path,
            method: request.method,
          },
        },
      });
    } catch (error) {
      // Log error but don't throw
      console.error('Failed to log rate limit exceeded event', error);
    }
  }

  /**
   * Log rate limit success event
   */
  private async logRateLimitSuccess(request: Request, options: RateLimitOptions, count: number): Promise<void> {
    try {
      const ip = this.getClientIP(request);
      const userId = this.getUserId(request);

      // Only log if approaching rate limit (80% of max)
      if (count >= options.max * 0.8) {
        await this.auditService.logSecurityEvent({
          type: 'authorization',
          severity: 'low',
          description: 'Approaching rate limit',
          context: {
            userId,
            sessionId: 'no-session',
            ipAddress: ip,
            userAgent: request.headers['user-agent'] || 'unknown',
            timestamp: new Date(),
            requestId: `req_${Date.now()}`,
            roles: ['anonymous'],
          },
          metadata: {
            rateLimit: {
              windowMs: options.windowMs,
              max: options.max,
              current: count,
              path: request.path,
              method: request.method,
            },
          },
        });
      }
    } catch (error) {
      // Log error but don't throw
      console.error('Failed to log rate limit success event', error);
    }
  }

  /**
   * Get rate limit statistics
   */
  getRateLimitStats(): any {
    const now = Date.now();
    const stats = {
      totalEntries: this.rateLimitStore.size,
      activeEntries: 0,
      expiredEntries: 0,
      topIPs: new Map<string, number>(),
      topUsers: new Map<string, number>(),
    };

    for (const [key, entry] of this.rateLimitStore.entries()) {
      if (now <= entry.resetTime) {
        stats.activeEntries++;
        
        // Parse key to extract IP and user
        const parts = key.split(':');
        if (parts.length >= 3) {
          const ip = parts[1];
          const user = parts[2];
          
          stats.topIPs.set(ip, (stats.topIPs.get(ip) || 0) + entry.count);
          stats.topUsers.set(user, (stats.topUsers.get(user) || 0) + entry.count);
        }
      } else {
        stats.expiredEntries++;
      }
    }

    return {
      ...stats,
      topIPs: Array.from(stats.topIPs.entries()).sort((a, b) => b[1] - a[1]).slice(0, 10),
      topUsers: Array.from(stats.topUsers.entries()).sort((a, b) => b[1] - a[1]).slice(0, 10),
      timestamp: new Date(),
    };
  }

  /**
   * Clear rate limit for specific key
   */
  clearRateLimit(key: string): void {
    this.rateLimitStore.delete(key);
  }

  /**
   * Clear all rate limits
   */
  clearAllRateLimits(): void {
    this.rateLimitStore.clear();
  }

  /**
   * Get rate limit for specific key
   */
  getRateLimit(key: string): { count: number; resetTime: number; remaining: number } | null {
    const entry = this.rateLimitStore.get(key);
    if (!entry) {
      return null;
    }

    const now = Date.now();
    if (now > entry.resetTime) {
      return null;
    }

    return {
      count: entry.count,
      resetTime: entry.resetTime,
      remaining: Math.max(0, this.defaultOptions.max - entry.count),
    };
  }
}
