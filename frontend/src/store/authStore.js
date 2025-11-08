import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      isLoading: false,
      error: null,

      login: async (email, password) => {
        set({ isLoading: true, error: null })
        try {
          // Mock authentication
          const mockUsers = {
            'learner@devlab.com': { 
              id: 'learner_001', 
              name: 'Alex Chen', 
              email: 'learner@devlab.com', 
              role: 'learner',
              password: 'learner123'
            },
            'trainer@devlab.com': { 
              id: 'trainer_001', 
              name: 'Sarah Kim', 
              email: 'trainer@devlab.com', 
              role: 'trainer',
              password: 'trainer123'
            },
            'admin@devlab.com': { 
              id: 'admin_001', 
              name: 'Mike Johnson', 
              email: 'admin@devlab.com', 
              role: 'admin',
              password: 'admin123'
            }
          }

          const user = mockUsers[email]
          if (user && user.password === password) {
            const { password: _, ...userData } = user
            set({ user: userData, isLoading: false })
            return userData
          } else {
            throw new Error('Invalid credentials')
          }
        } catch (error) {
          set({ error: error.message, isLoading: false })
          throw error
        }
      },

      register: async (userData) => {
        set({ isLoading: true, error: null })
        try {
          // Mock registration
          const newUser = {
            id: `user_${Date.now()}`,
            ...userData,
            role: 'learner'
          }
          set({ user: newUser, isLoading: false })
          return newUser
        } catch (error) {
          set({ error: error.message, isLoading: false })
          throw error
        }
      },

      logout: () => {
        set({ user: null, error: null })
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user }),
    }
  )
)
