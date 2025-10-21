import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { CacheService } from '../../src/shared/cache/cache.service';
import { IntegrationService } from '../../src/modules/integration/integration.service';

export class TestHelpers {
  static async createTestApp(): Promise<{
    app: INestApplication;
    moduleFixture: TestingModule;
    dataSource: DataSource;
    cacheService: CacheService;
  }> {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [await import('../../src/app.module').then(m => m.AppModule)],
    }).compile();

    const app = moduleFixture.createNestApplication();
    await app.init();

    const dataSource = moduleFixture.get<DataSource>(DataSource);
    const cacheService = moduleFixture.get<CacheService>(CacheService);

    return { app, moduleFixture, dataSource, cacheService };
  }

  static async cleanupTestApp(
    app: INestApplication,
    moduleFixture: TestingModule,
    dataSource: DataSource
  ): Promise<void> {
    if (dataSource) {
      await dataSource.destroy();
    }
    if (app) {
      await app.close();
    }
    if (moduleFixture) {
      await moduleFixture.close();
    }
  }

  static async clearDatabase(dataSource: DataSource): Promise<void> {
    const entities = dataSource.entityMetadatas;
    for (const entity of entities) {
      const repository = dataSource.getRepository(entity.name);
      await repository.clear();
    }
  }

  static async clearCache(cacheService: CacheService): Promise<void> {
    await cacheService.flushAll();
  }

  static createMockIntegrationService(): Partial<IntegrationService> {
    return {
      validateTokenWithAuthService: jest.fn(),
      refreshTokenWithAuthService: jest.fn(),
      getUserProfile: jest.fn(),
      getUserRoles: jest.fn(),
      getQuestionQuotas: jest.fn(),
      getOrganizationMapping: jest.fn(),
      getTheoreticalQuestions: jest.fn(),
      sendCodeQuestions: jest.fn(),
      getGPTQuestions: jest.fn(),
      getTrainerQuestions: jest.fn(),
      getContextualContent: jest.fn(),
      sendPracticeCompletion: jest.fn(),
      getLearnerProgress: jest.fn(),
      sendPracticeLevel: jest.fn(),
      getLearnerCompetencies: jest.fn(),
      sendLearnerPerformance: jest.fn(),
      getChatbotIntegration: jest.fn(),
      generateQuestion: jest.fn(),
      validateSolution: jest.fn(),
      generateFeedback: jest.fn(),
      detectCheating: jest.fn(),
      executeCode: jest.fn(),
      getExecutionStatus: jest.fn(),
    };
  }

  static createMockUser() {
    return {
      id: 'test-user-123',
      email: 'test@example.com',
      name: 'Test User',
      roles: ['learner'],
      organizationId: 'test-org-123',
      skillLevel: 3,
    };
  }

  static createMockQuestion() {
    return {
      id: 'test-question-123',
      title: 'Test Question',
      description: 'Test description',
      difficulty_level: 3,
      programming_language: 'python',
      question_type: 'coding',
      topic: 'algorithms',
      micro_skills: ['binary-search'],
      nano_skills: ['recursion'],
      test_cases: [
        {
          input: '[1, 2, 3, 4, 5], 3',
          expected_output: '2',
          is_hidden: false
        }
      ],
      hints: ['Use recursion', 'Compare middle element'],
      created_by: 'test-instructor-123',
      ai_validated: true,
      quality_score: 0.85,
      is_active: true,
      usage_count: 0,
      success_rate: 0.0,
    };
  }

  static createMockLearningSession() {
    return {
      id: 'test-session-123',
      learner_id: 'test-user-123',
      question_id: 'test-question-123',
      session_start: new Date(),
      status: 'active',
      attempts: 0,
      max_attempts: 3,
      score: null,
      ai_feedback: null,
      code_submissions: [],
      execution_results: null,
    };
  }

  static createMockExecutionResult() {
    return {
      success: true,
      output: '2',
      error_message: null,
      execution_time: 150,
      memory_usage: 1024,
      test_results: [
        {
          test_case: {
            input: '[1, 2, 3, 4, 5], 3',
            expected_output: '2',
            is_hidden: false
          },
          passed: true,
          actual_output: '2',
          execution_time: 150
        }
      ]
    };
  }

  static createMockAuthResponse() {
    return {
      valid: true,
      userId: 'test-user-123',
      email: 'test@example.com',
      name: 'Test User',
      roles: ['learner'],
      organizationId: 'test-org-123',
      skillLevel: 3,
      expiresAt: '2024-12-31T23:59:59Z',
    };
  }

  static createMockQuestionQuotas() {
    return {
      daily_limit: 50,
      daily_used: 5,
      daily_remaining: 45,
      weekly_limit: 300,
      weekly_used: 25,
      weekly_remaining: 275,
    };
  }

  static createMockOrganizationMapping() {
    return {
      id: 'test-org-123',
      name: 'Test Organization',
      domain: 'test.com',
      settings: {
        max_learners: 1000,
        features: ['ai_questions', 'competitions', 'analytics']
      },
      created_at: '2024-01-01T00:00:00Z'
    };
  }

  static createMockContextualContent() {
    return {
      topic: 'algorithms',
      micro_skills: ['binary-search', 'sorting'],
      nano_skills: ['recursion', 'divide-and-conquer'],
      difficulty_levels: [1, 2, 3, 4, 5],
      learning_objectives: [
        'Understand binary search algorithm',
        'Implement recursive solutions',
        'Analyze time complexity'
      ],
      prerequisites: ['basic-programming', 'arrays'],
      estimated_duration: 120, // minutes
    };
  }

  static createMockAIFeedback() {
    return {
      feedback: 'Great job! Your solution is efficient and well-structured.',
      suggestions: [
        'Consider adding input validation',
        'You could optimize the space complexity'
      ],
      score: 0.85,
      skill_improvement: {
        binary_search: 0.1,
        recursion: 0.05
      },
      insights: [
        'Strong understanding of binary search',
        'Good use of recursion',
        'Consider edge cases'
      ]
    };
  }

  static createMockProgressData() {
    return {
      total_sessions: 25,
      completed_sessions: 20,
      completion_rate: 0.8,
      average_score: 0.75,
      unique_questions: 15,
      average_execution_time: 2.5,
      skill_progression: {
        python: 0.3,
        algorithms: 0.2,
        data_structures: 0.15
      },
      recent_improvements: [
        'Binary search mastery',
        'Recursion understanding',
        'Code optimization'
      ]
    };
  }
}
