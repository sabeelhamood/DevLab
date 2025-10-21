import { renderHook, act } from '@testing-library/react';
import { useAuthStore } from '../authStore';
import { authApi } from '../../services/api/authApi';

// Mock the auth API
jest.mock('../../services/api/authApi', () => ({
  authApi: {
    login: jest.fn(),
    logout: jest.fn(),
    validateToken: jest.fn(),
    refreshToken: jest.fn(),
    getUserRoles: jest.fn(),
    validateSession: jest.fn(),
    destroySession: jest.fn(),
  },
}));

const mockAuthApi = authApi as jest.Mocked<typeof authApi>;

describe('AuthStore', () => {
  beforeEach(() => {
    // Reset the store state
    useAuthStore.setState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      token: null,
      refreshToken: null,
    });
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('should login successfully', async () => {
      const mockAuthResponse = {
        user: {
          id: 'user-123',
          email: 'test@example.com',
          name: 'Test User',
          roles: ['learner'],
          organizationId: 'org-123',
          skillLevel: 3,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
        token: 'access-token',
        refreshToken: 'refresh-token',
        expiresAt: '2024-12-31T23:59:59Z',
      };

      mockAuthApi.login.mockResolvedValue(mockAuthResponse);

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.login('test@example.com', 'password');
      });

      expect(result.current.user).toEqual(mockAuthResponse.user);
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.token).toBe('access-token');
      expect(result.current.refreshToken).toBe('refresh-token');
      expect(result.current.error).toBeNull();
      expect(result.current.isLoading).toBe(false);
    });

    it('should handle login failure', async () => {
      const errorMessage = 'Invalid credentials';
      mockAuthApi.login.mockRejectedValue(new Error(errorMessage));

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        try {
          await result.current.login('test@example.com', 'wrong-password');
        } catch (error) {
          // Expected to throw
        }
      });

      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.error).toBe(errorMessage);
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('logout', () => {
    it('should logout successfully', () => {
      const { result } = renderHook(() => useAuthStore());

      // Set initial state
      act(() => {
        useAuthStore.setState({
          user: { id: 'user-123', email: 'test@example.com', name: 'Test User', roles: ['learner'], organizationId: 'org-123', skillLevel: 3, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
          isAuthenticated: true,
          token: 'access-token',
          refreshToken: 'refresh-token',
        });
      });

      act(() => {
        result.current.logout();
      });

      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.token).toBeNull();
      expect(result.current.refreshToken).toBeNull();
    });
  });

  describe('validateToken', () => {
    it('should validate token successfully', async () => {
      const mockValidateResponse = {
        valid: true,
        userId: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        roles: ['learner'],
        organizationId: 'org-123',
        skillLevel: 3,
        expiresAt: '2024-12-31T23:59:59Z',
      };

      mockAuthApi.validateToken.mockResolvedValue(mockValidateResponse);

      const { result } = renderHook(() => useAuthStore());

      const isValid = await act(async () => {
        return await result.current.validateToken('valid-token');
      });

      expect(isValid).toBe(true);
      expect(result.current.user).toEqual({
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        roles: ['learner'],
        organizationId: 'org-123',
        skillLevel: 3,
        createdAt: undefined,
        updatedAt: undefined,
      });
      expect(result.current.isAuthenticated).toBe(true);
    });

    it('should handle invalid token', async () => {
      mockAuthApi.validateToken.mockRejectedValue(new Error('Invalid token'));

      const { result } = renderHook(() => useAuthStore());

      const isValid = await act(async () => {
        return await result.current.validateToken('invalid-token');
      });

      expect(isValid).toBe(false);
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
    });
  });

  describe('refreshAuthToken', () => {
    it('should refresh token successfully', async () => {
      const mockAuthResponse = {
        user: {
          id: 'user-123',
          email: 'test@example.com',
          name: 'Test User',
          roles: ['learner'],
          organizationId: 'org-123',
          skillLevel: 3,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
        token: 'new-access-token',
        refreshToken: 'new-refresh-token',
        expiresAt: '2024-12-31T23:59:59Z',
      };

      mockAuthApi.refreshToken.mockResolvedValue(mockAuthResponse);

      const { result } = renderHook(() => useAuthStore());

      // Set initial state with refresh token
      act(() => {
        useAuthStore.setState({
          refreshToken: 'old-refresh-token',
        });
      });

      await act(async () => {
        await result.current.refreshAuthToken();
      });

      expect(result.current.user).toEqual(mockAuthResponse.user);
      expect(result.current.token).toBe('new-access-token');
      expect(result.current.refreshToken).toBe('new-refresh-token');
      expect(result.current.isAuthenticated).toBe(true);
    });

    it('should handle refresh failure', async () => {
      mockAuthApi.refreshToken.mockRejectedValue(new Error('Refresh failed'));

      const { result } = renderHook(() => useAuthStore());

      // Set initial state with refresh token
      act(() => {
        useAuthStore.setState({
          refreshToken: 'invalid-refresh-token',
        });
      });

      await act(async () => {
        await result.current.refreshAuthToken();
      });

      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
      expect(result.current.token).toBeNull();
      expect(result.current.refreshToken).toBeNull();
    });
  });

  describe('clearError', () => {
    it('should clear error', () => {
      const { result } = renderHook(() => useAuthStore());

      // Set error state
      act(() => {
        useAuthStore.setState({ error: 'Some error' });
      });

      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
    });
  });

  describe('setLoading', () => {
    it('should set loading state', () => {
      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.setLoading(true);
      });

      expect(result.current.isLoading).toBe(true);

      act(() => {
        result.current.setLoading(false);
      });

      expect(result.current.isLoading).toBe(false);
    });
  });
});
