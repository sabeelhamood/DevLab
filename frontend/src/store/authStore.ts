import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { User } from '../types'
import { authApi } from '../services/api/auth'

interface AuthState {
  user: User | null
  isLoading: boolean
  error: string | null
  login: (email: string, password: string) => Promise<void>
  register: (userData: any) => Promise<void>
  logout: () => void
  checkAuth: () => Promise<void>
  clearError: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isLoading: false,
      error: null,

      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null })
        try {
          const response = await authApi.login(email, password)
          set({ user: response.data, isLoading: false })
        } catch (error: any) {
          set({ error: error.message, isLoading: false })
          throw error
        }
      },

      register: async (userData: any) => {
        set({ isLoading: true, error: null })
        try {
          const response = await authApi.register(userData)
          set({ user: response.data, isLoading: false })
        } catch (error: any) {
          set({ error: error.message, isLoading: false })
          throw error
        }
      },

      logout: () => {
        set({ user: null, error: null })
        // Clear any stored tokens
        localStorage.removeItem('auth-token')
      },

      checkAuth: async () => {
        set({ isLoading: true })
        try {
          const token = localStorage.getItem('auth-token')
          if (!token) {
            set({ isLoading: false })
            return
          }

          const response = await authApi.validateToken(token)
          set({ user: response.data, isLoading: false })
        } catch (error) {
          set({ user: null, isLoading: false })
          localStorage.removeItem('auth-token')
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user }),
    }
  )
)

