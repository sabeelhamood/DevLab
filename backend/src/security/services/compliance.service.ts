import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SecurityEvent } from './security.service';

export interface ComplianceRequirement {
  id: string;
  standard: 'GDPR' | 'CCPA' | 'ISO27001' | 'SOC2' | 'HIPAA' | 'PCI-DSS';
  requirement: string;
  description: string;
  implementation: string;
  status: 'implemented' | 'partial' | 'not_implemented';
  lastAudit: Date;
  nextAudit: Date;
}

export interface DataClassification {
  id: string;
  name: string;
  level: 'public' | 'internal' | 'confidential' | 'restricted';
  description: string;
  retentionPeriod: number; // days
  encryptionRequired: boolean;
  accessControls: string[];
}

export interface PrivacyPolicy {
  id: string;
  version: string;
  effectiveDate: Date;
  dataTypes: string[];
  purposes: string[];
  legalBasis: string[];
  retentionPeriods: { [key: string]: number };
  rights: string[];
  contactInfo: string;
}

@Injectable()
export class ComplianceService {
  private readonly logger = new Logger(ComplianceService.name);
  private readonly complianceRequirements: Map<string, ComplianceRequirement> = new Map();
  private readonly dataClassifications: Map<string, DataClassification> = new Map();
  private readonly privacyPolicy: PrivacyPolicy;
  private readonly dataProcessingActivities: Map<string, any> = new Map();

  constructor(private readonly configService: ConfigService) {
    this.initializeComplianceRequirements();
    this.initializeDataClassifications();
    this.privacyPolicy = this.initializePrivacyPolicy();
  }

  /**
   * Initialize compliance requirements
   */
  private initializeComplianceRequirements(): void {
    const requirements: ComplianceRequirement[] = [
      {
        id: 'gdpr-consent',
        standard: 'GDPR',
        requirement: 'Lawful basis for processing',
        description: 'Ensure all data processing has a lawful basis',
        implementation: 'Consent management system with explicit opt-in',
        status: 'implemented',
        lastAudit: new Date(),
        nextAudit: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
      },
      {
        id: 'gdpr-data-minimization',
        standard: 'GDPR',
        requirement: 'Data minimization',
        description: 'Collect only necessary data for specified purposes',
        implementation: 'Data collection forms with minimal required fields',
        status: 'implemented',
        lastAudit: new Date(),
        nextAudit: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      },
      {
        id: 'gdpr-right-to-erasure',
        standard: 'GDPR',
        requirement: 'Right to erasure',
        description: 'Provide mechanism for data deletion',
        implementation: 'Data deletion API with audit trail',
        status: 'implemented',
        lastAudit: new Date(),
        nextAudit: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      },
      {
        id: 'iso27001-access-control',
        standard: 'ISO27001',
        requirement: 'Access control',
        description: 'Implement role-based access control',
        implementation: 'RBAC system with principle of least privilege',
        status: 'implemented',
        lastAudit: new Date(),
        nextAudit: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      },
      {
        id: 'iso27001-encryption',
        standard: 'ISO27001',
        requirement: 'Data encryption',
        description: 'Encrypt data at rest and in transit',
        implementation: 'AES-256 encryption for data at rest, TLS 1.3 for transit',
        status: 'implemented',
        lastAudit: new Date(),
        nextAudit: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      },
      {
        id: 'soc2-availability',
        standard: 'SOC2',
        requirement: 'System availability',
        description: 'Maintain 99.9% uptime',
        implementation: 'High availability architecture with redundancy',
        status: 'implemented',
        lastAudit: new Date(),
        nextAudit: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      },
    ];

    requirements.forEach(req => {
      this.complianceRequirements.set(req.id, req);
    });

    this.logger.log('Compliance requirements initialized');
  }

  /**
   * Initialize data classifications
   */
  private initializeDataClassifications(): void {
    const classifications: DataClassification[] = [
      {
        id: 'public',
        name: 'Public Data',
        level: 'public',
        description: 'Data that can be freely shared',
        retentionPeriod: 365,
        encryptionRequired: false,
        accessControls: ['authenticated'],
      },
      {
        id: 'internal',
        name: 'Internal Data',
        level: 'internal',
        description: 'Data for internal use only',
        retentionPeriod: 2555, // 7 years
        encryptionRequired: true,
        accessControls: ['authenticated', 'internal'],
      },
      {
        id: 'confidential',
        name: 'Confidential Data',
        level: 'confidential',
        description: 'Sensitive business data',
        retentionPeriod: 2555, // 7 years
        encryptionRequired: true,
        accessControls: ['authenticated', 'authorized'],
      },
      {
        id: 'restricted',
        name: 'Restricted Data',
        level: 'restricted',
        description: 'Highly sensitive data requiring special handling',
        retentionPeriod: 2555, // 7 years
        encryptionRequired: true,
        accessControls: ['authenticated', 'authorized', 'restricted'],
      },
    ];

    classifications.forEach(classification => {
      this.dataClassifications.set(classification.id, classification);
    });

    this.logger.log('Data classifications initialized');
  }

