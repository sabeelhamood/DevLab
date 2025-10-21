import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EncryptionService } from './encryption.service';
import { AuditService } from './audit.service';
import { ThreatDetectionService } from './threat-detection.service';
import { ComplianceService } from './compliance.service';

export interface SecurityContext {
  userId: string;
  sessionId: string;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
  requestId: string;
  organizationId?: string;
  roles: string[];
}

export interface SecurityEvent {
  type: 'authentication' | 'authorization' | 'data_access' | 'code_execution' | 'threat_detected';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  context: SecurityContext;
  metadata?: Record<string, any>;
}

export interface SecurityPolicy {
  id: string;
  name: string;
  description: string;
  rules: SecurityRule[];
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface SecurityRule {
  id: string;
  name: string;
  condition: string;
  action: 'allow' | 'deny' | 'monitor' | 'alert';
  priority: number;
  enabled: boolean;
}

@Injectable()
export class SecurityService {
  private readonly logger = new Logger(SecurityService.name);
  private readonly securityPolicies: Map<string, SecurityPolicy> = new Map();
  private readonly activeSessions: Map<string, SecurityContext> = new Map();
  private readonly blockedIPs: Set<string> = new Set();
  private readonly suspiciousActivities: Map<string, number> = new Map();

  constructor(
    private readonly configService: ConfigService,
    private readonly encryptionService: EncryptionService,
    private readonly auditService: AuditService,
    private readonly threatDetectionService: ThreatDetectionService,
    private readonly complianceService: ComplianceService,
  ) {
    this.initializeSecurityPolicies();
    this.startSecurityMonitoring();
  }

