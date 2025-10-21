import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SecurityService } from './services/security.service';
import { EncryptionService } from './services/encryption.service';
import { AuditService } from './services/audit.service';
import { ThreatDetectionService } from './services/threat-detection.service';
import { ComplianceService } from './services/compliance.service';
import { SecurityController } from './controllers/security.controller';
import { SecurityMiddleware } from './middleware/security.middleware';
import { RateLimitGuard } from './guards/rate-limit.guard';
import { SecurityValidationPipe } from './pipes/security-validation.pipe';
import { SecurityInterceptor } from './interceptors/security.interceptor';
import { SecurityExceptionFilter } from './filters/security-exception.filter';

@Module({
  imports: [ConfigModule],
  controllers: [SecurityController],
  providers: [
    SecurityService,
    EncryptionService,
    AuditService,
    ThreatDetectionService,
    ComplianceService,
    SecurityMiddleware,
    RateLimitGuard,
    SecurityValidationPipe,
    SecurityInterceptor,
    SecurityExceptionFilter,
  ],
  exports: [
    SecurityService,
    EncryptionService,
    AuditService,
    ThreatDetectionService,
    ComplianceService,
  ],
})
export class SecurityModule {}