  /**
   * Initialize privacy policy
   */
  private initializePrivacyPolicy(): PrivacyPolicy {
    return {
      id: 'privacy-policy-v1',
      version: '1.0',
      effectiveDate: new Date(),
      dataTypes: [
        'Personal identification information',
        'Learning progress data',
        'Code submissions',
        'Performance metrics',
        'Usage analytics',
      ],
      purposes: [
        'Provide learning services',
        'Personalize learning experience',
        'Track progress and performance',
        'Improve platform functionality',
        'Comply with legal obligations',
      ],
      legalBasis: [
        'Consent',
        'Contract performance',
        'Legitimate interest',
        'Legal obligation',
      ],
      retentionPeriods: {
        'Personal identification information': 2555, // 7 years
        'Learning progress data': 2555, // 7 years
        'Code submissions': 365, // 1 year
        'Performance metrics': 2555, // 7 years
        'Usage analytics': 365, // 1 year
      },
      rights: [
        'Right to access',
        'Right to rectification',
        'Right to erasure',
        'Right to restrict processing',
        'Right to data portability',
        'Right to object',
      ],
      contactInfo: 'privacy@devlab.com',
    };
  }

  /**
   * Process security event for compliance
   */
  async processSecurityEvent(event: SecurityEvent): Promise<void> {
    try {
      // Log event for compliance audit
      await this.logComplianceEvent(event);

      // Check for compliance violations
      await this.checkComplianceViolations(event);

      // Update data processing activities
      await this.updateDataProcessingActivities(event);

      this.logger.log(`Compliance event processed: ${event.type}`);
    } catch (error) {
      this.logger.error('Failed to process compliance event', error);
    }
  }

  /**
   * Log compliance event
   */
  private async logComplianceEvent(event: SecurityEvent): Promise<void> {
    // In production, this would log to a compliance audit system
    this.logger.log(`Compliance event logged: ${event.type} - ${event.severity}`);
  }

  /**
   * Check for compliance violations
   */
  private async checkComplianceViolations(event: SecurityEvent): Promise<void> {
    // Check GDPR violations
    if (event.type === 'data_access' && event.severity === 'high') {
      this.logger.warn('Potential GDPR violation detected');
    }

    // Check ISO 27001 violations
    if (event.type === 'authorization' && event.severity === 'critical') {
      this.logger.warn('Potential ISO 27001 violation detected');
    }

    // Check SOC 2 violations
    if (event.type === 'threat_detected' && event.severity === 'critical') {
      this.logger.warn('Potential SOC 2 violation detected');
    }
  }

  /**
   * Update data processing activities
   */
  private async updateDataProcessingActivities(event: SecurityEvent): Promise<void> {
    const activityKey = `${event.context.userId}:${event.type}`;
    const activity = this.dataProcessingActivities.get(activityKey) || {
      userId: event.context.userId,
      activityType: event.type,
      count: 0,
      lastProcessed: new Date(),
      dataTypes: [],
    };

    activity.count++;
    activity.lastProcessed = new Date();
    activity.dataTypes.push(event.type);

    this.dataProcessingActivities.set(activityKey, activity);
  }

  /**
   * Get compliance status
   */
  getComplianceStatus(): any {
    const requirements = Array.from(this.complianceRequirements.values());
    const implemented = requirements.filter(r => r.status === 'implemented').length;
    const partial = requirements.filter(r => r.status === 'partial').length;
    const notImplemented = requirements.filter(r => r.status === 'not_implemented').length;

    return {
      total: requirements.length,
      implemented,
      partial,
      notImplemented,
      complianceRate: (implemented / requirements.length) * 100,
      standards: {
        GDPR: requirements.filter(r => r.standard === 'GDPR').length,
        ISO27001: requirements.filter(r => r.standard === 'ISO27001').length,
        SOC2: requirements.filter(r => r.standard === 'SOC2').length,
      },
    };
  }

