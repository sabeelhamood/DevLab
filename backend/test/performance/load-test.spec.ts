import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { TestHelpers } from '../helpers/test-helpers';

describe('Load Testing', () => {
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

  describe('Authentication Load Test', () => {
    it('should handle 100 concurrent token validations', async () => {
      const token = 'valid-test-token';
      const mockAuthResponse = TestHelpers.createMockAuthResponse();
      const concurrentRequests = 100;

      // Mock the integration service response
      const integrationService = moduleFixture.get('IntegrationService');
      jest.spyOn(integrationService, 'validateTokenWithAuthService').mockResolvedValue({
        valid: true,
        userId: mockAuthResponse.userId,
        expiresAt: mockAuthResponse.expiresAt,
      });
      jest.spyOn(integrationService, 'getUserProfile').mockResolvedValue({
        email: mockAuthResponse.email,
        name: mockAuthResponse.name,
        organizationId: mockAuthResponse.organizationId,
        skillLevel: mockAuthResponse.skillLevel,
      });

      const startTime = Date.now();
      const promises = Array.from({ length: concurrentRequests }, () =>
        request(app.getHttpServer())
          .post('/api/auth/validate')
          .send({ token })
      );

      const responses = await Promise.all(promises);
      const endTime = Date.now();
      const duration = endTime - startTime;

      // Verify all requests succeeded
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.valid).toBe(true);
      });

      // Performance assertions
      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
      console.log(`100 concurrent token validations completed in ${duration}ms`);
    });

    it('should handle 50 concurrent question requests', async () => {
      const token = 'valid-test-token';
      const mockUser = TestHelpers.createMockUser();
      const mockQuestionQuotas = TestHelpers.createMockQuestionQuotas();
      const mockContextualContent = TestHelpers.createMockContextualContent();
      const mockQuestions = [TestHelpers.createMockQuestion()];
      const concurrentRequests = 50;

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

      const startTime = Date.now();
      const promises = Array.from({ length: concurrentRequests }, () =>
        request(app.getHttpServer())
          .get('/api/questions/personalized')
          .set('Authorization', `Bearer ${token}`)
          .query({ topic: 'algorithms', limit: 10 })
      );

      const responses = await Promise.all(promises);
      const endTime = Date.now();
      const duration = endTime - startTime;

      // Verify all requests succeeded
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.questions).toBeDefined();
      });

      // Performance assertions
      expect(duration).toBeLessThan(10000); // Should complete within 10 seconds
      console.log(`50 concurrent question requests completed in ${duration}ms`);
    });

    it('should handle 25 concurrent code submissions', async () => {
      const token = 'valid-test-token';
      const questionId = 'test-question-123';
      const mockUser = TestHelpers.createMockUser();
      const mockQuestion = TestHelpers.createMockQuestion();
      const mockExecutionResult = TestHelpers.createMockExecutionResult();
      const mockAIFeedback = TestHelpers.createMockAIFeedback();
      const concurrentRequests = 25;

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

      const startTime = Date.now();
      const promises = Array.from({ length: concurrentRequests }, () =>
        request(app.getHttpServer())
          .post(`/api/questions/${questionId}/submit`)
          .set('Authorization', `Bearer ${token}`)
          .send({
            code: 'def solution():\n    return "Hello World"',
            language: 'python',
          })
      );

      const responses = await Promise.all(promises);
      const endTime = Date.now();
      const duration = endTime - startTime;

      // Verify all requests succeeded
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.execution_result).toBeDefined();
      });

      // Performance assertions
      expect(duration).toBeLessThan(15000); // Should complete within 15 seconds
      console.log(`25 concurrent code submissions completed in ${duration}ms`);
    });
  });

  describe('Memory Usage Test', () => {
    it('should not exceed memory limits during high load', async () => {
      const initialMemory = process.memoryUsage();
      const token = 'valid-test-token';
      const mockUser = TestHelpers.createMockUser();
      const mockQuestionQuotas = TestHelpers.createMockQuestionQuotas();
      const mockContextualContent = TestHelpers.createMockContextualContent();
      const mockQuestions = Array.from({ length: 100 }, () => TestHelpers.createMockQuestion());

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

      // Simulate high load
      const promises = Array.from({ length: 200 }, () =>
        request(app.getHttpServer())
          .get('/api/questions/personalized')
          .set('Authorization', `Bearer ${token}`)
          .query({ topic: 'algorithms', limit: 50 })
      );

      await Promise.all(promises);

      const finalMemory = process.memoryUsage();
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
      const memoryIncreaseMB = memoryIncrease / 1024 / 1024;

      // Memory should not increase by more than 100MB
      expect(memoryIncreaseMB).toBeLessThan(100);
      console.log(`Memory increase: ${memoryIncreaseMB.toFixed(2)}MB`);
    });
  });

  describe('Response Time Test', () => {
    it('should maintain response times under load', async () => {
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

      const responseTimes: number[] = [];
      const requests = Array.from({ length: 50 }, async () => {
        const startTime = Date.now();
        const response = await request(app.getHttpServer())
          .get('/api/questions/personalized')
          .set('Authorization', `Bearer ${token}`)
          .query({ topic: 'algorithms', limit: 10 });
        const endTime = Date.now();
        
        expect(response.status).toBe(200);
        responseTimes.push(endTime - startTime);
      });

      await Promise.all(requests);

      const averageResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
      const maxResponseTime = Math.max(...responseTimes);
      const p95ResponseTime = responseTimes.sort((a, b) => a - b)[Math.floor(responseTimes.length * 0.95)];

      // Performance assertions
      expect(averageResponseTime).toBeLessThan(1000); // Average should be under 1 second
      expect(maxResponseTime).toBeLessThan(2000); // Max should be under 2 seconds
      expect(p95ResponseTime).toBeLessThan(1500); // 95th percentile should be under 1.5 seconds

      console.log(`Average response time: ${averageResponseTime.toFixed(2)}ms`);
      console.log(`Max response time: ${maxResponseTime}ms`);
      console.log(`95th percentile: ${p95ResponseTime}ms`);
    });
  });
});
