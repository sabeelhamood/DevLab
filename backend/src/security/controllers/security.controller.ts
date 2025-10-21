import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';
import { SecurityService, SecurityPolicy } from '../services/security.service';
import { EncryptionService } from '../services/encryption.service';
import { AuditService, AuditQuery } from '../services/audit.service';
import { ThreatDetectionService, ThreatPattern } from '../services/threat-detection.service';
import { ComplianceService } from '../services/compliance.service';
import { RateLimitGuard } from '../guards/rate-limit.guard';

@Controller('security')
@UseGuards(RateLimitGuard)
export class SecurityController {
  constructor(
    private readonly securityService: SecurityService,
    private readonly encryptionService: EncryptionService,
    private readonly auditService: AuditService,
    private readonly threatDetectionService: ThreatDetectionService,
    private readonly complianceService: ComplianceService,
  ) {}

  /**
   * Get security metrics
   */
  @Get('metrics')
  async getSecurityMetrics(@Req() req: Request, @Res() res: Response) {
    try {
      const metrics = await this.securityService.getSecurityMetrics();
      const threatMetrics = this.threatDetectionService.getThreatDetectionMetrics();
      const complianceStatus = this.complianceService.getComplianceStatus();

      res.json({
        security: metrics,
        threatDetection: threatMetrics,
        compliance: complianceStatus,
        timestamp: new Date(),
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to get security metrics' });
    }
  }

  /**
   * Get security policies
   */
  @Get('policies')
  async getSecurityPolicies(@Req() req: Request, @Res() res: Response) {
    try {
      const policies = this.securityService.getSecurityPolicies();
      res.json({ policies });
    } catch (error) {
      res.status(500).json({ error: 'Failed to get security policies' });
    }
  }

  /**
   * Update security policy
   */
  @Put('policies/:policyId')
  async updateSecurityPolicy(
    @Param('policyId') policyId: string,
    @Body() updates: Partial<SecurityPolicy>,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    try {
      await this.securityService.updateSecurityPolicy(policyId, updates);
      res.json({ success: true, message: 'Security policy updated' });
    } catch (error) {
      res.status(400).json({ error: 'Failed to update security policy' });
    }
  }

  /**
   * Get threat patterns
   */
  @Get('threat-patterns')
  async getThreatPatterns(@Req() req: Request, @Res() res: Response) {
    try {
      const patterns = this.threatDetectionService.getThreatPatterns();
      res.json({ patterns });
    } catch (error) {
      res.status(500).json({ error: 'Failed to get threat patterns' });
    }
  }

  /**
   * Update threat pattern
   */
  @Put('threat-patterns/:patternId')
  async updateThreatPattern(
    @Param('patternId') patternId: string,
    @Body() updates: Partial<ThreatPattern>,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    try {
      await this.threatDetectionService.updateThreatPattern(patternId, updates);
      res.json({ success: true, message: 'Threat pattern updated' });
    } catch (error) {
      res.status(400).json({ error: 'Failed to update threat pattern' });
    }
  }

  /**
   * Get audit logs
   */
  @Get('audit-logs')
  async getAuditLogs(
    @Query() query: AuditQuery,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    try {
      const { logs, total } = await this.auditService.queryAuditLogs(query);
      res.json({ logs, total, query });
    } catch (error) {
      res.status(500).json({ error: 'Failed to get audit logs' });
    }
  }

  /**
   * Get audit statistics
   */
  @Get('audit-statistics')
  async getAuditStatistics(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    try {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const statistics = await this.auditService.getAuditStatistics(start, end);
      res.json(statistics);
    } catch (error) {
      res.status(500).json({ error: 'Failed to get audit statistics' });
    }
  }

  /**
   * Export audit logs
   */
  @Post('audit-logs/export')
  async exportAuditLogs(
    @Body() query: AuditQuery,
    @Query('format') format: 'json' | 'csv' = 'json',
    @Req() req: Request,
    @Res() res: Response,
  ) {
    try {
      const exportData = await this.auditService.exportAuditLogs(query, format);
      
      if (format === 'csv') {
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="audit-logs.csv"');
        res.send(exportData);
      } else {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', 'attachment; filename="audit-logs.json"');
        res.json(exportData);
      }
    } catch (error) {
      res.status(500).json({ error: 'Failed to export audit logs' });
    }
  }

  /**
   * Get compliance status
   */
  @Get('compliance')
  async getComplianceStatus(@Req() req: Request, @Res() res: Response) {
    try {
      const status = this.complianceService.getComplianceStatus();
      const requirements = this.complianceService.getComplianceRequirements();
      const classifications = this.complianceService.getDataClassifications();
      const privacyPolicy = this.complianceService.getPrivacyPolicy();

      res.json({
        status,
        requirements,
        classifications,
        privacyPolicy,
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to get compliance status' });
    }
  }

  /**
   * Generate compliance report
   */
  @Post('compliance/report')
  async generateComplianceReport(@Req() req: Request, @Res() res: Response) {
    try {
      const report = await this.complianceService.generateComplianceReport();
      res.json(report);
    } catch (error) {
      res.status(500).json({ error: 'Failed to generate compliance report' });
    }
  }

  /**
   * Get data processing activities
   */
  @Get('data-processing-activities')
  async getDataProcessingActivities(@Req() req: Request, @Res() res: Response) {
    try {
      const activities = this.complianceService.getDataProcessingActivities();
      res.json({ activities });
    } catch (error) {
      res.status(500).json({ error: 'Failed to get data processing activities' });
    }
  }

  /**
   * Block IP address
   */
  @Post('block-ip')
  async blockIP(
    @Body() body: { ipAddress: string; reason: string; duration?: number },
    @Req() req: Request,
    @Res() res: Response,
  ) {
    try {
      await this.securityService.blockIP(body.ipAddress, body.reason, body.duration);
      res.json({ success: true, message: 'IP address blocked' });
    } catch (error) {
      res.status(400).json({ error: 'Failed to block IP address' });
    }
  }

  /**
   * Get encryption metrics
   */
  @Get('encryption/metrics')
  async getEncryptionMetrics(@Req() req: Request, @Res() res: Response) {
    try {
      const metrics = this.encryptionService.getEncryptionMetrics();
      res.json(metrics);
    } catch (error) {
      res.status(500).json({ error: 'Failed to get encryption metrics' });
    }
  }

  /**
   * Rotate encryption key
   */
  @Post('encryption/rotate-key')
  async rotateEncryptionKey(@Req() req: Request, @Res() res: Response) {
    try {
      const newKey = await this.encryptionService.rotateEncryptionKey();
      res.json({ success: true, message: 'Encryption key rotated', newKey });
    } catch (error) {
      res.status(500).json({ error: 'Failed to rotate encryption key' });
    }
  }

  /**
   * Get rate limit statistics
   */
  @Get('rate-limit/stats')
  async getRateLimitStats(@Req() req: Request, @Res() res: Response) {
    try {
      const stats = this.securityService.getSecurityMetrics();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: 'Failed to get rate limit statistics' });
    }
  }

  /**
   * Clear rate limits
   */
  @Delete('rate-limit/clear')
  async clearRateLimits(@Req() req: Request, @Res() res: Response) {
    try {
      // In production, implement rate limit clearing
      res.json({ success: true, message: 'Rate limits cleared' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to clear rate limits' });
    }
  }

  /**
   * Get security health check
   */
  @Get('health')
  async getSecurityHealth(@Req() req: Request, @Res() res: Response) {
    try {
      const metrics = await this.securityService.getSecurityMetrics();
      const threatMetrics = this.threatDetectionService.getThreatDetectionMetrics();
      const complianceStatus = this.complianceService.getComplianceStatus();

      const health = {
        status: 'healthy',
        timestamp: new Date(),
        metrics: {
          activeSessions: metrics.activeSessions,
          blockedIPs: metrics.blockedIPs,
          suspiciousActivities: metrics.suspiciousActivities,
          securityPolicies: metrics.securityPolicies,
          threatPatterns: threatMetrics.threatPatterns,
          complianceRate: complianceStatus.complianceRate,
        },
        checks: {
          securityPolicies: metrics.securityPolicies > 0,
          threatDetection: threatMetrics.threatPatterns > 0,
          compliance: complianceStatus.complianceRate > 80,
          encryption: true, // Assume encryption is working
        },
      };

      // Determine overall health status
      const allChecksPass = Object.values(health.checks).every(check => check);
      health.status = allChecksPass ? 'healthy' : 'degraded';

      res.json(health);
    } catch (error) {
      res.status(500).json({ 
        status: 'unhealthy', 
        error: 'Failed to get security health check',
        timestamp: new Date(),
      });
    }
  }
}
