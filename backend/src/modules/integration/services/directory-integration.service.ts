import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class DirectoryIntegrationService {
  private readonly logger = new Logger(DirectoryIntegrationService.name);
  private readonly baseUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.baseUrl = this.configService.get('DIRECTORY_SERVICE_URL', 'http://localhost:3002');
  }

  async getUserProfile(userId: string): Promise<any> {
    try {
      this.logger.log(`Getting user profile for user: ${userId}`);

      const response = await firstValueFrom(
        this.httpService.get(`${this.baseUrl}/api/learner-profile/${userId}`, {
          timeout: 5000,
        })
      );

      this.logger.log(`User profile retrieved for user: ${userId}`);
      return response.data;
    } catch (error) {
      this.logger.error(`Failed to get user profile: ${error.message}`);
      throw new HttpException('Directory service unavailable', HttpStatus.SERVICE_UNAVAILABLE);
    }
  }

  async getQuestionQuotas(userId: string): Promise<any> {
    try {
      this.logger.log(`Getting question quotas for user: ${userId}`);

      const response = await firstValueFrom(
        this.httpService.get(`${this.baseUrl}/api/question-quotas/${userId}`, {
          timeout: 5000,
        })
      );

      this.logger.log(`Question quotas retrieved for user: ${userId}`);
      return response.data;
    } catch (error) {
      this.logger.error(`Failed to get question quotas: ${error.message}`);
      throw new HttpException('Directory service unavailable', HttpStatus.SERVICE_UNAVAILABLE);
    }
  }

  async getOrganizationMapping(organizationId: string): Promise<any> {
    try {
      this.logger.log(`Getting organization mapping for org: ${organizationId}`);

      const response = await firstValueFrom(
        this.httpService.get(`${this.baseUrl}/api/organization-mapping/${organizationId}`, {
          timeout: 5000,
        })
      );

      this.logger.log(`Organization mapping retrieved for org: ${organizationId}`);
      return response.data;
    } catch (error) {
      this.logger.error(`Failed to get organization mapping: ${error.message}`);
      throw new HttpException('Directory service unavailable', HttpStatus.SERVICE_UNAVAILABLE);
    }
  }
}
