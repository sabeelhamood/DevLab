import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { TestHelpers } from '../helpers/test-helpers';

describe('Security Tests', () => {
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

  describe('Authentication Security', () => {
    it('should reject requests without authentication', async () => {
      await request(app.getHttpServer())
        .get('/api/questions/personalized')
        .expect(401);
    });

    it('should reject requests with invalid JWT format', async () => {
      await request(app.getHttpServer())
        .get('/api/questions/personalized')
        .set('Authorization', 'InvalidToken')
        .expect(401);
    });

    it('should reject requests with malformed JWT', async () => {
      await request(app.getHttpServer())
        .get('/api/questions/personalized')
        .set('Authorization', 'Bearer invalid.jwt.token')
        .expect(401);
    });

    it('should reject requests with expired JWT', async () => {
      const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE1MTYyMzkwMjJ9.4Adcj3UFYzPUVaVF43FmMab6RlaQD8A9WF8LGDj9lI';
      
      await request(app.getHttpServer())
        .get('/api/questions/personalized')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401);
    });

    it('should reject requests with tampered JWT', async () => {
      const tamperedToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.tampered-signature';
      
      await request(app.getHttpServer())
        .get('/api/questions/personalized')
        .set('Authorization', `Bearer ${tamperedToken}`)
        .expect(401);
    });
  });

  describe('Input Validation Security', () => {
    it('should reject SQL injection attempts', async () => {
      const token = 'valid-test-token';
      const mockUser = TestHelpers.createMockUser();

      // Mock authentication
      const integrationService = moduleFixture.get('IntegrationService');
      jest.spyOn(integrationService, 'validateTokenWithAuthService').mockResolvedValue({
        valid: true,
        userId: mockUser.id,
        expiresAt: '2024-12-31T23:59:59Z',
      });
      jest.spyOn(integrationService, 'getUserProfile').mockResolvedValue(mockUser);

      const sqlInjectionPayload = "'; DROP TABLE questions; --";
      
      await request(app.getHttpServer())
        .get('/api/questions/personalized')
        .set('Authorization', `Bearer ${token}`)
        .query({ topic: sqlInjectionPayload })
        .expect(400);
    });

    it('should reject XSS attempts in request body', async () => {
      const token = 'valid-test-token';
      const questionId = 'test-question-123';
      const mockUser = TestHelpers.createMockUser();
      const mockQuestion = TestHelpers.createMockQuestion();

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

      const xssPayload = '<script>alert("XSS")</script>';
      
      await request(app.getHttpServer())
        .post(`/api/questions/${questionId}/submit`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          code: xssPayload,
          language: 'python',
        })
        .expect(400);
    });

    it('should reject oversized request bodies', async () => {
      const token = 'valid-test-token';
      const questionId = 'test-question-123';
      const mockUser = TestHelpers.createMockUser();

      // Mock authentication
      const integrationService = moduleFixture.get('IntegrationService');
      jest.spyOn(integrationService, 'validateTokenWithAuthService').mockResolvedValue({
        valid: true,
        userId: mockUser.id,
        expiresAt: '2024-12-31T23:59:59Z',
      });
      jest.spyOn(integrationService, 'getUserProfile').mockResolvedValue(mockUser);

      // Create oversized payload (larger than 1MB)
      const oversizedCode = 'def solution():\n' + '    return "Hello World"\n'.repeat(100000);
      
      await request(app.getHttpServer())
        .post(`/api/questions/${questionId}/submit`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          code: oversizedCode,
          language: 'python',
        })
        .expect(413); // Payload Too Large
    });

    it('should reject invalid language parameters', async () => {
      const token = 'valid-test-token';
      const questionId = 'test-question-123';
      const mockUser = TestHelpers.createMockUser();

      // Mock authentication
      const integrationService = moduleFixture.get('IntegrationService');
      jest.spyOn(integrationService, 'validateTokenWithAuthService').mockResolvedValue({
        valid: true,
        userId: mockUser.id,
        expiresAt: '2024-12-31T23:59:59Z',
      });
      jest.spyOn(integrationService, 'getUserProfile').mockResolvedValue(mockUser);

      await request(app.getHttpServer())
        .post(`/api/questions/${questionId}/submit`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          code: 'def solution():\n    return "Hello World"',
          language: 'invalid-language',
        })
        .expect(400);
    });
  });

  describe('Rate Limiting Security', () => {
    it('should enforce rate limits on authentication endpoints', async () => {
      const requests = Array.from({ length: 100 }, () =>
        request(app.getHttpServer())
          .post('/api/auth/validate')
          .send({ token: 'invalid-token' })
      );

      const responses = await Promise.all(requests);
      
      // Some requests should be rate limited
      const rateLimitedResponses = responses.filter(r => r.status === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });

    it('should enforce rate limits on question endpoints', async () => {
      const token = 'valid-test-token';
      const mockUser = TestHelpers.createMockUser();

      // Mock authentication
      const integrationService = moduleFixture.get('IntegrationService');
      jest.spyOn(integrationService, 'validateTokenWithAuthService').mockResolvedValue({
        valid: true,
        userId: mockUser.id,
        expiresAt: '2024-12-31T23:59:59Z',
      });
      jest.spyOn(integrationService, 'getUserProfile').mockResolvedValue(mockUser);

      const requests = Array.from({ length: 200 }, () =>
        request(app.getHttpServer())
          .get('/api/questions/personalized')
          .set('Authorization', `Bearer ${token}`)
          .query({ topic: 'algorithms' })
      );

      const responses = await Promise.all(requests);
      
      // Some requests should be rate limited
      const rateLimitedResponses = responses.filter(r => r.status === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });
  });

  describe('Authorization Security', () => {
    it('should enforce role-based access control', async () => {
      const token = 'valid-test-token';
      const mockUser = { ...TestHelpers.createMockUser(), roles: ['learner'] };

      // Mock authentication
      const integrationService = moduleFixture.get('IntegrationService');
      jest.spyOn(integrationService, 'validateTokenWithAuthService').mockResolvedValue({
        valid: true,
        userId: mockUser.id,
        expiresAt: '2024-12-31T23:59:59Z',
      });
      jest.spyOn(integrationService, 'getUserProfile').mockResolvedValue(mockUser);
      jest.spyOn(integrationService, 'getUserRoles').mockResolvedValue(['learner']);

      // Try to access instructor-only endpoint
      await request(app.getHttpServer())
        .get('/api/questions/admin/stats')
        .set('Authorization', `Bearer ${token}`)
        .expect(403);
    });

    it('should prevent access to other users data', async () => {
      const token = 'valid-test-token';
      const mockUser = TestHelpers.createMockUser();
      const otherUserId = 'other-user-123';

      // Mock authentication
      const integrationService = moduleFixture.get('IntegrationService');
      jest.spyOn(integrationService, 'validateTokenWithAuthService').mockResolvedValue({
        valid: true,
        userId: mockUser.id,
        expiresAt: '2024-12-31T23:59:59Z',
      });
      jest.spyOn(integrationService, 'getUserProfile').mockResolvedValue(mockUser);

      // Try to access another user's sessions
      await request(app.getHttpServer())
        .get(`/api/questions/sessions?learnerId=${otherUserId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(403);
    });
  });

  describe('Data Sanitization Security', () => {
    it('should sanitize user input in responses', async () => {
      const token = 'valid-test-token';
      const mockUser = TestHelpers.createMockUser();
      const mockQuestion = {
        ...TestHelpers.createMockQuestion(),
        description: '<script>alert("XSS")</script>Test description',
      };

      // Mock authentication
      const integrationService = moduleFixture.get('IntegrationService');
      jest.spyOn(integrationService, 'validateTokenWithAuthService').mockResolvedValue({
        valid: true,
        userId: mockUser.id,
        expiresAt: '2024-12-31T23:59:59Z',
      });
      jest.spyOn(integrationService, 'getUserProfile').mockResolvedValue(mockUser);
      jest.spyOn(integrationService, 'getQuestionQuotas').mockResolvedValue(TestHelpers.createMockQuestionQuotas());
      jest.spyOn(integrationService, 'getContextualContent').mockResolvedValue(TestHelpers.createMockContextualContent());
      jest.spyOn(integrationService, 'generateQuestion').mockResolvedValue({
        questions: [mockQuestion]
      });

      const response = await request(app.getHttpServer())
        .get('/api/questions/personalized')
        .set('Authorization', `Bearer ${token}`)
        .query({ topic: 'algorithms' })
        .expect(200);

      // Check that HTML is escaped in response
      expect(response.body.questions[0].description).not.toContain('<script>');
      expect(response.body.questions[0].description).toContain('&lt;script&gt;');
    });
  });

  describe('Session Security', () => {
    it('should invalidate sessions on logout', async () => {
      const token = 'valid-test-token';
      const mockUser = TestHelpers.createMockUser();

      // Mock authentication
      const integrationService = moduleFixture.get('IntegrationService');
      jest.spyOn(integrationService, 'validateTokenWithAuthService').mockResolvedValue({
        valid: true,
        userId: mockUser.id,
        expiresAt: '2024-12-31T23:59:59Z',
      });
      jest.spyOn(integrationService, 'getUserProfile').mockResolvedValue(mockUser);

      // Logout
      await request(app.getHttpServer())
        .post('/api/auth/session/destroy')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      // Try to use the same token after logout
      await request(app.getHttpServer())
        .get('/api/questions/personalized')
        .set('Authorization', `Bearer ${token}`)
        .expect(401);
    });

    it('should enforce session timeout', async () => {
      const expiredToken = 'expired-token';
      
      // Mock expired token validation
      const integrationService = moduleFixture.get('IntegrationService');
      jest.spyOn(integrationService, 'validateTokenWithAuthService').mockResolvedValue({
        valid: false,
      });

      await request(app.getHttpServer())
        .get('/api/questions/personalized')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401);
    });
  });
});
