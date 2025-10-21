import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { TestHelpers } from '../helpers/test-helpers';

describe('Auth Integration Tests', () => {
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

  describe('POST /api/auth/validate', () => {
    it('should validate token successfully', async () => {
      const token = 'valid-test-token';
      const mockAuthResponse = TestHelpers.createMockAuthResponse();

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

      const response = await request(app.getHttpServer())
        .post('/api/auth/validate')
        .send({ token })
        .expect(200);

      expect(response.body).toHaveProperty('valid', true);
      expect(response.body).toHaveProperty('userId');
      expect(response.body).toHaveProperty('email');
      expect(response.body).toHaveProperty('name');
      expect(response.body).toHaveProperty('roles');
      expect(response.body).toHaveProperty('organizationId');
      expect(response.body).toHaveProperty('skillLevel');
      expect(response.body).toHaveProperty('expiresAt');
    });

    it('should return 401 for invalid token', async () => {
      const token = 'invalid-token';

      const integrationService = moduleFixture.get('IntegrationService');
      jest.spyOn(integrationService, 'validateTokenWithAuthService').mockResolvedValue({
        valid: false,
      });

      await request(app.getHttpServer())
        .post('/api/auth/validate')
        .send({ token })
        .expect(401);
    });

    it('should return 400 for missing token', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/validate')
        .send({})
        .expect(400);
    });
  });

  describe('POST /api/auth/refresh', () => {
    it('should refresh token successfully', async () => {
      const refreshToken = 'valid-refresh-token';
      const mockAuthResponse = TestHelpers.createMockAuthResponse();

      const integrationService = moduleFixture.get('IntegrationService');
      jest.spyOn(integrationService, 'refreshTokenWithAuthService').mockResolvedValue({
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

      const response = await request(app.getHttpServer())
        .post('/api/auth/refresh')
        .send({ refreshToken })
        .expect(200);

      expect(response.body).toHaveProperty('valid', true);
      expect(response.body).toHaveProperty('userId');
      expect(response.body).toHaveProperty('email');
    });

    it('should return 401 for invalid refresh token', async () => {
      const refreshToken = 'invalid-refresh-token';

      const integrationService = moduleFixture.get('IntegrationService');
      jest.spyOn(integrationService, 'refreshTokenWithAuthService').mockResolvedValue({
        valid: false,
      });

      await request(app.getHttpServer())
        .post('/api/auth/refresh')
        .send({ refreshToken })
        .expect(401);
    });
  });

  describe('GET /api/auth/roles', () => {
    it('should return user roles with valid token', async () => {
      const token = 'valid-test-token';
      const mockUser = TestHelpers.createMockUser();
      const mockRoles = ['learner', 'instructor'];

      // Mock authentication
      const integrationService = moduleFixture.get('IntegrationService');
      jest.spyOn(integrationService, 'validateTokenWithAuthService').mockResolvedValue({
        valid: true,
        userId: mockUser.id,
        expiresAt: '2024-12-31T23:59:59Z',
      });
      jest.spyOn(integrationService, 'getUserProfile').mockResolvedValue(mockUser);
      jest.spyOn(integrationService, 'getUserRoles').mockResolvedValue(mockRoles);

      const response = await request(app.getHttpServer())
        .get('/api/auth/roles')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body).toHaveProperty('roles');
      expect(response.body.roles).toEqual(mockRoles);
    });

    it('should return 401 without token', async () => {
      await request(app.getHttpServer())
        .get('/api/auth/roles')
        .expect(401);
    });

    it('should return 401 with invalid token', async () => {
      const token = 'invalid-token';

      const integrationService = moduleFixture.get('IntegrationService');
      jest.spyOn(integrationService, 'validateTokenWithAuthService').mockResolvedValue({
        valid: false,
      });

      await request(app.getHttpServer())
        .get('/api/auth/roles')
        .set('Authorization', `Bearer ${token}`)
        .expect(401);
    });
  });

  describe('POST /api/auth/session/validate', () => {
    it('should validate session successfully', async () => {
      const token = 'valid-test-token';
      const sessionId = 'test-session-123';
      const mockUser = TestHelpers.createMockUser();

      const integrationService = moduleFixture.get('IntegrationService');
      jest.spyOn(integrationService, 'validateTokenWithAuthService').mockResolvedValue({
        valid: true,
        userId: mockUser.id,
        expiresAt: '2024-12-31T23:59:59Z',
      });
      jest.spyOn(integrationService, 'getUserProfile').mockResolvedValue(mockUser);

      const response = await request(app.getHttpServer())
        .post('/api/auth/session/validate')
        .set('Authorization', `Bearer ${token}`)
        .send({ sessionId })
        .expect(200);

      expect(response.body).toHaveProperty('valid');
      expect(typeof response.body.valid).toBe('boolean');
    });
  });

  describe('POST /api/auth/session/destroy', () => {
    it('should destroy session successfully', async () => {
      const token = 'valid-test-token';
      const mockUser = TestHelpers.createMockUser();

      const integrationService = moduleFixture.get('IntegrationService');
      jest.spyOn(integrationService, 'validateTokenWithAuthService').mockResolvedValue({
        valid: true,
        userId: mockUser.id,
        expiresAt: '2024-12-31T23:59:59Z',
      });
      jest.spyOn(integrationService, 'getUserProfile').mockResolvedValue(mockUser);

      const response = await request(app.getHttpServer())
        .post('/api/auth/session/destroy')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
    });
  });
});
