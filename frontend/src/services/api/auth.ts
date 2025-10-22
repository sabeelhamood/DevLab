import { apiClient } from './client'
import { User, LoginForm, RegisterForm, ApiResponse } from '../../types'

export const authApi = {
  async login(email: string, password: string): Promise<ApiResponse<User>> {
    const response = await apiClient.post<ApiResponse<User>>('/auth/login', {
      email,
      password,
    })
    
    if (response.success && response.data) {
      localStorage.setItem('auth-token', 'mock-jwt-token')
    }
    
    return response
  },

  async register(userData: RegisterForm): Promise<ApiResponse<User>> {
    const response = await apiClient.post<ApiResponse<User>>('/auth/register', userData)
    
    if (response.success && response.data) {
      localStorage.setItem('auth-token', 'mock-jwt-token')
    }
    
    return response
  },

  async validateToken(token: string): Promise<ApiResponse<User>> {
    return await apiClient.post<ApiResponse<User>>('/auth/validate', { token })
  },

  async refreshToken(): Promise<ApiResponse<{ accessToken: string; refreshToken: string }>> {
    return await apiClient.post<ApiResponse<{ accessToken: string; refreshToken: string }>>('/auth/refresh')
  },

  async logout(): Promise<void> {
    await apiClient.post('/auth/logout')
    localStorage.removeItem('auth-token')
  },

  async getProfile(): Promise<ApiResponse<User>> {
    return await apiClient.get<ApiResponse<User>>('/auth/profile')
  },

  async updateProfile(profileData: Partial<User>): Promise<ApiResponse<User>> {
    return await apiClient.put<ApiResponse<User>>('/auth/profile', profileData)
  }
}
