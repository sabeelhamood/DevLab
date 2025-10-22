import { apiClient } from './client'
import { Question, QuestionSubmission, AIFeedback, ApiResponse, PaginatedResponse } from '../../types'

export const questionsApi = {
  async getPersonalizedQuestions(courseId: string, topicId?: string, type?: 'code' | 'theoretical'): Promise<ApiResponse<Question[]>> {
    const params = new URLSearchParams()
    if (topicId) params.append('topicId', topicId)
    if (type) params.append('type', type)
    
    return await apiClient.get<ApiResponse<Question[]>>(`/questions/personalized?courseId=${courseId}&${params.toString()}`)
  },

  async getQuestion(questionId: string): Promise<ApiResponse<Question>> {
    return await apiClient.get<ApiResponse<Question>>(`/questions/${questionId}`)
  },

  async submitAnswer(questionId: string, submission: QuestionSubmission): Promise<ApiResponse<AIFeedback>> {
    return await apiClient.post<ApiResponse<AIFeedback>>(`/questions/${questionId}/submit`, submission)
  },

  async getFeedback(questionId: string): Promise<ApiResponse<AIFeedback>> {
    return await apiClient.get<ApiResponse<AIFeedback>>(`/questions/${questionId}/feedback`)
  },

  async requestHint(questionId: string, hintNumber: number): Promise<ApiResponse<{ hint: string; hintsRemaining: number }>> {
    return await apiClient.post<ApiResponse<{ hint: string; hintsRemaining: number }>>(`/questions/${questionId}/hint`, {
      hintNumber
    })
  },

  async getSolution(questionId: string): Promise<ApiResponse<{ solution: string; explanation: string }>> {
    return await apiClient.get<ApiResponse<{ solution: string; explanation: string }>>(`/questions/${questionId}/solution`)
  },

  // Trainer endpoints
  async createQuestion(questionData: Partial<Question>): Promise<ApiResponse<Question>> {
    return await apiClient.post<ApiResponse<Question>>('/questions', questionData)
  },

  async updateQuestion(questionId: string, questionData: Partial<Question>): Promise<ApiResponse<Question>> {
    return await apiClient.put<ApiResponse<Question>>(`/questions/${questionId}`, questionData)
  },

  async deleteQuestion(questionId: string): Promise<ApiResponse<void>> {
    return await apiClient.delete<ApiResponse<void>>(`/questions/${questionId}`)
  },

  async getQuestionsByCourse(courseId: string, page = 1, limit = 10): Promise<PaginatedResponse<Question>> {
    return await apiClient.get<PaginatedResponse<Question>>(`/questions/course/${courseId}?page=${page}&limit=${limit}`)
  },

  async validateQuestion(questionId: string): Promise<ApiResponse<{ isValid: boolean; feedback: string }>> {
    return await apiClient.post<ApiResponse<{ isValid: boolean; feedback: string }>>(`/questions/${questionId}/validate`)
  }
}
