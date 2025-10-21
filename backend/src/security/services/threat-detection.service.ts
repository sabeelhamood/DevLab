import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SecurityContext, SecurityEvent } from './security.service';

export interface ThreatPattern {
  id: string;
  name: string;
  description: string;
  pattern: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ThreatIntelligence {
  id: string;
  type: 'ip' | 'domain' | 'email' | 'hash';
  value: string;
  threatLevel: 'low' | 'medium' | 'high' | 'critical';
  source: string;
  description: string;
  firstSeen: Date;
  lastSeen: Date;
  tags: string[];
}

export interface BehavioralAnalysis {
  userId: string;
  sessionId: string;
  deviationScore: number;
  riskFactors: string[];
  recommendations: string[];
  timestamp: Date;
}

@Injectable()
export class ThreatDetectionService {
  private readonly logger = new Logger(ThreatDetectionService.name);
  private readonly threatPatterns: Map<string, ThreatPattern> = new Map();
  private readonly threatIntelligence: Map<string, ThreatIntelligence> = new Map();
  private readonly userBehaviorProfiles: Map<string, any> = new Map();
  private readonly suspiciousActivities: Map<string, number> = new Map();

  constructor(private readonly configService: ConfigService) {
    this.initializeThreatPatterns();
    this.startThreatMonitoring();
  }

