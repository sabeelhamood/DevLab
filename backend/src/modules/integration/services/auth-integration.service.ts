import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class AuthIntegrationService {
  private readonly logger = new Logger(AuthIntegrationService.name);
  private readonly baseUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.baseUrl = this.configService.get('AUTH_SERVICE_URL', 'http://localhost:3001');
  }

  async validateToken(token: string): Promise<any> {
    try {
      this.logger.log('Validating token with authentication service');

      const response = await firstValueFrom(
        this.httpService.post(`${this.baseUrl}/api/auth/validate`, {
          token,
        }, {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 5000,
        })
      );

      this.logger.log('Token validation successful');
      return response.data;
    } catch (error) {
      this.logger.error(`Token validation failed: ${error.message}`);
      throw new HttpException('Authentication service unavailable', HttpStatus.SERVICE_UNAVAILABLE);
    }
  }

  async refreshToken(refreshToken: string): Promise<any> {
    try {
      this.logger.log('Refreshing token with authentication service');

      const response = await firstValueFrom(
        this.httpService.post(`${this.baseUrl}/api/auth/refresh`, {
          refreshToken,
        }, {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 5000,
        })
      );

      this.logger.log('Token refresh successful');
      return response.data;
    } catch (error) {
      this.logger.error(`Token refresh failed: ${error.message}`);
      throw new HttpException('Authentication service unavailable', HttpStatus.SERVICE_UNAVAILABLE);
    }
  }

  async getUserRoles(userId: string): Promise<string[]> {
    try {
      this.logger.log(`Getting user roles for user: ${userId}`);

      const response = await firstValueFrom(
        this.httpService.get(`${this.baseUrl}/api/auth/roles/${userId}`, {
          timeout: 5000,
        })
      );

      this.logger.log(`User roles retrieved for user: ${userId}`);
      return response.data.roles || [];
    } catch (error) {
      this.logger.error(`Failed to get user roles: ${error.message}`);
      return [];
    }
  }
}
