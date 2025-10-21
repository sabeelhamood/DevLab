import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsArray, IsOptional, IsNumber, IsDateString } from 'class-validator';

export class ValidateTokenDto {
  @ApiProperty({
    description: 'JWT token to validate',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
  })
  @IsString()
  @IsNotEmpty()
  token: string;
}

export class RefreshTokenDto {
  @ApiProperty({
    description: 'Refresh token to get new access token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
  })
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}

export class AuthResponseDto {
  @ApiProperty({
    description: 'Whether the token is valid',
    example: true
  })
  valid: boolean;

  @ApiProperty({
    description: 'User ID',
    example: 'user-123'
  })
  userId: string;

  @ApiProperty({
    description: 'User email',
    example: 'user@example.com'
  })
  email: string;

  @ApiProperty({
    description: 'User name',
    example: 'John Doe'
  })
  name: string;

  @ApiProperty({
    description: 'User roles',
    example: ['learner', 'instructor'],
    type: [String]
  })
  @IsArray()
  @IsString({ each: true })
  roles: string[];

  @ApiProperty({
    description: 'Organization ID',
    example: 'org-123'
  })
  organizationId: string;

  @ApiProperty({
    description: 'User skill level',
    example: 3
  })
  @IsNumber()
  skillLevel: number;

  @ApiProperty({
    description: 'Token expiration timestamp',
    example: '2024-01-01T12:00:00Z'
  })
  @IsDateString()
  expiresAt: string;
}

export class UserRolesResponseDto {
  @ApiProperty({
    description: 'User roles and permissions',
    example: ['learner', 'instructor'],
    type: [String]
  })
  @IsArray()
  @IsString({ each: true })
  roles: string[];
}

export class SessionValidationDto {
  @ApiProperty({
    description: 'Session ID to validate',
    example: 'session-123'
  })
  @IsString()
  @IsNotEmpty()
  sessionId: string;
}

export class CreateSessionDto {
  @ApiProperty({
    description: 'User ID',
    example: 'user-123'
  })
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({
    description: 'Session ID',
    example: 'session-123'
  })
  @IsString()
  @IsNotEmpty()
  sessionId: string;

  @ApiProperty({
    description: 'Session expiration time in seconds',
    example: 900,
    required: false
  })
  @IsNumber()
  @IsOptional()
  expiresIn?: number;
}
