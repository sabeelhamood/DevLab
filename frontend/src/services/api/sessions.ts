import { apiClient } from './client'
import { PracticeSession, SessionQuestion, ApiResponse } from '../../types'

export const sessionsApi = {
  async startSession(courseId: string, sessionType: 'practice' | 'competition', questionTypes?: ('code' | 'theoretical')[]): Promise<ApiResponse<PracticeSession>> {
    return await apiClient.post<ApiResponse<PracticeSession>>('/sessions/start', {
      courseId,
      sessionType,
      questionTypes
    })
  },

  async getSession(sessionId: string): Promise<ApiResponse<PracticeSession>> {
    return await apiClient.get<ApiResponse<PracticeSession>>(`/sessions/${sessionId}`)
  },

  async submitAnswer(sessionId: string, questionId: string, answer: string, timeSpent: number): Promise<ApiResponse<{ isCorrect: boolean; feedback: string }>> {
    return await apiClient.post<ApiResponse<{ isCorrect: boolean; feedback: string }>>(`/sessions/${sessionId}/submit`, {
      questionId,
      answer,
      timeSpent
    })
  },

  async completeSession(sessionId: string): Promise<ApiResponse<{ score: number; totalQuestions: number; correctAnswers: number; analytics: any }>> {
    return await apiClient.post<ApiResponse<{ score: number; totalQuestions: number; correctAnswers: number; analytics: any }>>(`/sessions/${sessionId}/complete`)
  },

  async pauseSession(sessionId: string): Promise<ApiResponse<void>> {
    return await apiClient.post<ApiResponse<void>>(`/sessions/${sessionId}/pause`)
  },

  async resumeSession(sessionId: string): Promise<ApiResponse<void>> {
    return await apiClient.post<ApiResponse<void>>(`/sessions/${sessionId}/resume`)
  },

  async getSessionHistory(learnerId: string, page = 1, limit = 10): Promise<ApiResponse<PracticeSession[]>> {
    return await apiClient.get<ApiResponse<PracticeSession[]>>(`/sessions/history/${learnerId}?page=${page}&limit=${limit}`)
  },

  async getSessionAnalytics(sessionId: string): Promise<ApiResponse<any>> {
    return await apiClient.get<ApiResponse<any>>(`/sessions/${sessionId}/analytics`)
  }
}
