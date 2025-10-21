import { apiClient } from './apiClient';
import { AuthResponse, User, ValidateTokenResponse } from '@/types/auth';

export const authApi = {
  /**
   * Login with email and password
   */
  async login(credentials: { email: string; password: string }): Promise<AuthResponse> {
    const response = await apiClient.post('/auth/login', credentials);
    return response.data;
  },

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    await apiClient.post('/auth/logout');
  },

  /**
   * Validate JWT token
   */
  async validateToken(token: string): Promise<ValidateTokenResponse> {
    const response = await apiClient.post('/auth/validate', { token });
    return response.data;
  },

  /**
   * Refresh JWT token
   */
  async refreshToken(refreshToken: string): Promise<AuthResponse> {
    const response = await apiClient.post('/auth/refresh', { refreshToken });
    return response.data;
  },

  /**
   * Get user roles
   */
  async getUserRoles(): Promise<{ roles: string[] }> {
    const response = await apiClient.get('/auth/roles');
    return response.data;
  },

  /**
   * Validate user session
   */
  async validateSession(): Promise<{ valid: boolean }> {
    const response = await apiClient.post('/auth/session/validate');
    return response.data;
  },

  /**
   * Destroy user session
   */
  async destroySession(): Promise<{ success: boolean }> {
    const response = await apiClient.post('/auth/session/destroy');
    return response.data;
  },
};
