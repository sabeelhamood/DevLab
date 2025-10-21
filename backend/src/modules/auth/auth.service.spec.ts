import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CacheService } from '../../shared/cache/cache.service';
import { IntegrationService } from '../integration/integration.service';

describe('AuthService', () => {
  let service: AuthService;
  let jwtService: JwtService;
  let cacheService: CacheService;
  let integrationService: IntegrationService;

  const mockJwtService = {
    verifyAsync: jest.fn(),
    signAsync: jest.fn(),
  };

  const mockCacheService = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
  };

  const mockIntegrationService = {
    validateTokenWithAuthService: jest.fn(),
    refreshTokenWithAuthService: jest.fn(),
    getUserProfile: jest.fn(),
    getUserRoles: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('test-secret'),
          },
        },
        {
          provide: CacheService,
          useValue: mockCacheService,
        },
        {
          provide: IntegrationService,
          useValue: mockIntegrationService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jwtService = module.get<JwtService>(JwtService);
    cacheService = module.get<CacheService>(CacheService);
    integrationService = module.get<IntegrationService>(IntegrationService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('validateToken', () => {
    it('should validate token successfully', async () => {
      const token = 'valid-token';
      const authResult = {
        valid: true,
        userId: 'user-123',
        expiresAt: '2024-01-01T12:00:00Z',
      };
      const userProfile = {
        email: 'user@example.com',
        name: 'John Doe',
        organizationId: 'org-123',
        skillLevel: 3,
      };

      mockCacheService.get.mockResolvedValue(null);
      mockIntegrationService.validateTokenWithAuthService.mockResolvedValue(authResult);
      mockIntegrationService.getUserProfile.mockResolvedValue(userProfile);
      mockCacheService.set.mockResolvedValue(undefined);

      const result = await service.validateToken({ token });

      expect(result).toEqual({
        valid: true,
        userId: 'user-123',
        email: 'user@example.com',
        name: 'John Doe',
        roles: [],
        organizationId: 'org-123',
        skillLevel: 3,
        expiresAt: '2024-01-01T12:00:00Z',
      });

      expect(mockIntegrationService.validateTokenWithAuthService).toHaveBeenCalledWith(token);
      expect(mockIntegrationService.getUserProfile).toHaveBeenCalledWith('user-123');
      expect(mockCacheService.set).toHaveBeenCalled();
    });

    it('should return cached result when available', async () => {
      const token = 'valid-token';
      const cachedResult = {
        valid: true,
        userId: 'user-123',
        email: 'user@example.com',
        name: 'John Doe',
        roles: ['learner'],
        organizationId: 'org-123',
        skillLevel: 3,
        expiresAt: '2024-01-01T12:00:00Z',
      };

      mockCacheService.get.mockResolvedValue(cachedResult);

      const result = await service.validateToken({ token });

      expect(result).toEqual(cachedResult);
      expect(mockIntegrationService.validateTokenWithAuthService).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException for invalid token', async () => {
      const token = 'invalid-token';

      mockCacheService.get.mockResolvedValue(null);
      mockIntegrationService.validateTokenWithAuthService.mockResolvedValue({
        valid: false,
      });

      await expect(service.validateToken({ token })).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when integration service fails', async () => {
      const token = 'valid-token';

      mockCacheService.get.mockResolvedValue(null);
      mockIntegrationService.validateTokenWithAuthService.mockRejectedValue(
        new Error('Service unavailable')
      );

      await expect(service.validateToken({ token })).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('refreshToken', () => {
    it('should refresh token successfully', async () => {
      const refreshToken = 'valid-refresh-token';
      const refreshResult = {
        valid: true,
        userId: 'user-123',
        expiresAt: '2024-01-01T12:00:00Z',
      };
      const userProfile = {
        email: 'user@example.com',
        name: 'John Doe',
        organizationId: 'org-123',
        skillLevel: 3,
      };

      mockIntegrationService.refreshTokenWithAuthService.mockResolvedValue(refreshResult);
      mockIntegrationService.getUserProfile.mockResolvedValue(userProfile);
      mockCacheService.del.mockResolvedValue(undefined);

      const result = await service.refreshToken({ refreshToken });

      expect(result).toEqual({
        valid: true,
        userId: 'user-123',
        email: 'user@example.com',
        name: 'John Doe',
        roles: [],
        organizationId: 'org-123',
        skillLevel: 3,
        expiresAt: '2024-01-01T12:00:00Z',
      });

      expect(mockIntegrationService.refreshTokenWithAuthService).toHaveBeenCalledWith(refreshToken);
      expect(mockCacheService.del).toHaveBeenCalled();
    });

    it('should throw UnauthorizedException for invalid refresh token', async () => {
      const refreshToken = 'invalid-refresh-token';

      mockIntegrationService.refreshTokenWithAuthService.mockResolvedValue({
        valid: false,
      });

      await expect(service.refreshToken({ refreshToken })).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('getUserRoles', () => {
    it('should return user roles', async () => {
      const userId = 'user-123';
      const roles = ['learner', 'instructor'];

      mockCacheService.get.mockResolvedValue(null);
      mockIntegrationService.getUserRoles.mockResolvedValue(roles);
      mockCacheService.set.mockResolvedValue(undefined);

      const result = await service.getUserRoles(userId);

      expect(result).toEqual(roles);
      expect(mockIntegrationService.getUserRoles).toHaveBeenCalledWith(userId);
      expect(mockCacheService.set).toHaveBeenCalled();
    });

    it('should return cached roles when available', async () => {
      const userId = 'user-123';
      const cachedRoles = ['learner'];

      mockCacheService.get.mockResolvedValue(cachedRoles);

      const result = await service.getUserRoles(userId);

      expect(result).toEqual(cachedRoles);
      expect(mockIntegrationService.getUserRoles).not.toHaveBeenCalled();
    });

    it('should return empty array when service fails', async () => {
      const userId = 'user-123';

      mockCacheService.get.mockResolvedValue(null);
      mockIntegrationService.getUserRoles.mockRejectedValue(new Error('Service unavailable'));

      const result = await service.getUserRoles(userId);

      expect(result).toEqual([]);
    });
  });

  describe('validateSession', () => {
    it('should return true for valid session', async () => {
      const userId = 'user-123';
      const sessionId = 'session-123';

      mockCacheService.get.mockResolvedValue({ userId, sessionId });

      const result = await service.validateSession(userId, sessionId);

      expect(result).toBe(true);
    });

    it('should return false for invalid session', async () => {
      const userId = 'user-123';
      const sessionId = 'session-123';

      mockCacheService.get.mockResolvedValue(null);

      const result = await service.validateSession(userId, sessionId);

      expect(result).toBe(false);
    });
  });

  describe('createSession', () => {
    it('should create session successfully', async () => {
      const userId = 'user-123';
      const sessionId = 'session-123';
      const expiresIn = 900;

      mockCacheService.set.mockResolvedValue(undefined);

      await service.createSession(userId, sessionId, expiresIn);

      expect(mockCacheService.set).toHaveBeenCalledWith(
        `auth:session:${userId}:${sessionId}`,
        { userId, sessionId, createdAt: expect.any(Date) },
        expiresIn
      );
    });
  });

  describe('destroySession', () => {
    it('should destroy session successfully', async () => {
      const userId = 'user-123';
      const sessionId = 'session-123';

      mockCacheService.del.mockResolvedValue(undefined);

      await service.destroySession(userId, sessionId);

      expect(mockCacheService.del).toHaveBeenCalledWith(`auth:session:${userId}:${sessionId}`);
    });
  });
});
