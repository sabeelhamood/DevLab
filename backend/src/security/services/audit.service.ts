import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from '../entities/audit-log.entity';
import { SecurityEvent } from './security.service';

export interface AuditEvent {
  id: string;
  userId: string;
  sessionId: string;
  action: string;
  resource: string;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
  success: boolean;
  details?: Record<string, any>;
  metadata?: Record<string, any>;
}

export interface AuditQuery {
  userId?: string;
  action?: string;
  resource?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);
  private readonly auditRetentionDays: number;

  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(AuditLog)
    private readonly auditLogRepository: Repository<AuditLog>,
  ) {
    this.auditRetentionDays = this.configService.get<number>('AUDIT_RETENTION_DAYS', 2555); // 7 years
  }

  /**
   * Log a security event
   */
  async logSecurityEvent(event: SecurityEvent): Promise<void> {
    try {
      const auditLog = this.auditLogRepository.create({
        id: this.generateAuditId(),
        userId: event.context.userId,
        sessionId: event.context.sessionId,
        action: event.type,
        resource: 'security',
        ipAddress: event.context.ipAddress,
        userAgent: event.context.userAgent,
        timestamp: event.context.timestamp,
        success: event.severity !== 'critical',
        details: {
          severity: event.severity,
          description: event.description,
          metadata: event.metadata,
        },
        metadata: {
          requestId: event.context.requestId,
          organizationId: event.context.organizationId,
          roles: event.context.roles,
        },
      });

      await this.auditLogRepository.save(auditLog);
      this.logger.log(`Security event logged: ${event.type}`);
    } catch (error) {
      this.logger.error('Failed to log security event', error);
    }
  }

  /**
   * Log authentication event
   */
  async logAuthenticationEvent(
    userId: string,
    sessionId: string,
    action: 'login' | 'logout' | 'token_refresh' | 'password_change',
    ipAddress: string,
    userAgent: string,
    success: boolean,
    details?: Record<string, any>,
  ): Promise<void> {
    try {
      const auditLog = this.auditLogRepository.create({
        id: this.generateAuditId(),
        userId,
        sessionId,
        action,
        resource: 'authentication',
        ipAddress,
        userAgent,
        timestamp: new Date(),
        success,
        details,
        metadata: {
          eventType: 'authentication',
        },
      });

      await this.auditLogRepository.save(auditLog);
      this.logger.log(`Authentication event logged: ${action} for user ${userId}`);
    } catch (error) {
      this.logger.error('Failed to log authentication event', error);
    }
  }

  /**
   * Log data access event
   */
  async logDataAccessEvent(
    userId: string,
    sessionId: string,
    action: 'read' | 'write' | 'delete' | 'export',
    resource: string,
    ipAddress: string,
    userAgent: string,
    success: boolean,
    details?: Record<string, any>,
  ): Promise<void> {
    try {
      const auditLog = this.auditLogRepository.create({
        id: this.generateAuditId(),
        userId,
        sessionId,
        action,
        resource,
        ipAddress,
        userAgent,
        timestamp: new Date(),
        success,
        details,
        metadata: {
          eventType: 'data_access',
        },
      });

      await this.auditLogRepository.save(auditLog);
      this.logger.log(`Data access event logged: ${action} on ${resource} by user ${userId}`);
    } catch (error) {
      this.logger.error('Failed to log data access event', error);
    }
  }

  /**
   * Log code execution event
   */
  async logCodeExecutionEvent(
    userId: string,
    sessionId: string,
    questionId: string,
    language: string,
    ipAddress: string,
    userAgent: string,
    success: boolean,
    executionTime?: number,
    details?: Record<string, any>,
  ): Promise<void> {
    try {
      const auditLog = this.auditLogRepository.create({
        id: this.generateAuditId(),
        userId,
        sessionId,
        action: 'code_execution',
        resource: `question:${questionId}`,
        ipAddress,
        userAgent,
        timestamp: new Date(),
        success,
        details: {
          language,
          executionTime,
          ...details,
        },
        metadata: {
          eventType: 'code_execution',
          questionId,
        },
      });

      await this.auditLogRepository.save(auditLog);
      this.logger.log(`Code execution event logged: ${language} for user ${userId}`);
    } catch (error) {
      this.logger.error('Failed to log code execution event', error);
    }
  }

  /**
   * Log administrative action
   */
  async logAdministrativeAction(
    adminUserId: string,
    sessionId: string,
    action: string,
    resource: string,
    ipAddress: string,
    userAgent: string,
    success: boolean,
    details?: Record<string, any>,
  ): Promise<void> {
    try {
      const auditLog = this.auditLogRepository.create({
        id: this.generateAuditId(),
        userId: adminUserId,
        sessionId,
        action,
        resource,
        ipAddress,
        userAgent,
        timestamp: new Date(),
        success,
        details,
        metadata: {
          eventType: 'administrative',
          isAdmin: true,
        },
      });

      await this.auditLogRepository.save(auditLog);
      this.logger.log(`Administrative action logged: ${action} by admin ${adminUserId}`);
    } catch (error) {
      this.logger.error('Failed to log administrative action', error);
    }
  }

  /**
   * Query audit logs
   */
  async queryAuditLogs(query: AuditQuery): Promise<{ logs: AuditLog[]; total: number }> {
    try {
      const queryBuilder = this.auditLogRepository.createQueryBuilder('audit');

      if (query.userId) {
        queryBuilder.andWhere('audit.userId = :userId', { userId: query.userId });
      }

      if (query.action) {
        queryBuilder.andWhere('audit.action = :action', { action: query.action });
      }

      if (query.resource) {
        queryBuilder.andWhere('audit.resource = :resource', { resource: query.resource });
      }

      if (query.startDate) {
        queryBuilder.andWhere('audit.timestamp >= :startDate', { startDate: query.startDate });
      }

      if (query.endDate) {
        queryBuilder.andWhere('audit.timestamp <= :endDate', { endDate: query.endDate });
      }

      queryBuilder.orderBy('audit.timestamp', 'DESC');

      if (query.limit) {
        queryBuilder.limit(query.limit);
      }

      if (query.offset) {
        queryBuilder.offset(query.offset);
      }

      const [logs, total] = await queryBuilder.getManyAndCount();

      return { logs, total };
    } catch (error) {
      this.logger.error('Failed to query audit logs', error);
      throw new Error('Failed to query audit logs');
    }
  }

  /**
   * Get audit statistics
   */
  async getAuditStatistics(startDate: Date, endDate: Date): Promise<any> {
    try {
      const queryBuilder = this.auditLogRepository.createQueryBuilder('audit')
        .where('audit.timestamp >= :startDate', { startDate })
        .andWhere('audit.timestamp <= :endDate', { endDate });

      const totalEvents = await queryBuilder.getCount();

      const successEvents = await queryBuilder
        .andWhere('audit.success = :success', { success: true })
        .getCount();

      const failureEvents = totalEvents - successEvents;

      const actionStats = await queryBuilder
        .select('audit.action', 'action')
        .addSelect('COUNT(*)', 'count')
        .groupBy('audit.action')
        .getRawMany();

      const resourceStats = await queryBuilder
        .select('audit.resource', 'resource')
        .addSelect('COUNT(*)', 'count')
        .groupBy('audit.resource')
        .getRawMany();

      return {
        totalEvents,
        successEvents,
        failureEvents,
        successRate: totalEvents > 0 ? (successEvents / totalEvents) * 100 : 0,
        actionStats,
        resourceStats,
        period: { startDate, endDate },
      };
    } catch (error) {
      this.logger.error('Failed to get audit statistics', error);
      throw new Error('Failed to get audit statistics');
    }
  }

  /**
   * Export audit logs
   */
  async exportAuditLogs(query: AuditQuery, format: 'json' | 'csv' = 'json'): Promise<string> {
    try {
      const { logs } = await this.queryAuditLogs(query);

      if (format === 'json') {
        return JSON.stringify(logs, null, 2);
      } else if (format === 'csv') {
        const headers = ['ID', 'User ID', 'Session ID', 'Action', 'Resource', 'IP Address', 'User Agent', 'Timestamp', 'Success'];
        const rows = logs.map(log => [
          log.id,
          log.userId,
          log.sessionId,
          log.action,
          log.resource,
          log.ipAddress,
          log.userAgent,
          log.timestamp.toISOString(),
          log.success,
        ]);

        const csvContent = [headers, ...rows]
          .map(row => row.map(field => `"${field}"`).join(','))
          .join('\n');

        return csvContent;
      }

      throw new Error('Unsupported export format');
    } catch (error) {
      this.logger.error('Failed to export audit logs', error);
      throw new Error('Failed to export audit logs');
    }
  }

  /**
   * Clean up old audit logs
   */
  async cleanupOldAuditLogs(): Promise<void> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - this.auditRetentionDays);

      const result = await this.auditLogRepository
        .createQueryBuilder()
        .delete()
        .where('timestamp < :cutoffDate', { cutoffDate })
        .execute();

      this.logger.log(`Cleaned up ${result.affected} old audit logs`);
    } catch (error) {
      this.logger.error('Failed to cleanup old audit logs', error);
    }
  }

  /**
   * Generate unique audit ID
   */
  private generateAuditId(): string {
    return `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get audit retention policy
   */
  getAuditRetentionPolicy(): any {
    return {
      retentionDays: this.auditRetentionDays,
      retentionReason: 'Compliance and security requirements',
      lastCleanup: new Date(),
    };
  }
}
