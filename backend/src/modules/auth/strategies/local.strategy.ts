import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { AuthService } from '../auth.service';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(LocalStrategy.name);

  constructor(private readonly authService: AuthService) {
    super({
      usernameField: 'email',
      passwordField: 'password',
    });
  }

  async validate(email: string, password: string): Promise<any> {
    try {
      this.logger.log(`Attempting local authentication for email: ${email}`);

      // This would typically validate against a local user database
      // For now, we'll delegate to external authentication service
      const user = await this.authService.validateLocalUser(email, password);
      
      if (!user) {
        this.logger.warn(`Local authentication failed for email: ${email}`);
        throw new UnauthorizedException('Invalid credentials');
      }

      this.logger.log(`Local authentication successful for user: ${user.userId}`);
      return user;
    } catch (error) {
      this.logger.error(`Local authentication error: ${error.message}`);
      throw new UnauthorizedException('Authentication failed');
    }
  }
}
