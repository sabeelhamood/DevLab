import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { TestHelpers } from '../helpers/test-helpers';

describe('DEVLAB Microservice E2E Tests', () => {
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

  describe('Complete User Journey', () => {
    it('should complete full learning session workflow', async () => {
      const mockUser = TestHelpers.createMockUser();
      const mockQuestionQuotas = TestHelpers.createMockQuestionQuotas();
      const mockContextualContent = TestHelpers.createMockContextualContent();
      const mockQuestions = [TestHelpers.createMockQuestion()];
      const mockExecutionResult = TestHelpers.createMockExecutionResult();
      const mockAIFeedback = TestHelpers.createMockAIFeedback();

      // Mock all integration services
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
      jest.spyOn(integrationService, 'executeCode').mockResolvedValue(mockExecutionResult);
      jest.spyOn(integrationService, 'generateFeedback').mockResolvedValue(mockAIFeedback);
      jest.spyOn(integrationService, 'sendPracticeCompletion').mockResolvedValue(undefined);
      jest.spyOn(integrationService, 'sendPracticeLevel').mockResolvedValue(undefined);
      jest.spyOn(integrationService, 'sendLearnerPerformance').mockResolvedValue(undefined);

      // Mock repositories
      const questionRepository = moduleFixture.get('QuestionRepository');
      const sessionRepository = moduleFixture.get('SessionRepository');
      
      jest.spyOn(questionRepository, 'findOne').mockResolvedValue(mockQuestions[0] as any);
      jest.spyOn(sessionRepository, 'findOne').mockResolvedValue(null);
      jest.spyOn(sessionRepository, 'create').mockReturnValue({
        learner_id: mockUser.id,
        question_id: mockQuestions[0].id,
        session_start: new Date(),
        status: 'active',
        attempts: 0,
        max_attempts: 3,
      } as any);
      jest.spyOn(sessionRepository, 'save').mockResolvedValue({} as any);

      const token = 'valid-test-token';

      // Step 1: Get personalized questions
      const questionsResponse = await request(app.getHttpServer())
        .get('/api/questions/personalized')
        .set('Authorization', `Bearer ${token}`)
        .query({ topic: 'algorithms', language: 'python', limit: 10 })
        .expect(200);

      expect(questionsResponse.body.questions).toBeDefined();
      expect(questionsResponse.body.questions.length).toBeGreaterThan(0);
      expect(questionsResponse.body.learner_profile).toBeDefined();

      const questionId = questionsResponse.body.questions[0].id;

      // Step 2: Submit code solution
      const submitResponse = await request(app.getHttpServer())
        .post(`/api/questions/${questionId}/submit`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          code: 'def solution():\n    return "Hello World"',
          language: 'python',
        })
        .expect(200);

      expect(submitResponse.body.execution_result).toBeDefined();
      expect(submitResponse.body.feedback).toBeDefined();
      expect(submitResponse.body.score).toBeDefined();
      expect(submitResponse.body.session_status).toBeDefined();

      // Step 3: Get learning sessions
      const sessionsResponse = await request(app.getHttpServer())
        .get('/api/questions/sessions')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(sessionsResponse.body.sessions).toBeDefined();
      expect(sessionsResponse.body.total_count).toBeDefined();

      // Step 4: Get specific session details
      const sessionId = sessionsResponse.body.sessions[0].id;
      const sessionResponse = await request(app.getHttpServer())
        .get(`/api/questions/sessions/${sessionId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(sessionResponse.body.id).toBe(sessionId);
      expect(sessionResponse.body.learner_id).toBe(mockUser.id);
      expect(sessionResponse.body.question_id).toBe(questionId);
    });

    it('should handle multiple concurrent learning sessions', async () => {
      const mockUser = TestHelpers.createMockUser();
      const mockQuestionQuotas = TestHelpers.createMockQuestionQuotas();
      const mockContextualContent = TestHelpers.createMockContextualContent();
      const mockQuestions = Array.from({ length: 3 }, (_, i) => ({
        ...TestHelpers.createMockQuestion(),
        id: `question-${i + 1}`,
        title: `Question ${i + 1}`,
      }));
      const mockExecutionResult = TestHelpers.createMockExecutionResult();
      const mockAIFeedback = TestHelpers.createMockAIFeedback();

      // Mock all integration services
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
      jest.spyOn(integrationService, 'executeCode').mockResolvedValue(mockExecutionResult);
      jest.spyOn(integrationService, 'generateFeedback').mockResolvedValue(mockAIFeedback);
      jest.spyOn(integrationService, 'sendPracticeCompletion').mockResolvedValue(undefined);
      jest.spyOn(integrationService, 'sendPracticeLevel').mockResolvedValue(undefined);
      jest.spyOn(integrationService, 'sendLearnerPerformance').mockResolvedValue(undefined);

      // Mock repositories
      const questionRepository = moduleFixture.get('QuestionRepository');
      const sessionRepository = moduleFixture.get('SessionRepository');
      
      jest.spyOn(questionRepository, 'findOne').mockImplementation(({ where }) => {
        const question = mockQuestions.find(q => q.id === where.id);
        return Promise.resolve(question as any);
      });
      
      jest.spyOn(sessionRepository, 'findOne').mockResolvedValue(null);
      jest.spyOn(sessionRepository, 'create').mockImplementation((data) => ({
        ...data,
        id: `session-${Date.now()}`,
        session_start: new Date(),
        status: 'active',
        attempts: 0,
        max_attempts: 3,
      }));
      jest.spyOn(sessionRepository, 'save').mockResolvedValue({} as any);

      const token = 'valid-test-token';

      // Get questions
      const questionsResponse = await request(app.getHttpServer())
        .get('/api/questions/personalized')
        .set('Authorization', `Bearer ${token}`)
        .query({ topic: 'algorithms', language: 'python', limit: 10 })
        .expect(200);

      const questions = questionsResponse.body.questions;
      expect(questions.length).toBe(3);

      // Submit solutions for all questions concurrently
      const submitPromises = questions.map(question =>
        request(app.getHttpServer())
          .post(`/api/questions/${question.id}/submit`)
          .set('Authorization', `Bearer ${token}`)
          .send({
            code: 'def solution():\n    return "Hello World"',
            language: 'python',
          })
      );

      const submitResponses = await Promise.all(submitPromises);

      // Verify all submissions succeeded
      submitResponses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.execution_result).toBeDefined();
        expect(response.body.feedback).toBeDefined();
      });

      // Get all sessions
      const sessionsResponse = await request(app.getHttpServer())
        .get('/api/questions/sessions')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(sessionsResponse.body.sessions.length).toBe(3);
      expect(sessionsResponse.body.total_count).toBe(3);
    });

    it('should handle error scenarios gracefully', async () => {
      const mockUser = TestHelpers.createMockUser();
      const token = 'valid-test-token';

      // Mock authentication
      const integrationService = moduleFixture.get('IntegrationService');
      jest.spyOn(integrationService, 'validateTokenWithAuthService').mockResolvedValue({
        valid: true,
        userId: mockUser.id,
        expiresAt: '2024-12-31T23:59:59Z',
      });
      jest.spyOn(integrationService, 'getUserProfile').mockResolvedValue(mockUser);

      // Test 1: Non-existent question
      await request(app.getHttpServer())
        .post('/api/questions/non-existent-question/submit')
        .set('Authorization', `Bearer ${token}`)
        .send({
          code: 'def solution():\n    return "Hello World"',
          language: 'python',
        })
        .expect(404);

      // Test 2: Invalid language
      await request(app.getHttpServer())
        .post('/api/questions/test-question-123/submit')
        .set('Authorization', `Bearer ${token}`)
        .send({
          code: 'def solution():\n    return "Hello World"',
          language: 'invalid-language',
        })
        .expect(400);

      // Test 3: Missing code
      await request(app.getHttpServer())
        .post('/api/questions/test-question-123/submit')
        .set('Authorization', `Bearer ${token}`)
        .send({
          language: 'python',
        })
        .expect(400);

      // Test 4: Non-existent session
      await request(app.getHttpServer())
        .get('/api/questions/sessions/non-existent-session')
        .set('Authorization', `Bearer ${token}`)
        .expect(404);
    });

    it('should maintain data consistency across operations', async () => {
      const mockUser = TestHelpers.createMockUser();
      const mockQuestionQuotas = TestHelpers.createMockQuestionQuotas();
      const mockContextualContent = TestHelpers.createMockContextualContent();
      const mockQuestions = [TestHelpers.createMockQuestion()];
      const mockExecutionResult = TestHelpers.createMockExecutionResult();
      const mockAIFeedback = TestHelpers.createMockAIFeedback();

      // Mock all integration services
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
      jest.spyOn(integrationService, 'executeCode').mockResolvedValue(mockExecutionResult);
      jest.spyOn(integrationService, 'generateFeedback').mockResolvedValue(mockAIFeedback);
      jest.spyOn(integrationService, 'sendPracticeCompletion').mockResolvedValue(undefined);
      jest.spyOn(integrationService, 'sendPracticeLevel').mockResolvedValue(undefined);
      jest.spyOn(integrationService, 'sendLearnerPerformance').mockResolvedValue(undefined);

      // Mock repositories
      const questionRepository = moduleFixture.get('QuestionRepository');
      const sessionRepository = moduleFixture.get('SessionRepository');
      
      jest.spyOn(questionRepository, 'findOne').mockResolvedValue(mockQuestions[0] as any);
      jest.spyOn(sessionRepository, 'findOne').mockResolvedValue(null);
      jest.spyOn(sessionRepository, 'create').mockReturnValue({
        learner_id: mockUser.id,
        question_id: mockQuestions[0].id,
        session_start: new Date(),
        status: 'active',
        attempts: 0,
        max_attempts: 3,
      } as any);
      jest.spyOn(sessionRepository, 'save').mockResolvedValue({} as any);

      const token = 'valid-test-token';

      // Get questions
      const questionsResponse = await request(app.getHttpServer())
        .get('/api/questions/personalized')
        .set('Authorization', `Bearer ${token}`)
        .query({ topic: 'algorithms', language: 'python', limit: 10 })
        .expect(200);

      const questionId = questionsResponse.body.questions[0].id;

      // Submit solution
      const submitResponse = await request(app.getHttpServer())
        .post(`/api/questions/${questionId}/submit`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          code: 'def solution():\n    return "Hello World"',
          language: 'python',
        })
        .expect(200);

      // Verify session was created
      const sessionsResponse = await request(app.getHttpServer())
        .get('/api/questions/sessions')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(sessionsResponse.body.sessions.length).toBe(1);
      expect(sessionsResponse.body.sessions[0].question_id).toBe(questionId);
      expect(sessionsResponse.body.sessions[0].learner_id).toBe(mockUser.id);
      expect(sessionsResponse.body.sessions[0].status).toBe('completed');

      // Verify session details
      const sessionId = sessionsResponse.body.sessions[0].id;
      const sessionResponse = await request(app.getHttpServer())
        .get(`/api/questions/sessions/${sessionId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(sessionResponse.body.id).toBe(sessionId);
      expect(sessionResponse.body.question_id).toBe(questionId);
      expect(sessionResponse.body.learner_id).toBe(mockUser.id);
      expect(sessionResponse.body.status).toBe('completed');
      expect(sessionResponse.body.score).toBeDefined();
      expect(sessionResponse.body.ai_feedback).toBeDefined();
    });
  });
});
