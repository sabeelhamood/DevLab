import { registerAs } from '@nestjs/config';

export default registerAs('security', () => ({
  // Authentication & Authorization
  jwt: {
    secret: process.env.JWT_SECRET || 'dev-secret-key',
    expiresIn: process.env.JWT_EXPIRES_IN || '1h',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },

  // Encryption
  encryption: {
    algorithm: 'aes-256-gcm',
    keyLength: 32,
    ivLength: 16,
    tagLength: 16,
    key: process.env.ENCRYPTION_KEY || 'dev-encryption-key-32-chars-long',
  },

  // Rate Limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000'), // 1 minute
    max: parseInt(process.env.RATE_LIMIT_MAX || '100'), // 100 requests per window
    message: 'Too many requests from this IP, please try again later',
    skipSuccessfulRequests: false,
    skipFailedRequests: false,
  },

  // Security Headers
  headers: {
    contentSecurityPolicy: "default-src 'self'",
    xFrameOptions: 'DENY',
    xContentTypeOptions: 'nosniff',
    xXSSProtection: '1; mode=block',
    strictTransportSecurity: 'max-age=31536000; includeSubDomains',
    referrerPolicy: 'strict-origin-when-cross-origin',
    permissionsPolicy: 'geolocation=(), microphone=(), camera=()',
  },

  // Session Management
  session: {
    timeout: parseInt(process.env.SESSION_TIMEOUT || '3600000'), // 1 hour
    maxSessions: parseInt(process.env.MAX_SESSIONS || '5'),
    cleanupInterval: parseInt(process.env.SESSION_CLEANUP_INTERVAL || '300000'), // 5 minutes
  },

  // Threat Detection
  threatDetection: {
    enabled: process.env.THREAT_DETECTION_ENABLED === 'true',
    suspiciousThreshold: parseInt(process.env.SUSPICIOUS_THRESHOLD || '10'),
    behavioralAnalysis: process.env.BEHAVIORAL_ANALYSIS_ENABLED === 'true',
    threatIntelligenceUpdateInterval: parseInt(process.env.THREAT_INTELLIGENCE_UPDATE_INTERVAL || '3600000'), // 1 hour
  },

  // Audit & Compliance
  audit: {
    enabled: process.env.AUDIT_ENABLED === 'true',
    retentionDays: parseInt(process.env.AUDIT_RETENTION_DAYS || '2555'), // 7 years
    logLevel: process.env.AUDIT_LOG_LEVEL || 'info',
    exportFormats: ['json', 'csv'],
  },

  compliance: {
    gdpr: {
      enabled: process.env.GDPR_ENABLED === 'true',
      dataRetentionDays: parseInt(process.env.GDPR_DATA_RETENTION_DAYS || '2555'), // 7 years
      consentRequired: process.env.GDPR_CONSENT_REQUIRED === 'true',
    },
    iso27001: {
      enabled: process.env.ISO27001_ENABLED === 'true',
      accessControlRequired: process.env.ISO27001_ACCESS_CONTROL_REQUIRED === 'true',
      encryptionRequired: process.env.ISO27001_ENCRYPTION_REQUIRED === 'true',
    },
    soc2: {
      enabled: process.env.SOC2_ENABLED === 'true',
      availabilityTarget: parseFloat(process.env.SOC2_AVAILABILITY_TARGET || '99.9'),
      monitoringRequired: process.env.SOC2_MONITORING_REQUIRED === 'true',
    },
  },

  // Security Policies
  policies: {
    passwordPolicy: {
      minLength: parseInt(process.env.PASSWORD_MIN_LENGTH || '8'),
      requireUppercase: process.env.PASSWORD_REQUIRE_UPPERCASE === 'true',
      requireLowercase: process.env.PASSWORD_REQUIRE_LOWERCASE === 'true',
      requireNumbers: process.env.PASSWORD_REQUIRE_NUMBERS === 'true',
      requireSpecialChars: process.env.PASSWORD_REQUIRE_SPECIAL_CHARS === 'true',
      maxAge: parseInt(process.env.PASSWORD_MAX_AGE || '90'), // days
    },
    accountLockout: {
      maxAttempts: parseInt(process.env.ACCOUNT_LOCKOUT_MAX_ATTEMPTS || '5'),
      lockoutDuration: parseInt(process.env.ACCOUNT_LOCKOUT_DURATION || '900000'), // 15 minutes
    },
    ipWhitelist: {
      enabled: process.env.IP_WHITELIST_ENABLED === 'true',
      allowedIPs: process.env.IP_WHITELIST_ALLOWED_IPS?.split(',') || [],
    },
    ipBlacklist: {
      enabled: process.env.IP_BLACKLIST_ENABLED === 'true',
      blockedIPs: process.env.IP_BLACKLIST_BLOCKED_IPS?.split(',') || [],
    },
  },

  // Monitoring & Alerting
  monitoring: {
    enabled: process.env.MONITORING_ENABLED === 'true',
    metricsInterval: parseInt(process.env.MONITORING_METRICS_INTERVAL || '60000'), // 1 minute
    alertThresholds: {
      failedLogins: parseInt(process.env.ALERT_THRESHOLD_FAILED_LOGINS || '10'),
      suspiciousActivity: parseInt(process.env.ALERT_THRESHOLD_SUSPICIOUS_ACTIVITY || '5'),
      rateLimitExceeded: parseInt(process.env.ALERT_THRESHOLD_RATE_LIMIT_EXCEEDED || '20'),
    },
    alertChannels: process.env.ALERT_CHANNELS?.split(',') || ['email', 'slack'],
  },

  // Data Protection
  dataProtection: {
    encryptionAtRest: process.env.ENCRYPTION_AT_REST_ENABLED === 'true',
    encryptionInTransit: process.env.ENCRYPTION_IN_TRANSIT_ENABLED === 'true',
    dataMasking: process.env.DATA_MASKING_ENABLED === 'true',
    anonymization: process.env.DATA_ANONYMIZATION_ENABLED === 'true',
    pseudonymization: process.env.DATA_PSEUDONYMIZATION_ENABLED === 'true',
  },

  // External Integrations
  integrations: {
    threatIntelligence: {
      enabled: process.env.THREAT_INTELLIGENCE_ENABLED === 'true',
      providers: process.env.THREAT_INTELLIGENCE_PROVIDERS?.split(',') || [],
      apiKeys: {
        virustotal: process.env.VIRUSTOTAL_API_KEY,
        abuseipdb: process.env.ABUSEIPDB_API_KEY,
        shodan: process.env.SHODAN_API_KEY,
      },
    },
    siem: {
      enabled: process.env.SIEM_ENABLED === 'true',
      endpoint: process.env.SIEM_ENDPOINT,
      apiKey: process.env.SIEM_API_KEY,
    },
    notification: {
      email: {
        enabled: process.env.EMAIL_NOTIFICATIONS_ENABLED === 'true',
        smtp: {
          host: process.env.SMTP_HOST,
          port: parseInt(process.env.SMTP_PORT || '587'),
          secure: process.env.SMTP_SECURE === 'true',
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
        },
        from: process.env.EMAIL_FROM || 'security@devlab.com',
        to: process.env.EMAIL_TO?.split(',') || [],
      },
      slack: {
        enabled: process.env.SLACK_NOTIFICATIONS_ENABLED === 'true',
        webhook: process.env.SLACK_WEBHOOK_URL,
        channel: process.env.SLACK_CHANNEL || '#security',
      },
    },
  },

  // Development & Testing
  development: {
    bypassSecurity: process.env.BYPASS_SECURITY === 'true',
    mockThreats: process.env.MOCK_THREATS === 'true',
    testMode: process.env.SECURITY_TEST_MODE === 'true',
  },
}));
