import { create } from 'zustand'
import { PracticeSession, SessionQuestion, Question } from '../types'

interface SessionState {
  currentSession: PracticeSession | null
  currentQuestion: Question | null
  sessionQuestions: SessionQuestion[]
  isLoading: boolean
  error: string | null
  
  // Actions
  startSession: (courseId: string, sessionType: 'practice' | 'competition') => Promise<void>
  submitAnswer: (questionId: string, answer: string, timeSpent: number) => Promise<void>
  requestHint: (questionId: string, hintNumber: number) => Promise<string>
  completeSession: () => Promise<void>
  pauseSession: () => void
  resumeSession: () => void
  clearSession: () => void
  setCurrentQuestion: (question: Question) => void
  setError: (error: string | null) => void
}

export const useSessionStore = create<SessionState>((set, get) => ({
  currentSession: null,
  currentQuestion: null,
  sessionQuestions: [],
  isLoading: false,
  error: null,

  startSession: async (courseId: string, sessionType: 'practice' | 'competition') => {
    set({ isLoading: true, error: null })
    try {
      // This would call the API to start a new session
      const sessionData = {
        id: `session-${Date.now()}`,
        learnerId: 'current-user-id',
        courseId,
        sessionType,
        status: 'active' as const,
        startedAt: new Date().toISOString(),
        totalQuestions: 0,
        correctAnswers: 0,
        score: 0,
        questions: []
      }
      
      set({ 
        currentSession: sessionData, 
        isLoading: false 
      })
    } catch (error: any) {
      set({ error: error.message, isLoading: false })
      throw error
    }
  },

  submitAnswer: async (questionId: string, answer: string, timeSpent: number) => {
    set({ isLoading: true, error: null })
    try {
      // This would call the API to submit the answer
      const sessionQuestion: SessionQuestion = {
        id: `sq-${Date.now()}`,
        sessionId: get().currentSession?.id || '',
        questionId,
        questionOrder: get().sessionQuestions.length + 1,
        learnerAnswer: answer,
        timeSpent,
        hintsUsed: 0,
        submittedAt: new Date().toISOString(),
        createdAt: new Date().toISOString()
      }
      
      set(state => ({
        sessionQuestions: [...state.sessionQuestions, sessionQuestion],
        isLoading: false
      }))
    } catch (error: any) {
      set({ error: error.message, isLoading: false })
      throw error
    }
  },

  requestHint: async (questionId: string, hintNumber: number) => {
    try {
      // This would call the API to get a hint
      const hint = `Hint ${hintNumber}: This is a sample hint for the question.`
      return hint
    } catch (error: any) {
      set({ error: error.message })
      throw error
    }
  },

  completeSession: async () => {
    set({ isLoading: true, error: null })
    try {
      // This would call the API to complete the session
      const session = get().currentSession
      if (session) {
        set({
          currentSession: {
            ...session,
            status: 'completed',
            completedAt: new Date().toISOString()
          },
          isLoading: false
        })
      }
    } catch (error: any) {
      set({ error: error.message, isLoading: false })
      throw error
    }
  },

  pauseSession: () => {
    const session = get().currentSession
    if (session) {
      set({
        currentSession: {
          ...session,
          status: 'paused'
        }
      })
    }
  },

  resumeSession: () => {
    const session = get().currentSession
    if (session) {
      set({
        currentSession: {
          ...session,
          status: 'active'
        }
      })
    }
  },

  clearSession: () => {
    set({
      currentSession: null,
      currentQuestion: null,
      sessionQuestions: [],
      error: null
    })
  },

  setCurrentQuestion: (question: Question) => {
    set({ currentQuestion: question })
  },

  setError: (error: string | null) => {
    set({ error })
  }
}))

