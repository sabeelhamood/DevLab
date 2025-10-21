import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { SecurityService, SecurityContext } from '../services/security.service';
import { AuditService } from '../services/audit.service';
import { ThreatDetectionService } from '../services/threat-detection.service';

@Injectable()
export class SecurityMiddleware implements NestMiddleware {
  private readonly logger = new Logger(SecurityMiddleware.name);

  constructor(
    private readonly securityService: SecurityService,
    private readonly auditService: AuditService,
    private readonly threatDetectionService: ThreatDetectionService,
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    try {
      // Extract security context from request
      const securityContext = this.extractSecurityContext(req);

      // Validate security context
      const isValid = await this.securityService.validateSecurityContext(securityContext);
      if (!isValid) {
        this.logger.warn(`Security validation failed for ${securityContext.ipAddress}`);
        return res.status(403).json({ error: 'Security validation failed' });
      }

      // Add security context to request
      (req as any).securityContext = securityContext;

      // Log request for audit
      await this.auditService.logDataAccessEvent(
        securityContext.userId,
        securityContext.sessionId,
        'read',
        req.path,
        securityContext.ipAddress,
        securityContext.userAgent,
        true,
        {
          method: req.method,
          headers: this.sanitizeHeaders(req.headers),
          query: this.sanitizeQuery(req.query),
        },
      );

      // Check for suspicious activity
      if (await this.threatDetectionService.detectSuspiciousActivity(securityContext)) {
        this.logger.warn(`Suspicious activity detected for ${securityContext.ipAddress}`);
        await this.securityService.logSecurityEvent({
          type: 'threat_detected',
          severity: 'high',
          description: 'Suspicious activity detected in middleware',
          context: securityContext,
        });
      }

      // Add security headers
      this.addSecurityHeaders(res);

      next();
    } catch (error) {
      this.logger.error('Security middleware error', error);
      return res.status(500).json({ error: 'Internal security error' });
    }
  }

  /**
   * Extract security context from request
   */
  private extractSecurityContext(req: Request): SecurityContext {
    const authHeader = req.headers.authorization;
    const userId = this.extractUserIdFromToken(authHeader);
    const sessionId = this.extractSessionIdFromRequest(req);
    const ipAddress = this.extractIPAddress(req);
    const userAgent = req.headers['user-agent'] || 'unknown';
    const organizationId = this.extractOrganizationIdFromRequest(req);

    return {
      userId,
      sessionId,
      ipAddress,
      userAgent,
      timestamp: new Date(),
      requestId: this.generateRequestId(),
      organizationId,
      roles: this.extractRolesFromRequest(req),
    };
  }

  /**
   * Extract user ID from JWT token
   */
  private extractUserIdFromToken(authHeader?: string): string {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return 'anonymous';
    }

    try {
      const token = authHeader.substring(7);
      // In production, decode JWT token to get user ID
      // For now, return a placeholder
      return 'user-from-token';
    } catch (error) {
      return 'anonymous';
    }
  }

  /**
   * Extract session ID from request
   */
  private extractSessionIdFromRequest(req: Request): string {
    return req.headers['x-session-id'] as string || 'no-session';
  }

  /**
   * Extract IP address from request
   */
  private extractIPAddress(req: Request): string {
    const forwarded = req.headers['x-forwarded-for'];
    if (forwarded) {
      return Array.isArray(forwarded) ? forwarded[0] : forwarded.split(',')[0];
    }
    return req.connection.remoteAddress || req.socket.remoteAddress || 'unknown';
  }

  /**
   * Extract organization ID from request
   */
  private extractOrganizationIdFromRequest(req: Request): string | undefined {
    return req.headers['x-organization-id'] as string;
  }

  /**
   * Extract roles from request
   */
  private extractRolesFromRequest(req: Request): string[] {
    const rolesHeader = req.headers['x-user-roles'];
    if (rolesHeader) {
      return Array.isArray(rolesHeader) ? rolesHeader : rolesHeader.split(',');
    }
    return ['anonymous'];
  }

  /**
   * Generate unique request ID
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Sanitize headers for logging
   */
  private sanitizeHeaders(headers: any): any {
    const sanitized = { ...headers };
    delete sanitized.authorization;
    delete sanitized.cookie;
    delete sanitized['x-api-key'];
    return sanitized;
  }

  /**
   * Sanitize query parameters for logging
   */
  private sanitizeQuery(query: any): any {
    const sanitized = { ...query };
    delete sanitized.password;
    delete sanitized.token;
    delete sanitized.secret;
    return sanitized;
  }

  /**
   * Add security headers to response
   */
  private addSecurityHeaders(res: Response): void {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Content-Security-Policy', "default-src 'self'");
    res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  }
}
