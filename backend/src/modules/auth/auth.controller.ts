import { 
  Controller, 
  Post, 
  Get, 
  Body, 
  UseGuards, 
  Request, 
  HttpCode, 
  HttpStatus,
  Logger 
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ThrottlerGuard } from '@nestjs/throttler';

import { AuthService } from './auth.service';
import { AuthGuard } from './guards/auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { Roles } from './decorators/roles.decorator';
import { 
  ValidateTokenDto, 
  RefreshTokenDto, 
  AuthResponseDto, 
  UserRolesResponseDto 
} from './dto/auth.dto';

@ApiTags('Authentication')
@Controller('auth')
@UseGuards(ThrottlerGuard)
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private readonly authService: AuthService) {}

  @Post('validate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Validate JWT token',
    description: 'Validates JWT token with external authentication service and returns user information'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Token validation successful',
    type: AuthResponseDto 
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Invalid or expired token' 
  })
  @ApiResponse({ 
    status: 429, 
    description: 'Too many requests' 
  })
  async validateToken(@Body() validateTokenDto: ValidateTokenDto): Promise<AuthResponseDto> {
    this.logger.log('Token validation request received');
    return this.authService.validateToken(validateTokenDto);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Refresh JWT token',
    description: 'Refreshes expired JWT token using refresh token'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Token refresh successful',
    type: AuthResponseDto 
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Invalid refresh token' 
  })
  @ApiResponse({ 
    status: 429, 
    description: 'Too many requests' 
  })
  async refreshToken(@Body() refreshTokenDto: RefreshTokenDto): Promise<AuthResponseDto> {
    this.logger.log('Token refresh request received');
    return this.authService.refreshToken(refreshTokenDto);
  }

  @Get('roles')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Get user roles',
    description: 'Retrieves roles and permissions for the authenticated user'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'User roles retrieved successfully',
    type: UserRolesResponseDto 
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Unauthorized' 
  })
  async getUserRoles(@Request() req): Promise<UserRolesResponseDto> {
    this.logger.log(`Getting roles for user: ${req.user.userId}`);
    const roles = await this.authService.getUserRoles(req.user.userId);
    return { roles };
  }

  @Post('session/validate')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Validate user session',
    description: 'Validates if the user session is still active'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Session validation result',
    schema: {
      type: 'object',
      properties: {
        valid: { type: 'boolean' }
      }
    }
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Unauthorized' 
  })
  async validateSession(@Request() req): Promise<{ valid: boolean }> {
    this.logger.log(`Validating session for user: ${req.user.userId}`);
    const valid = await this.authService.validateSession(req.user.userId, req.user.sessionId);
    return { valid };
  }

  @Post('session/destroy')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Destroy user session',
    description: 'Destroys the current user session and logs out the user'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Session destroyed successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' }
      }
    }
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Unauthorized' 
  })
  async destroySession(@Request() req): Promise<{ success: boolean }> {
    this.logger.log(`Destroying session for user: ${req.user.userId}`);
    await this.authService.destroySession(req.user.userId, req.user.sessionId);
    return { success: true };
  }
}
