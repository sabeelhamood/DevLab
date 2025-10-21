import { apiClient } from './apiClient';
import { 
  Question, 
  LearningSession, 
  QuestionSubmission, 
  PersonalizedQuestionsResponse,
  QuestionSubmissionResponse 
} from '@/types/question';

export const questionApi = {
  /**
   * Get personalized questions
   */
  async getPersonalizedQuestions(filters: {
    topic?: string;
    language?: string;
    difficulty?: number;
    limit?: number;
  } = {}): Promise<PersonalizedQuestionsResponse> {
    const response = await apiClient.get('/questions/personalized', { params: filters });
    return response.data;
  },

  /**
   * Submit code solution
   */
  async submitCodeSolution(
    questionId: string, 
    submission: QuestionSubmission
  ): Promise<QuestionSubmissionResponse> {
    const response = await apiClient.post(`/questions/${questionId}/submit`, submission);
    return response.data;
  },

  /**
   * Get learning sessions
   */
  async getLearningSessions(filters: {
    status?: string;
    limit?: number;
  } = {}): Promise<{ sessions: LearningSession[]; total_count: number }> {
    const response = await apiClient.get('/questions/sessions', { params: filters });
    return response.data;
  },

  /**
   * Get learning session details
   */
  async getLearningSession(sessionId: string): Promise<LearningSession> {
    const response = await apiClient.get(`/questions/sessions/${sessionId}`);
    return response.data;
  },

  /**
   * Start learning session
   */
  async startLearningSession(questionId: string): Promise<LearningSession> {
    const response = await apiClient.post(`/questions/${questionId}/start-session`);
    return response.data;
  },

  /**
   * Complete learning session
   */
  async completeLearningSession(sessionId: string): Promise<{ success: boolean }> {
    const response = await apiClient.post(`/questions/sessions/${sessionId}/complete`);
    return response.data;
  },

  /**
   * Get question details
   */
  async getQuestion(questionId: string): Promise<Question> {
    const response = await apiClient.get(`/questions/${questionId}`);
    return response.data;
  },

  /**
   * Get question feedback
   */
  async getQuestionFeedback(questionId: string, sessionId: string): Promise<{
    feedback: string;
    suggestions: string[];
    score: number;
  }> {
    const response = await apiClient.get(`/questions/${questionId}/feedback`, {
      params: { session_id: sessionId }
    });
    return response.data;
  },
};
