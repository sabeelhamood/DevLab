import { apiClient } from './client.js'

export const competitionsAIAPI = {
  async getPendingCompetitions(learnerId) {
    if (!learnerId) {
      return []
    }

    const response = await apiClient.get(`/competitions/pending/${learnerId}`)
    return response?.data || []
  },

  async createCompetition(payload) {
    const response = await apiClient.post('/competitions/create', payload)
    return response
  }
}


