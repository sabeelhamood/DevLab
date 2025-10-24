import { create } from 'zustand'
import { geminiAPI } from '../services/api/gemini.js'

export const useSessionStore = create((set, get) => ({
  currentSession: null,
  currentQuestion: null,
  sessionQuestions: [],
  isLoading: false,
  error: null,

  startSession: async (courseId, sessionType) => {
    set({ isLoading: true, error: null })
    try {
      // This would call the API to start a new session
      const sessionData = {
        id: `session-${Date.now()}`,
        learnerId: 'current-user-id',
        courseId,
        sessionType,
        status: 'active',
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
    } catch (error) {
      set({ error: error.message, isLoading: false })
      throw error
    }
  },

  submitAnswer: async (questionId, answer, timeSpent) => {
    set({ isLoading: true, error: null })
    try {
      // This would call the API to submit the answer
      const sessionQuestion = {
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
    } catch (error) {
      set({ error: error.message, isLoading: false })
      throw error
    }
  },

  requestHint: async (questionId, hintNumber) => {
    try {
      set({ isLoading: true, error: null })
      
      // Get current question data
      const currentQuestion = get().currentQuestion
      if (!currentQuestion) {
        throw new Error('No current question available')
      }
      
      // Get user's current attempt (if any)
      const userAttempt = currentQuestion.userAnswer || ''
      const hintsUsed = hintNumber - 1
      const allHints = currentQuestion.hintsUsed || []
      
      // Call real Gemini API for hint generation
      const hint = await geminiAPI.generateHint(
        currentQuestion.description || currentQuestion.title,
        userAttempt,
        hintsUsed,
        allHints
      )
      
      set({ isLoading: false })
      return hint
    } catch (error) {
      set({ error: error.message, isLoading: false })
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
    } catch (error) {
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

  setCurrentQuestion: (question) => {
    set({ currentQuestion: question })
  },

  setError: (error) => {
    set({ error })
  }
}))