  /**
   * Get compliance requirements
   */
  getComplianceRequirements(): ComplianceRequirement[] {
    return Array.from(this.complianceRequirements.values());
  }

  /**
   * Update compliance requirement
   */
  async updateComplianceRequirement(requirementId: string, updates: Partial<ComplianceRequirement>): Promise<void> {
    const requirement = this.complianceRequirements.get(requirementId);
    if (!requirement) {
      throw new Error(`Compliance requirement not found: ${requirementId}`);
    }

    const updatedRequirement = { ...requirement, ...updates };
    this.complianceRequirements.set(requirementId, updatedRequirement);

    this.logger.log(`Compliance requirement updated: ${requirementId}`);
  }

  /**
   * Get data classifications
   */
  getDataClassifications(): DataClassification[] {
    return Array.from(this.dataClassifications.values());
  }

  /**
   * Classify data
   */
  classifyData(dataType: string, content: any): DataClassification {
    // Simple classification logic - in production, use ML-based classification
    if (dataType.includes('personal') || dataType.includes('user')) {
      return this.dataClassifications.get('confidential')!;
    } else if (dataType.includes('code') || dataType.includes('submission')) {
      return this.dataClassifications.get('internal')!;
    } else if (dataType.includes('public') || dataType.includes('general')) {
      return this.dataClassifications.get('public')!;
    } else {
      return this.dataClassifications.get('internal')!;
    }
  }

  /**
   * Get privacy policy
   */
  getPrivacyPolicy(): PrivacyPolicy {
    return this.privacyPolicy;
  }

  /**
   * Check data retention compliance
   */
  async checkDataRetentionCompliance(): Promise<any> {
    const now = new Date();
    const violations: any[] = [];

    for (const [key, activity] of this.dataProcessingActivities.entries()) {
      const dataType = activity.dataTypes[0];
      const retentionPeriod = this.privacyPolicy.retentionPeriods[dataType];
      
      if (retentionPeriod) {
        const daysSinceLastProcessed = Math.floor(
          (now.getTime() - activity.lastProcessed.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (daysSinceLastProcessed > retentionPeriod) {
          violations.push({
            activityKey: key,
            dataType,
            daysSinceLastProcessed,
            retentionPeriod,
            violation: 'Data retention period exceeded',
          });
        }
      }
    }

    return {
      violations,
      totalActivities: this.dataProcessingActivities.size,
      complianceRate: violations.length === 0 ? 100 : ((this.dataProcessingActivities.size - violations.length) / this.dataProcessingActivities.size) * 100,
    };
  }

  /**
   * Generate compliance report
   */
  async generateComplianceReport(): Promise<any> {
    const complianceStatus = this.getComplianceStatus();
    const dataRetentionCompliance = await this.checkDataRetentionCompliance();
    const dataProcessingActivities = Array.from(this.dataProcessingActivities.values());

    return {
      reportDate: new Date(),
      complianceStatus,
      dataRetentionCompliance,
      dataProcessingActivities,
      recommendations: this.generateRecommendations(complianceStatus, dataRetentionCompliance),
    };
  }

  /**
   * Generate compliance recommendations
   */
  private generateRecommendations(complianceStatus: any, dataRetentionCompliance: any): string[] {
    const recommendations: string[] = [];

    if (complianceStatus.complianceRate < 100) {
      recommendations.push('Implement remaining compliance requirements');
    }

    if (dataRetentionCompliance.complianceRate < 100) {
      recommendations.push('Review and update data retention policies');
    }

    if (complianceStatus.partial > 0) {
      recommendations.push('Complete partially implemented compliance requirements');
    }

    return recommendations;
  }

  /**
   * Get data processing activities
   */
  getDataProcessingActivities(): any[] {
    return Array.from(this.dataProcessingActivities.values());
  }

  /**
   * Clean up expired data processing activities
   */
  async cleanupExpiredDataProcessingActivities(): Promise<void> {
    const now = new Date();
    const maxAge = 365 * 24 * 60 * 60 * 1000; // 1 year

    for (const [key, activity] of this.dataProcessingActivities.entries()) {
      if (now.getTime() - activity.lastProcessed.getTime() > maxAge) {
        this.dataProcessingActivities.delete(key);
      }
    }

    this.logger.log('Expired data processing activities cleaned up');
  }
}
