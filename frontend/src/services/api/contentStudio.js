import { apiClient } from './client.js'

export const contentStudioApi = {
  // Generate questions for Content Studio
  async generateQuestions(data) {
    return await apiClient.post('/content-studio/generate-questions', data)
  },

  // Check solution when learner submits
  async checkSolution(data) {
    return await apiClient.post('/content-studio/check-solution', data)
  }
}
