import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { CacheService } from '../../shared/cache/cache.service';
import { IntegrationService } from '../integration/integration.service';
import { 
  ValidateTokenDto, 
  RefreshTokenDto, 
  AuthResponseDto, 
  UserProfileDto 
} from './dto/auth.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly cacheService: CacheService,
    private readonly integrationService: IntegrationService,
  ) {}

  /**
   * Validate JWT token with external authentication service
   */
  async validateToken(validateTokenDto: ValidateTokenDto): Promise<AuthResponseDto> {
    try {
      this.logger.log(`Validating token for user: ${validateTokenDto.token?.substring(0, 20)}...`);

      // Check cache first
      const cacheKey = `auth:token:${validateTokenDto.token}`;
      const cachedResult = await this.cacheService.get(cacheKey);
      
      if (cachedResult) {
        this.logger.log('Token validation result found in cache');
        return cachedResult;
      }

      // Validate with external authentication service
      const authResult = await this.integrationService.validateTokenWithAuthService(validateTokenDto.token);
      
      if (!authResult.valid) {
        throw new UnauthorizedException('Invalid token');
      }

      // Get user profile from directory service
      const userProfile = await this.integrationService.getUserProfile(authResult.userId);
      
      const response: AuthResponseDto = {
        valid: true,
        userId: authResult.userId,
        email: userProfile.email,
        name: userProfile.name,
        roles: authResult.roles,
        organizationId: userProfile.organizationId,
        skillLevel: userProfile.skillLevel,
        expiresAt: authResult.expiresAt,
      };

      // Cache the result for 5 minutes
      await this.cacheService.set(cacheKey, response, 300);

      this.logger.log(`Token validated successfully for user: ${authResult.userId}`);
      return response;

    } catch (error) {
      this.logger.error(`Token validation failed: ${error.message}`);
      throw new UnauthorizedException('Token validation failed');
    }
  }

  /**
   * Refresh JWT token
   */
  async refreshToken(refreshTokenDto: RefreshTokenDto): Promise<AuthResponseDto> {
    try {
      this.logger.log('Refreshing token...');

      // Validate refresh token with external service
      const refreshResult = await this.integrationService.refreshTokenWithAuthService(refreshTokenDto.refreshToken);
      
      if (!refreshResult.valid) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      // Get updated user profile
      const userProfile = await this.integrationService.getUserProfile(refreshResult.userId);
      
      const response: AuthResponseDto = {
        valid: true,
        userId: refreshResult.userId,
        email: userProfile.email,
        name: userProfile.name,
        roles: refreshResult.roles,
        organizationId: userProfile.organizationId,
        skillLevel: userProfile.skillLevel,
        expiresAt: refreshResult.expiresAt,
      };

      // Clear old token cache
      await this.cacheService.del(`auth:token:${refreshTokenDto.refreshToken}`);

      this.logger.log(`Token refreshed successfully for user: ${refreshResult.userId}`);
      return response;

    } catch (error) {
      this.logger.error(`Token refresh failed: ${error.message}`);
      throw new UnauthorizedException('Token refresh failed');
    }
  }

  /**
   * Get user roles and permissions
   */
  async getUserRoles(userId: string): Promise<string[]> {
    try {
      this.logger.log(`Getting roles for user: ${userId}`);

      // Check cache first
      const cacheKey = `auth:roles:${userId}`;
      const cachedRoles = await this.cacheService.get(cacheKey);
      
      if (cachedRoles) {
        return cachedRoles;
      }

      // Get roles from external service
      const roles = await this.integrationService.getUserRoles(userId);
      
      // Cache roles for 10 minutes
      await this.cacheService.set(cacheKey, roles, 600);

      return roles;

    } catch (error) {
      this.logger.error(`Failed to get user roles: ${error.message}`);
      return [];
    }
  }

  /**
   * Validate user session
   */
  async validateSession(userId: string, sessionId: string): Promise<boolean> {
    try {
      const cacheKey = `auth:session:${userId}:${sessionId}`;
      const session = await this.cacheService.get(cacheKey);
      
      return !!session;
    } catch (error) {
      this.logger.error(`Session validation failed: ${error.message}`);
      return false;
    }
  }

  /**
   * Create user session
   */
  async createSession(userId: string, sessionId: string, expiresIn: number = 900): Promise<void> {
    try {
      const cacheKey = `auth:session:${userId}:${sessionId}`;
      await this.cacheService.set(cacheKey, { userId, sessionId, createdAt: new Date() }, expiresIn);
      
      this.logger.log(`Session created for user: ${userId}`);
    } catch (error) {
      this.logger.error(`Failed to create session: ${error.message}`);
    }
  }

  /**
   * Destroy user session
   */
  async destroySession(userId: string, sessionId: string): Promise<void> {
    try {
      const cacheKey = `auth:session:${userId}:${sessionId}`;
      await this.cacheService.del(cacheKey);
      
      this.logger.log(`Session destroyed for user: ${userId}`);
    } catch (error) {
      this.logger.error(`Failed to destroy session: ${error.message}`);
    }
  }
}
