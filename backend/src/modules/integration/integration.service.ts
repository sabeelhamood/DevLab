import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthIntegrationService } from './services/auth-integration.service';
import { DirectoryIntegrationService } from './services/directory-integration.service';
import { AssessmentIntegrationService } from './services/assessment-integration.service';
import { ContentStudioIntegrationService } from './services/content-studio-integration.service';
import { LearningAnalyticsIntegrationService } from './services/learning-analytics-integration.service';
import { HRReportingIntegrationService } from './services/hr-reporting-integration.service';
import { ContextualAssistantIntegrationService } from './services/contextual-assistant-integration.service';
import { GeminiIntegrationService } from './services/gemini-integration.service';
import { SandBoxIntegrationService } from './services/sandbox-integration.service';

@Injectable()
export class IntegrationService {
  private readonly logger = new Logger(IntegrationService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly authIntegration: AuthIntegrationService,
    private readonly directoryIntegration: DirectoryIntegrationService,
    private readonly assessmentIntegration: AssessmentIntegrationService,
    private readonly contentStudioIntegration: ContentStudioIntegrationService,
    private readonly learningAnalyticsIntegration: LearningAnalyticsIntegrationService,
    private readonly hrReportingIntegration: HRReportingIntegrationService,
    private readonly contextualAssistantIntegration: ContextualAssistantIntegrationService,
    private readonly geminiIntegration: GeminiIntegrationService,
    private readonly sandBoxIntegration: SandBoxIntegrationService,
  ) {}

  // Authentication Service Integration
  async validateTokenWithAuthService(token: string): Promise<any> {
    return this.authIntegration.validateToken(token);
  }

  async refreshTokenWithAuthService(refreshToken: string): Promise<any> {
    return this.authIntegration.refreshToken(refreshToken);
  }

  async getUserRoles(userId: string): Promise<string[]> {
    return this.authIntegration.getUserRoles(userId);
  }

  // Directory Service Integration
  async getUserProfile(userId: string): Promise<any> {
    return this.directoryIntegration.getUserProfile(userId);
  }

  async getQuestionQuotas(userId: string): Promise<any> {
    return this.directoryIntegration.getQuestionQuotas(userId);
  }

  async getOrganizationMapping(organizationId: string): Promise<any> {
    return this.directoryIntegration.getOrganizationMapping(organizationId);
  }

  // Assessment Service Integration
  async getTheoreticalQuestions(topicId: string): Promise<any[]> {
    return this.assessmentIntegration.getTheoreticalQuestions(topicId);
  }

  async sendCodeQuestions(questions: any[]): Promise<void> {
    return this.assessmentIntegration.sendCodeQuestions(questions);
  }

  // Content Studio Integration
  async getGPTQuestions(topicId: string): Promise<any[]> {
    return this.contentStudioIntegration.getGPTQuestions(topicId);
  }

  async getTrainerQuestions(instructorId: string): Promise<any[]> {
    return this.contentStudioIntegration.getTrainerQuestions(instructorId);
  }

  async getContextualContent(topicId: string): Promise<any> {
    return this.contentStudioIntegration.getContextualContent(topicId);
  }

  // Learning Analytics Integration
  async sendPracticeCompletion(completionData: any): Promise<void> {
    return this.learningAnalyticsIntegration.sendPracticeCompletion(completionData);
  }

  async getLearnerProgress(learnerId: string): Promise<any> {
    return this.learningAnalyticsIntegration.getLearnerProgress(learnerId);
  }

  // HR Reporting Integration
  async sendPracticeLevel(practiceLevelData: any): Promise<void> {
    return this.hrReportingIntegration.sendPracticeLevel(practiceLevelData);
  }

  async getLearnerCompetencies(learnerId: string): Promise<any> {
    return this.hrReportingIntegration.getLearnerCompetencies(learnerId);
  }

  // Contextual Assistant Integration
  async sendLearnerPerformance(performanceData: any): Promise<void> {
    return this.contextualAssistantIntegration.sendLearnerPerformance(performanceData);
  }

  async getChatbotIntegration(learnerId: string): Promise<any> {
    return this.contextualAssistantIntegration.getChatbotIntegration(learnerId);
  }

  // Gemini AI Integration
  async generateQuestion(questionData: any): Promise<any> {
    return this.geminiIntegration.generateQuestion(questionData);
  }

  async validateSolution(solutionData: any): Promise<any> {
    return this.geminiIntegration.validateSolution(solutionData);
  }

  async generateFeedback(feedbackData: any): Promise<any> {
    return this.geminiIntegration.generateFeedback(feedbackData);
  }

  async detectCheating(cheatingData: any): Promise<any> {
    return this.geminiIntegration.detectCheating(cheatingData);
  }

  // SandBox API Integration
  async executeCode(codeData: any): Promise<any> {
    return this.sandBoxIntegration.executeCode(codeData);
  }

  async getExecutionStatus(executionId: string): Promise<any> {
    return this.sandBoxIntegration.getExecutionStatus(executionId);
  }
}
