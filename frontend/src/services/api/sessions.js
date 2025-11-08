import { apiClient } from './client.js'

export const sessionsApi = {
  async startSession(courseId, sessionType, questionTypes) {
    return await apiClient.post('/sessions/start', {
      courseId,
      sessionType,
      questionTypes
    })
  },

  async getSession(sessionId) {
    return await apiClient.get(`/sessions/${sessionId}`)
  },

  async submitAnswer(sessionId, questionId, answer, timeSpent) {
    return await apiClient.post(`/sessions/${sessionId}/submit`, {
      questionId,
      answer,
      timeSpent
    })
  },

  async completeSession(sessionId) {
    return await apiClient.post(`/sessions/${sessionId}/complete`)
  },

  async pauseSession(sessionId) {
    return await apiClient.post(`/sessions/${sessionId}/pause`)
  },

  async resumeSession(sessionId) {
    return await apiClient.post(`/sessions/${sessionId}/resume`)
  },

  async getSessionHistory(learnerId, page = 1, limit = 10) {
    return await apiClient.get(`/sessions/history/${learnerId}?page=${page}&limit=${limit}`)
  },

  async getSessionAnalytics(sessionId) {
    return await apiClient.get(`/sessions/${sessionId}/analytics`)
  }
}