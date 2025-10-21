import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthController } from '../../../src/modules/auth/auth.controller';
import { AuthService } from '../../../src/modules/auth/auth.service';
import { CacheService } from '../../../src/shared/cache/cache.service';
import { IntegrationService } from '../../../src/modules/integration/integration.service';
import { TestHelpers } from '../../helpers/test-helpers';

describe('AuthController', () => {
  let app: INestApplication;
  let controller: AuthController;
  let authService: AuthService;
  let integrationService: IntegrationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        AuthService,
        {
          provide: JwtService,
          useValue: {
            verifyAsync: jest.fn(),
            signAsync: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('test-secret'),
          },
        },
        {
          provide: CacheService,
          useValue: {
            get: jest.fn(),
            set: jest.fn(),
            del: jest.fn(),
          },
        },
        {
          provide: IntegrationService,
          useValue: TestHelpers.createMockIntegrationService(),
        },
      ],
    }).compile();

    app = module.createNestApplication();
    await app.init();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
    integrationService = module.get<IntegrationService>(IntegrationService);
  });

  afterEach(async () => {
    await app.close();
  });

  describe('validateToken', () => {
    it('should validate token successfully', async () => {
      const token = 'valid-token';
      const expectedResponse = TestHelpers.createMockAuthResponse();

      jest.spyOn(authService, 'validateToken').mockResolvedValue(expectedResponse);

      const result = await controller.validateToken({ token });

      expect(result).toEqual(expectedResponse);
      expect(authService.validateToken).toHaveBeenCalledWith({ token });
    });

    it('should throw UnauthorizedException for invalid token', async () => {
      const token = 'invalid-token';

      jest.spyOn(authService, 'validateToken').mockRejectedValue(
        new Error('Invalid token')
      );

      await expect(controller.validateToken({ token })).rejects.toThrow();
    });
  });

  describe('refreshToken', () => {
    it('should refresh token successfully', async () => {
      const refreshToken = 'valid-refresh-token';
      const expectedResponse = TestHelpers.createMockAuthResponse();

      jest.spyOn(authService, 'refreshToken').mockResolvedValue(expectedResponse);

      const result = await controller.refreshToken({ refreshToken });

      expect(result).toEqual(expectedResponse);
      expect(authService.refreshToken).toHaveBeenCalledWith({ refreshToken });
    });

    it('should throw UnauthorizedException for invalid refresh token', async () => {
      const refreshToken = 'invalid-refresh-token';

      jest.spyOn(authService, 'refreshToken').mockRejectedValue(
        new Error('Invalid refresh token')
      );

      await expect(controller.refreshToken({ refreshToken })).rejects.toThrow();
    });
  });

  describe('getUserRoles', () => {
    it('should return user roles', async () => {
      const mockUser = TestHelpers.createMockUser();
      const expectedRoles = ['learner'];

      jest.spyOn(authService, 'getUserRoles').mockResolvedValue(expectedRoles);

      const result = await controller.getUserRoles({ user: mockUser });

      expect(result).toEqual({ roles: expectedRoles });
      expect(authService.getUserRoles).toHaveBeenCalledWith(mockUser.userId);
    });
  });

  describe('validateSession', () => {
    it('should validate session successfully', async () => {
      const mockUser = TestHelpers.createMockUser();
      const sessionId = 'session-123';

      jest.spyOn(authService, 'validateSession').mockResolvedValue(true);

      const result = await controller.validateSession({ 
        user: { ...mockUser, sessionId } 
      });

      expect(result).toEqual({ valid: true });
      expect(authService.validateSession).toHaveBeenCalledWith(
        mockUser.userId, 
        sessionId
      );
    });

    it('should return false for invalid session', async () => {
      const mockUser = TestHelpers.createMockUser();
      const sessionId = 'invalid-session';

      jest.spyOn(authService, 'validateSession').mockResolvedValue(false);

      const result = await controller.validateSession({ 
        user: { ...mockUser, sessionId } 
      });

      expect(result).toEqual({ valid: false });
    });
  });

  describe('destroySession', () => {
    it('should destroy session successfully', async () => {
      const mockUser = TestHelpers.createMockUser();
      const sessionId = 'session-123';

      jest.spyOn(authService, 'destroySession').mockResolvedValue();

      const result = await controller.destroySession({ 
        user: { ...mockUser, sessionId } 
      });

      expect(result).toEqual({ success: true });
      expect(authService.destroySession).toHaveBeenCalledWith(
        mockUser.userId, 
        sessionId
      );
    });
  });
});
