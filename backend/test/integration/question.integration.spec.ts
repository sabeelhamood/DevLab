import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { TestHelpers } from '../helpers/test-helpers';

describe('Question Integration Tests', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let moduleFixture: TestingModule;

  beforeAll(async () => {
    moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    dataSource = moduleFixture.get<DataSource>(DataSource);
  });

  afterAll(async () => {
    await TestHelpers.cleanupTestApp(app, moduleFixture, dataSource);
  });

  beforeEach(async () => {
    await TestHelpers.clearDatabase(dataSource);
  });

  describe('GET /api/questions/personalized', () => {
    it('should return personalized questions successfully', async () => {
      const token = 'valid-test-token';
      const mockUser = TestHelpers.createMockUser();
      const mockQuestionQuotas = TestHelpers.createMockQuestionQuotas();
      const mockContextualContent = TestHelpers.createMockContextualContent();
      const mockQuestions = [TestHelpers.createMockQuestion()];

      // Mock authentication
      const integrationService = moduleFixture.get('IntegrationService');
      jest.spyOn(integrationService, 'validateTokenWithAuthService').mockResolvedValue({
        valid: true,
        userId: mockUser.id,
        expiresAt: '2024-12-31T23:59:59Z',
      });
      jest.spyOn(integrationService, 'getUserProfile').mockResolvedValue(mockUser);
      jest.spyOn(integrationService, 'getQuestionQuotas').mockResolvedValue(mockQuestionQuotas);
      jest.spyOn(integrationService, 'getContextualContent').mockResolvedValue(mockContextualContent);
      jest.spyOn(integrationService, 'generateQuestion').mockResolvedValue({
        questions: mockQuestions
      });

      const response = await request(app.getHttpServer())
        .get('/api/questions/personalized')
        .set('Authorization', `Bearer ${token}`)
        .query({ topic: 'algorithms', language: 'python', limit: 10 })
        .expect(200);

      expect(response.body).toHaveProperty('questions');
      expect(response.body).toHaveProperty('total_count');
      expect(response.body).toHaveProperty('has_more');
      expect(response.body).toHaveProperty('learner_profile');
      expect(Array.isArray(response.body.questions)).toBe(true);
    });

    it('should return 401 without authentication', async () => {
      await request(app.getHttpServer())
        .get('/api/questions/personalized')
        .expect(401);
    });

    it('should return 400 when quota exceeded', async () => {
      const token = 'valid-test-token';
      const mockUser = TestHelpers.createMockUser();
      const mockQuestionQuotas = {
        daily_limit: 50,
        daily_used: 50,
        daily_remaining: 0,
      };

      const integrationService = moduleFixture.get('IntegrationService');
      jest.spyOn(integrationService, 'validateTokenWithAuthService').mockResolvedValue({
        valid: true,
        userId: mockUser.id,
        expiresAt: '2024-12-31T23:59:59Z',
      });
      jest.spyOn(integrationService, 'getUserProfile').mockResolvedValue(mockUser);
      jest.spyOn(integrationService, 'getQuestionQuotas').mockResolvedValue(mockQuestionQuotas);

      await request(app.getHttpServer())
        .get('/api/questions/personalized')
        .set('Authorization', `Bearer ${token}`)
        .expect(400);
    });
  });

  describe('POST /api/questions/:id/submit', () => {
    it('should submit code solution successfully', async () => {
      const token = 'valid-test-token';
      const questionId = 'test-question-123';
      const mockUser = TestHelpers.createMockUser();
      const mockQuestion = TestHelpers.createMockQuestion();
      const mockExecutionResult = TestHelpers.createMockExecutionResult();
      const mockAIFeedback = TestHelpers.createMockAIFeedback();

      // Mock authentication
      const integrationService = moduleFixture.get('IntegrationService');
      jest.spyOn(integrationService, 'validateTokenWithAuthService').mockResolvedValue({
        valid: true,
        userId: mockUser.id,
        expiresAt: '2024-12-31T23:59:59Z',
      });
      jest.spyOn(integrationService, 'getUserProfile').mockResolvedValue(mockUser);

      // Mock question repository
      const questionRepository = moduleFixture.get('QuestionRepository');
      jest.spyOn(questionRepository, 'findOne').mockResolvedValue(mockQuestion as any);

      // Mock session repository
      const sessionRepository = moduleFixture.get('SessionRepository');
      jest.spyOn(sessionRepository, 'findOne').mockResolvedValue(null);
      jest.spyOn(sessionRepository, 'create').mockReturnValue({
        learner_id: mockUser.id,
        question_id: questionId,
        session_start: new Date(),
        status: 'active',
        attempts: 0,
        max_attempts: 3,
      } as any);
      jest.spyOn(sessionRepository, 'save').mockResolvedValue({} as any);

      // Mock external services
      jest.spyOn(integrationService, 'executeCode').mockResolvedValue(mockExecutionResult);
      jest.spyOn(integrationService, 'generateFeedback').mockResolvedValue(mockAIFeedback);
      jest.spyOn(integrationService, 'sendPracticeCompletion').mockResolvedValue(undefined);
      jest.spyOn(integrationService, 'sendPracticeLevel').mockResolvedValue(undefined);
      jest.spyOn(integrationService, 'sendLearnerPerformance').mockResolvedValue(undefined);

      const response = await request(app.getHttpServer())
        .post(`/api/questions/${questionId}/submit`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          code: 'def solution():\n    return "Hello World"',
          language: 'python',
        })
        .expect(200);

      expect(response.body).toHaveProperty('execution_result');
      expect(response.body).toHaveProperty('feedback');
      expect(response.body).toHaveProperty('score');
      expect(response.body).toHaveProperty('session_status');
      expect(response.body).toHaveProperty('attempts_remaining');
    });

    it('should return 404 for non-existent question', async () => {
      const token = 'valid-test-token';
      const questionId = 'non-existent-question';
      const mockUser = TestHelpers.createMockUser();

      const integrationService = moduleFixture.get('IntegrationService');
      jest.spyOn(integrationService, 'validateTokenWithAuthService').mockResolvedValue({
        valid: true,
        userId: mockUser.id,
        expiresAt: '2024-12-31T23:59:59Z',
      });
      jest.spyOn(integrationService, 'getUserProfile').mockResolvedValue(mockUser);

      const questionRepository = moduleFixture.get('QuestionRepository');
      jest.spyOn(questionRepository, 'findOne').mockResolvedValue(null);

      await request(app.getHttpServer())
        .post(`/api/questions/${questionId}/submit`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          code: 'def solution():\n    return "Hello World"',
          language: 'python',
        })
        .expect(404);
    });

    it('should return 401 without authentication', async () => {
      const questionId = 'test-question-123';

      await request(app.getHttpServer())
        .post(`/api/questions/${questionId}/submit`)
        .send({
          code: 'def solution():\n    return "Hello World"',
          language: 'python',
        })
        .expect(401);
    });
  });

  describe('GET /api/questions/sessions', () => {
    it('should return learning sessions successfully', async () => {
      const token = 'valid-test-token';
      const mockUser = TestHelpers.createMockUser();
      const mockSessions = [TestHelpers.createMockLearningSession()];

      const integrationService = moduleFixture.get('IntegrationService');
      jest.spyOn(integrationService, 'validateTokenWithAuthService').mockResolvedValue({
        valid: true,
        userId: mockUser.id,
        expiresAt: '2024-12-31T23:59:59Z',
      });
      jest.spyOn(integrationService, 'getUserProfile').mockResolvedValue(mockUser);

      const sessionRepository = moduleFixture.get('SessionRepository');
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockSessions),
      };
      jest.spyOn(sessionRepository, 'createQueryBuilder').mockReturnValue(mockQueryBuilder);

      const response = await request(app.getHttpServer())
        .get('/api/questions/sessions')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body).toHaveProperty('sessions');
      expect(response.body).toHaveProperty('total_count');
      expect(Array.isArray(response.body.sessions)).toBe(true);
    });

    it('should filter sessions by status', async () => {
      const token = 'valid-test-token';
      const mockUser = TestHelpers.createMockUser();
      const status = 'completed';

      const integrationService = moduleFixture.get('IntegrationService');
      jest.spyOn(integrationService, 'validateTokenWithAuthService').mockResolvedValue({
        valid: true,
        userId: mockUser.id,
        expiresAt: '2024-12-31T23:59:59Z',
      });
      jest.spyOn(integrationService, 'getUserProfile').mockResolvedValue(mockUser);

      const sessionRepository = moduleFixture.get('SessionRepository');
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      };
      jest.spyOn(sessionRepository, 'createQueryBuilder').mockReturnValue(mockQueryBuilder);

      await request(app.getHttpServer())
        .get('/api/questions/sessions')
        .set('Authorization', `Bearer ${token}`)
        .query({ status })
        .expect(200);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('session.status = :status', { status });
    });
  });

  describe('GET /api/questions/sessions/:sessionId', () => {
    it('should return session details successfully', async () => {
      const token = 'valid-test-token';
      const sessionId = 'test-session-123';
      const mockUser = TestHelpers.createMockUser();
      const mockSession = TestHelpers.createMockLearningSession();

      const integrationService = moduleFixture.get('IntegrationService');
      jest.spyOn(integrationService, 'validateTokenWithAuthService').mockResolvedValue({
        valid: true,
        userId: mockUser.id,
        expiresAt: '2024-12-31T23:59:59Z',
      });
      jest.spyOn(integrationService, 'getUserProfile').mockResolvedValue(mockUser);

      const sessionRepository = moduleFixture.get('SessionRepository');
      jest.spyOn(sessionRepository, 'findOne').mockResolvedValue(mockSession as any);

      const response = await request(app.getHttpServer())
        .get(`/api/questions/sessions/${sessionId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('learner_id');
      expect(response.body).toHaveProperty('question_id');
      expect(response.body).toHaveProperty('status');
    });

    it('should return 404 for non-existent session', async () => {
      const token = 'valid-test-token';
      const sessionId = 'non-existent-session';
      const mockUser = TestHelpers.createMockUser();

      const integrationService = moduleFixture.get('IntegrationService');
      jest.spyOn(integrationService, 'validateTokenWithAuthService').mockResolvedValue({
        valid: true,
        userId: mockUser.id,
        expiresAt: '2024-12-31T23:59:59Z',
      });
      jest.spyOn(integrationService, 'getUserProfile').mockResolvedValue(mockUser);

      const sessionRepository = moduleFixture.get('SessionRepository');
      jest.spyOn(sessionRepository, 'findOne').mockResolvedValue(null);

      await request(app.getHttpServer())
        .get(`/api/questions/sessions/${sessionId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(404);
    });
  });
});