  /**
   * Initialize default security policies
   */
  private initializeSecurityPolicies(): void {
    const defaultPolicies: SecurityPolicy[] = [
      {
        id: 'auth-failure-limit',
        name: 'Authentication Failure Limit',
        description: 'Block IP after 5 failed authentication attempts',
        rules: [
          {
            id: 'auth-fail-rule',
            name: 'Auth Failure Rule',
            condition: 'auth_failures >= 5',
            action: 'deny',
            priority: 1,
            enabled: true,
          },
        ],
        enabled: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'rate-limit-policy',
        name: 'Rate Limiting Policy',
        description: 'Enforce rate limits on API endpoints',
        rules: [
          {
            id: 'api-rate-limit',
            name: 'API Rate Limit',
            condition: 'requests_per_minute > 100',
            action: 'monitor',
            priority: 2,
            enabled: true,
          },
        ],
        enabled: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'suspicious-activity',
        name: 'Suspicious Activity Detection',
        description: 'Detect and alert on suspicious user behavior',
        rules: [
          {
            id: 'unusual-access-pattern',
            name: 'Unusual Access Pattern',
            condition: 'access_pattern_deviation > 0.8',
            action: 'alert',
            priority: 1,
            enabled: true,
          },
        ],
        enabled: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    defaultPolicies.forEach(policy => {
      this.securityPolicies.set(policy.id, policy);
    });

    this.logger.log('Security policies initialized');
  }

  /**
   * Start security monitoring background tasks
   */
  private startSecurityMonitoring(): void {
    // Monitor for suspicious activities
    setInterval(() => {
      this.monitorSuspiciousActivities();
    }, 60000); // Every minute

    // Clean up expired sessions
    setInterval(() => {
      this.cleanupExpiredSessions();
    }, 300000); // Every 5 minutes

    // Update threat intelligence
    setInterval(() => {
      this.updateThreatIntelligence();
    }, 3600000); // Every hour

    this.logger.log('Security monitoring started');
  }

  /**
   * Validate security context for a request
   */
  async validateSecurityContext(context: SecurityContext): Promise<boolean> {
    try {
      // Check if IP is blocked
      if (this.blockedIPs.has(context.ipAddress)) {
        await this.logSecurityEvent({
          type: 'authorization',
          severity: 'high',
          description: 'Blocked IP attempted access',
          context,
        });
        return false;
      }

      // Check rate limits
      if (!(await this.checkRateLimit(context))) {
        await this.logSecurityEvent({
          type: 'authorization',
          severity: 'medium',
          description: 'Rate limit exceeded',
          context,
        });
        return false;
      }

      // Check for suspicious activity
      if (await this.threatDetectionService.detectSuspiciousActivity(context)) {
        await this.logSecurityEvent({
          type: 'threat_detected',
          severity: 'high',
          description: 'Suspicious activity detected',
          context,
        });
        return false;
      }

      // Apply security policies
      if (!(await this.applySecurityPolicies(context))) {
        return false;
      }

      return true;
    } catch (error) {
      this.logger.error('Security context validation failed', error);
      return false;
    }
  }

  /**
   * Check rate limits for a context
   */
  private async checkRateLimit(context: SecurityContext): Promise<boolean> {
    const key = `rate_limit:${context.ipAddress}:${context.userId}`;
    const currentCount = this.suspiciousActivities.get(key) || 0;
    const maxRequests = this.configService.get<number>('SECURITY_RATE_LIMIT', 100);

    if (currentCount >= maxRequests) {
      return false;
    }

    this.suspiciousActivities.set(key, currentCount + 1);
    return true;
  }

  /**
   * Apply security policies to a context
   */
  private async applySecurityPolicies(context: SecurityContext): Promise<boolean> {
    for (const policy of this.securityPolicies.values()) {
      if (!policy.enabled) continue;

      for (const rule of policy.rules) {
        if (!rule.enabled) continue;

        const shouldApply = await this.evaluateRule(rule, context);
        if (shouldApply) {
          switch (rule.action) {
            case 'allow':
              return true;
            case 'deny':
              return false;
            case 'monitor':
              await this.logSecurityEvent({
                type: 'authorization',
                severity: 'medium',
                description: `Policy triggered: ${rule.name}`,
                context,
              });
              break;
            case 'alert':
              await this.logSecurityEvent({
                type: 'threat_detected',
                severity: 'high',
                description: `Security alert: ${rule.name}`,
                context,
              });
              break;
          }
        }
      }
    }

    return true;
  }

  /**
   * Evaluate a security rule against a context
   */
  private async evaluateRule(rule: SecurityRule, context: SecurityContext): Promise<boolean> {
    // Simple rule evaluation - in production, use a proper rule engine
    switch (rule.condition) {
      case 'auth_failures >= 5':
        return this.suspiciousActivities.get(`auth_failures:${context.ipAddress}`) >= 5;
      case 'requests_per_minute > 100':
        return this.suspiciousActivities.get(`rate_limit:${context.ipAddress}:${context.userId}`) > 100;
      case 'access_pattern_deviation > 0.8':
        return await this.threatDetectionService.calculateAccessPatternDeviation(context) > 0.8;
      default:
        return false;
    }
  }

  /**
   * Log a security event
   */
  async logSecurityEvent(event: SecurityEvent): Promise<void> {
    try {
      // Encrypt sensitive data
      const encryptedEvent = await this.encryptionService.encryptSensitiveData(event);

      // Log to audit service
      await this.auditService.logSecurityEvent(encryptedEvent);

      // Send to threat detection
      await this.threatDetectionService.processSecurityEvent(encryptedEvent);

      // Check compliance requirements
      await this.complianceService.processSecurityEvent(encryptedEvent);

      this.logger.log(`Security event logged: ${event.type} - ${event.severity}`);
    } catch (error) {
      this.logger.error('Failed to log security event', error);
    }
  }

  /**
   * Block an IP address
   */
  async blockIP(ipAddress: string, reason: string, duration?: number): Promise<void> {
    this.blockedIPs.add(ipAddress);
    
    await this.logSecurityEvent({
      type: 'threat_detected',
      severity: 'high',
      description: `IP blocked: ${reason}`,
      context: {
        userId: 'system',
        sessionId: 'system',
        ipAddress,
        userAgent: 'system',
        timestamp: new Date(),
        requestId: 'system',
        roles: ['system'],
      },
    });

    // Auto-unblock after duration if specified
    if (duration) {
      setTimeout(() => {
        this.blockedIPs.delete(ipAddress);
        this.logger.log(`IP ${ipAddress} unblocked after ${duration}ms`);
      }, duration);
    }

    this.logger.warn(`IP ${ipAddress} blocked: ${reason}`);
  }

  /**
   * Monitor suspicious activities
   */
  private async monitorSuspiciousActivities(): Promise<void> {
    const suspiciousThreshold = this.configService.get<number>('SECURITY_SUSPICIOUS_THRESHOLD', 10);
    
    for (const [key, count] of this.suspiciousActivities.entries()) {
      if (count >= suspiciousThreshold) {
        const [type, identifier] = key.split(':');
        
        await this.logSecurityEvent({
          type: 'threat_detected',
          severity: 'high',
          description: `Suspicious activity detected: ${type} for ${identifier}`,
          context: {
            userId: 'system',
            sessionId: 'system',
            ipAddress: identifier,
            userAgent: 'system',
            timestamp: new Date(),
            requestId: 'system',
            roles: ['system'],
          },
        });
      }
    }
  }

  /**
   * Clean up expired sessions
   */
  private cleanupExpiredSessions(): void {
    const now = new Date();
    const sessionTimeout = this.configService.get<number>('SECURITY_SESSION_TIMEOUT', 3600000); // 1 hour

    for (const [sessionId, context] of this.activeSessions.entries()) {
      if (now.getTime() - context.timestamp.getTime() > sessionTimeout) {
        this.activeSessions.delete(sessionId);
        this.logger.log(`Expired session cleaned up: ${sessionId}`);
      }
    }
  }

  /**
   * Update threat intelligence
   */
  private async updateThreatIntelligence(): Promise<void> {
    try {
      await this.threatDetectionService.updateThreatIntelligence();
      this.logger.log('Threat intelligence updated');
    } catch (error) {
      this.logger.error('Failed to update threat intelligence', error);
    }
  }

  /**
   * Get security metrics
   */
  async getSecurityMetrics(): Promise<any> {
    return {
      activeSessions: this.activeSessions.size,
      blockedIPs: this.blockedIPs.size,
      suspiciousActivities: this.suspiciousActivities.size,
      securityPolicies: this.securityPolicies.size,
      timestamp: new Date(),
    };
  }

  /**
   * Get security policies
   */
  getSecurityPolicies(): SecurityPolicy[] {
    return Array.from(this.securityPolicies.values());
  }

  /**
   * Update security policy
   */
  async updateSecurityPolicy(policyId: string, updates: Partial<SecurityPolicy>): Promise<void> {
    const policy = this.securityPolicies.get(policyId);
    if (!policy) {
      throw new Error(`Security policy not found: ${policyId}`);
    }

    const updatedPolicy = { ...policy, ...updates, updatedAt: new Date() };
    this.securityPolicies.set(policyId, updatedPolicy);

    await this.logSecurityEvent({
      type: 'authorization',
      severity: 'medium',
      description: `Security policy updated: ${policyId}`,
      context: {
        userId: 'admin',
        sessionId: 'admin',
        ipAddress: '127.0.0.1',
        userAgent: 'admin',
        timestamp: new Date(),
        requestId: 'admin',
        roles: ['admin'],
      },
    });

    this.logger.log(`Security policy updated: ${policyId}`);
  }
}
