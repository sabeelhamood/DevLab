import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';

import { IntegrationService } from './integration.service';
import { AuthIntegrationService } from './services/auth-integration.service';
import { DirectoryIntegrationService } from './services/directory-integration.service';
import { AssessmentIntegrationService } from './services/assessment-integration.service';
import { ContentStudioIntegrationService } from './services/content-studio-integration.service';
import { LearningAnalyticsIntegrationService } from './services/learning-analytics-integration.service';
import { HRReportingIntegrationService } from './services/hr-reporting-integration.service';
import { ContextualAssistantIntegrationService } from './services/contextual-assistant-integration.service';
import { GeminiIntegrationService } from './services/gemini-integration.service';
import { SandBoxIntegrationService } from './services/sandbox-integration.service';

@Module({
  imports: [
    HttpModule.register({
      timeout: 10000,
      maxRedirects: 5,
    }),
    ConfigModule,
  ],
  providers: [
    IntegrationService,
    AuthIntegrationService,
    DirectoryIntegrationService,
    AssessmentIntegrationService,
    ContentStudioIntegrationService,
    LearningAnalyticsIntegrationService,
    HRReportingIntegrationService,
    ContextualAssistantIntegrationService,
    GeminiIntegrationService,
    SandBoxIntegrationService,
  ],
  exports: [IntegrationService],
})
export class IntegrationModule {}
