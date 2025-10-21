export interface User {
  id: string;
  email: string;
  name: string;
  roles: string[];
  organizationId: string;
  skillLevel: number;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken: string;
  expiresAt: string;
}

export interface ValidateTokenResponse {
  valid: boolean;
  userId: string;
  email: string;
  name: string;
  roles: string[];
  organizationId: string;
  skillLevel: number;
  expiresAt: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface UserRoles {
  roles: string[];
}

export interface SessionValidation {
  valid: boolean;
}

export interface SessionDestroy {
  success: boolean;
}