  /**
   * Initialize default threat patterns
   */
  private initializeThreatPatterns(): void {
    const defaultPatterns: ThreatPattern[] = [
      {
        id: 'sql-injection',
        name: 'SQL Injection Attempt',
        description: 'Detects SQL injection patterns in user input',
        pattern: '(\b(union|select|insert|update|delete|drop|create|alter|exec|execute)\b)',
        severity: 'high',
        enabled: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'xss-attack',
        name: 'XSS Attack Attempt',
        description: 'Detects cross-site scripting patterns',
        pattern: '(<script|javascript:|on\w+\s*=)',
        severity: 'high',
        enabled: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'path-traversal',
        name: 'Path Traversal Attempt',
        description: 'Detects directory traversal patterns',
        pattern: '(\\.\\./|\\.\\.\\\\|%2e%2e%2f|%2e%2e%5c)',
        severity: 'medium',
        enabled: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'command-injection',
        name: 'Command Injection Attempt',
        description: 'Detects command injection patterns',
        pattern: '(\\||&|;|`|\\$\\()',
        severity: 'high',
        enabled: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'brute-force',
        name: 'Brute Force Attack',
        description: 'Detects multiple failed authentication attempts',
        pattern: 'auth_failures >= 5',
        severity: 'medium',
        enabled: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    defaultPatterns.forEach(pattern => {
      this.threatPatterns.set(pattern.id, pattern);
    });

    this.logger.log('Threat patterns initialized');
  }

  /**
   * Start threat monitoring background tasks
   */
  private startThreatMonitoring(): void {
    // Monitor for threat patterns
    setInterval(() => {
      this.analyzeThreatPatterns();
    }, 30000); // Every 30 seconds

    // Update threat intelligence
    setInterval(() => {
      this.updateThreatIntelligence();
    }, 3600000); // Every hour

    // Analyze user behavior
    setInterval(() => {
      this.analyzeUserBehavior();
    }, 300000); // Every 5 minutes

    this.logger.log('Threat monitoring started');
  }

  /**
   * Detect suspicious activity in a security context
   */
  async detectSuspiciousActivity(context: SecurityContext): Promise<boolean> {
    try {
      // Check threat intelligence
      if (await this.checkThreatIntelligence(context)) {
        return true;
      }

      // Check threat patterns
      if (await this.checkThreatPatterns(context)) {
        return true;
      }

      // Check behavioral analysis
      if (await this.checkBehavioralAnalysis(context)) {
        return true;
      }

      // Check rate limiting
      if (await this.checkRateLimiting(context)) {
        return true;
      }

      return false;
    } catch (error) {
      this.logger.error('Threat detection failed', error);
      return false;
    }
  }

  /**
   * Check threat intelligence
   */
  private async checkThreatIntelligence(context: SecurityContext): Promise<boolean> {
    // Check IP against threat intelligence
    const ipThreat = this.threatIntelligence.get(`ip:${context.ipAddress}`);
    if (ipThreat && ipThreat.threatLevel === 'high') {
      this.logger.warn(`Threat intelligence match: ${context.ipAddress}`);
      return true;
    }

    // Check user agent against threat intelligence
    const uaThreat = this.threatIntelligence.get(`ua:${context.userAgent}`);
    if (uaThreat && uaThreat.threatLevel === 'high') {
      this.logger.warn(`Threat intelligence match: ${context.userAgent}`);
      return true;
    }

    return false;
  }

  /**
   * Check threat patterns
   */
  private async checkThreatPatterns(context: SecurityContext): Promise<boolean> {
    for (const pattern of this.threatPatterns.values()) {
      if (!pattern.enabled) continue;

      // Check user agent against patterns
      if (this.matchesPattern(context.userAgent, pattern.pattern)) {
        this.logger.warn(`Threat pattern match: ${pattern.name} in user agent`);
        return true;
      }

      // Check IP against patterns
      if (this.matchesPattern(context.ipAddress, pattern.pattern)) {
        this.logger.warn(`Threat pattern match: ${pattern.name} in IP`);
        return true;
      }
    }

    return false;
  }

  /**
   * Check behavioral analysis
   */
  private async checkBehavioralAnalysis(context: SecurityContext): Promise<boolean> {
    const deviationScore = await this.calculateAccessPatternDeviation(context);
    
    if (deviationScore > 0.8) {
      this.logger.warn(`High behavioral deviation: ${deviationScore} for user ${context.userId}`);
      return true;
    }

    return false;
  }

  /**
   * Check rate limiting
   */
  private async checkRateLimiting(context: SecurityContext): Promise<boolean> {
    const key = `rate_limit:${context.ipAddress}:${context.userId}`;
    const currentCount = this.suspiciousActivities.get(key) || 0;
    const maxRequests = this.configService.get<number>('SECURITY_RATE_LIMIT', 100);

    if (currentCount >= maxRequests) {
      this.logger.warn(`Rate limit exceeded: ${currentCount} requests from ${context.ipAddress}`);
      return true;
    }

    return false;
  }

  /**
   * Calculate access pattern deviation
   */
  async calculateAccessPatternDeviation(context: SecurityContext): Promise<number> {
    try {
      const userProfile = this.userBehaviorProfiles.get(context.userId);
      if (!userProfile) {
        // Create new profile for new user
        this.userBehaviorProfiles.set(context.userId, {
          accessPatterns: [],
          lastAccess: context.timestamp,
          deviationScore: 0,
        });
        return 0;
      }

      // Calculate deviation based on access patterns
      const currentPattern = {
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
        timestamp: context.timestamp,
      };

      const deviation = this.calculatePatternDeviation(userProfile.accessPatterns, currentPattern);
      
      // Update user profile
      userProfile.accessPatterns.push(currentPattern);
      userProfile.lastAccess = context.timestamp;
      userProfile.deviationScore = deviation;

      return deviation;
    } catch (error) {
      this.logger.error('Failed to calculate access pattern deviation', error);
      return 0;
    }
  }

  /**
   * Calculate pattern deviation
   */
  private calculatePatternDeviation(historicalPatterns: any[], currentPattern: any): number {
    if (historicalPatterns.length === 0) return 0;

    let totalDeviation = 0;
    let factorCount = 0;

    // IP address deviation
    const ipDeviation = this.calculateIPDeviation(historicalPatterns, currentPattern.ipAddress);
    totalDeviation += ipDeviation;
    factorCount++;

    // User agent deviation
    const uaDeviation = this.calculateUserAgentDeviation(historicalPatterns, currentPattern.userAgent);
    totalDeviation += uaDeviation;
    factorCount++;

    // Time pattern deviation
    const timeDeviation = this.calculateTimeDeviation(historicalPatterns, currentPattern.timestamp);
    totalDeviation += timeDeviation;
    factorCount++;

    return totalDeviation / factorCount;
  }

  /**
   * Calculate IP deviation
   */
  private calculateIPDeviation(historicalPatterns: any[], currentIP: string): number {
    const ipCounts: { [key: string]: number } = {};
    historicalPatterns.forEach(pattern => {
      ipCounts[pattern.ipAddress] = (ipCounts[pattern.ipAddress] || 0) + 1;
    });

    const totalPatterns = historicalPatterns.length;
    const currentIPCount = ipCounts[currentIP] || 0;
    const expectedCount = totalPatterns / Object.keys(ipCounts).length;

    return Math.abs(currentIPCount - expectedCount) / expectedCount;
  }

  /**
   * Calculate user agent deviation
   */
  private calculateUserAgentDeviation(historicalPatterns: any[], currentUA: string): number {
    const uaCounts: { [key: string]: number } = {};
    historicalPatterns.forEach(pattern => {
      uaCounts[pattern.userAgent] = (uaCounts[pattern.userAgent] || 0) + 1;
    });

    const totalPatterns = historicalPatterns.length;
    const currentUACount = uaCounts[currentUA] || 0;
    const expectedCount = totalPatterns / Object.keys(uaCounts).length;

    return Math.abs(currentUACount - expectedCount) / expectedCount;
  }

  /**
   * Calculate time deviation
   */
  private calculateTimeDeviation(historicalPatterns: any[], currentTime: Date): number {
    const timePatterns = historicalPatterns.map(p => p.timestamp);
    const avgTime = timePatterns.reduce((sum, time) => sum + time.getTime(), 0) / timePatterns.length;
    const currentTimeMs = currentTime.getTime();
    const timeDiff = Math.abs(currentTimeMs - avgTime);
    const maxTimeDiff = 24 * 60 * 60 * 1000; // 24 hours

    return Math.min(timeDiff / maxTimeDiff, 1);
  }

  /**
   * Process security event
   */
  async processSecurityEvent(event: SecurityEvent): Promise<void> {
    try {
      // Update threat intelligence
      await this.updateThreatIntelligenceFromEvent(event);

      // Analyze event for patterns
      await this.analyzeEventPatterns(event);

      // Update behavioral profiles
      await this.updateBehavioralProfiles(event);

      this.logger.log(`Security event processed: ${event.type}`);
    } catch (error) {
      this.logger.error('Failed to process security event', error);
    }
  }

  /**
   * Update threat intelligence from event
   */
  private async updateThreatIntelligenceFromEvent(event: SecurityEvent): Promise<void> {
    if (event.severity === 'critical' || event.severity === 'high') {
      const threatIntelligence: ThreatIntelligence = {
        id: `event_${Date.now()}`,
        type: 'ip',
        value: event.context.ipAddress,
        threatLevel: event.severity,
        source: 'internal',
        description: event.description,
        firstSeen: new Date(),
        lastSeen: new Date(),
        tags: [event.type],
      };

      this.threatIntelligence.set(`ip:${event.context.ipAddress}`, threatIntelligence);
    }
  }

  /**
   * Analyze event patterns
   */
  private async analyzeEventPatterns(event: SecurityEvent): Promise<void> {
    // Check if event matches known threat patterns
    for (const pattern of this.threatPatterns.values()) {
      if (this.matchesPattern(event.description, pattern.pattern)) {
        this.logger.warn(`Event matches threat pattern: ${pattern.name}`);
      }
    }
  }

  /**
   * Update behavioral profiles
   */
  private async updateBehavioralProfiles(event: SecurityEvent): Promise<void> {
    const userId = event.context.userId;
    let profile = this.userBehaviorProfiles.get(userId);

    if (!profile) {
      profile = {
        accessPatterns: [],
        lastAccess: event.context.timestamp,
        deviationScore: 0,
        riskFactors: [],
        recommendations: [],
      };
    }

    // Update profile based on event
    profile.lastAccess = event.context.timestamp;
    
    if (event.severity === 'high' || event.severity === 'critical') {
      profile.riskFactors.push(event.type);
    }

    this.userBehaviorProfiles.set(userId, profile);
  }

  /**
   * Check if text matches pattern
   */
  private matchesPattern(text: string, pattern: string): boolean {
    try {
      const regex = new RegExp(pattern, 'i');
      return regex.test(text);
    } catch (error) {
      this.logger.error('Invalid regex pattern', error);
      return false;
    }
  }

  /**
   * Analyze threat patterns
   */
  private async analyzeThreatPatterns(): Promise<void> {
    // Analyze recent activities for threat patterns
    const recentActivities = Array.from(this.suspiciousActivities.entries());
    
    for (const [key, count] of recentActivities) {
      if (count > 10) { // Threshold for suspicious activity
        this.logger.warn(`Suspicious activity detected: ${key} (${count} occurrences)`);
      }
    }
  }

  /**
   * Update threat intelligence
   */
  private async updateThreatIntelligence(): Promise<void> {
    // In production, this would fetch from external threat intelligence sources
    this.logger.log('Threat intelligence updated');
  }

  /**
   * Analyze user behavior
   */
  private async analyzeUserBehavior(): Promise<void> {
    for (const [userId, profile] of this.userBehaviorProfiles.entries()) {
      if (profile.deviationScore > 0.8) {
        this.logger.warn(`High behavioral deviation for user ${userId}: ${profile.deviationScore}`);
      }
    }
  }

  /**
   * Get threat detection metrics
   */
  getThreatDetectionMetrics(): any {
    return {
      threatPatterns: this.threatPatterns.size,
      threatIntelligence: this.threatIntelligence.size,
      userBehaviorProfiles: this.userBehaviorProfiles.size,
      suspiciousActivities: this.suspiciousActivities.size,
      timestamp: new Date(),
    };
  }

  /**
   * Get threat patterns
   */
  getThreatPatterns(): ThreatPattern[] {
    return Array.from(this.threatPatterns.values());
  }

  /**
   * Update threat pattern
   */
  async updateThreatPattern(patternId: string, updates: Partial<ThreatPattern>): Promise<void> {
    const pattern = this.threatPatterns.get(patternId);
    if (!pattern) {
      throw new Error(`Threat pattern not found: ${patternId}`);
    }

    const updatedPattern = { ...pattern, ...updates, updatedAt: new Date() };
    this.threatPatterns.set(patternId, updatedPattern);

    this.logger.log(`Threat pattern updated: ${patternId}`);
  }
}
