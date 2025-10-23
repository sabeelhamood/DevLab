import { apiClient } from './client.js'

export const questionsApi = {
  async getPersonalizedQuestions(courseId, topicId, type) {
    const params = new URLSearchParams()
    if (topicId) params.append('topicId', topicId)
    if (type) params.append('type', type)
    
    return await apiClient.get(`/questions/personalized?courseId=${courseId}&${params.toString()}`)
  },

  async getQuestion(questionId) {
    return await apiClient.get(`/questions/${questionId}`)
  },

  async submitAnswer(questionId, submission) {
    return await apiClient.post(`/questions/${questionId}/submit`, submission)
  },

  async getFeedback(questionId) {
    return await apiClient.get(`/questions/${questionId}/feedback`)
  },

  async requestHint(questionId, hintNumber) {
    return await apiClient.post(`/questions/${questionId}/hint`, {
      hintNumber
    })
  },

  async getSolution(questionId) {
    return await apiClient.get(`/questions/${questionId}/solution`)
  },

  // Trainer endpoints
  async createQuestion(questionData) {
    return await apiClient.post('/questions', questionData)
  },

  async updateQuestion(questionId, questionData) {
    return await apiClient.put(`/questions/${questionId}`, questionData)
  },

  async deleteQuestion(questionId) {
    return await apiClient.delete(`/questions/${questionId}`)
  },

  async getQuestionsByCourse(courseId, page = 1, limit = 10) {
    return await apiClient.get(`/questions/course/${courseId}?page=${page}&limit=${limit}`)
  },

  async validateQuestion(questionId) {
    return await apiClient.post(`/questions/${questionId}/validate`)
  }
}