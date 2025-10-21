import { create } from 'zustand';
import { questionApi } from '@/services/api/questionApi';
import { Question, LearningSession, QuestionSubmission } from '@/types/question';

interface QuestionState {
  questions: Question[];
  currentQuestion: Question | null;
  currentSession: LearningSession | null;
  sessions: LearningSession[];
  isLoading: boolean;
  error: string | null;
  filters: {
    topic?: string;
    language?: string;
    difficulty?: number;
  };
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}

interface QuestionActions {
  // Question Management
  loadPersonalizedQuestions: (filters?: any) => Promise<void>;
  setCurrentQuestion: (question: Question | null) => void;
  clearQuestions: () => void;
  
  // Session Management
  startLearningSession: (questionId: string) => Promise<void>;
  submitCodeSolution: (submission: QuestionSubmission) => Promise<any>;
  completeSession: (sessionId: string) => Promise<void>;
  loadRecentSessions: () => Promise<void>;
  loadSession: (sessionId: string) => Promise<void>;
  
  // Progress Tracking
  loadProgressData: () => Promise<void>;
  updateProgress: (sessionId: string, progress: any) => void;
  
  // Filters and Pagination
  setFilters: (filters: Partial<QuestionState['filters']>) => void;
  setPagination: (pagination: Partial<QuestionState['pagination']>) => void;
  loadMoreQuestions: () => Promise<void>;
  
  // Error Handling
  setError: (error: string | null) => void;
  clearError: () => void;
  setLoading: (loading: boolean) => void;
}

export const useQuestionStore = create<QuestionState & QuestionActions>((set, get) => ({
  // State
  questions: [],
  currentQuestion: null,
  currentSession: null,
  sessions: [],
  isLoading: false,
  error: null,
  filters: {},
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    hasMore: false,
  },

  // Actions
  loadPersonalizedQuestions: async (filters = {}) => {
    set({ isLoading: true, error: null });
    
    try {
      const { filters: currentFilters, pagination } = get();
      const mergedFilters = { ...currentFilters, ...filters };
      
      const response = await questionApi.getPersonalizedQuestions({
        ...mergedFilters,
        limit: pagination.limit,
      });
      
      set({
        questions: response.questions,
        pagination: {
          ...pagination,
          total: response.total_count,
          hasMore: response.has_more,
        },
        isLoading: false,
        error: null,
      });
    } catch (error: any) {
      set({
        error: error.message || 'Failed to load questions',
        isLoading: false,
      });
      throw error;
    }
  },

  setCurrentQuestion: (question: Question | null) => {
    set({ currentQuestion: question });
  },

  clearQuestions: () => {
    set({ questions: [], currentQuestion: null });
  },

  startLearningSession: async (questionId: string) => {
    set({ isLoading: true, error: null });
    
    try {
      const session = await questionApi.startLearningSession(questionId);
      
      set({
        currentSession: session,
        isLoading: false,
        error: null,
      });
    } catch (error: any) {
      set({
        error: error.message || 'Failed to start learning session',
        isLoading: false,
      });
      throw error;
    }
  },

  submitCodeSolution: async (submission: QuestionSubmission) => {
    set({ isLoading: true, error: null });
    
    try {
      const { currentSession } = get();
      
      if (!currentSession) {
        throw new Error('No active learning session');
      }
      
      const result = await questionApi.submitCodeSolution(currentSession.question_id, submission);
      
      // Update current session with results
      const updatedSession = {
        ...currentSession,
        attempts: currentSession.attempts + 1,
        score: result.score,
        status: result.session_status,
        ai_feedback: result.feedback.ai_feedback,
        code_submissions: [
          ...(currentSession.code_submissions || []),
          {
            code: submission.code,
            timestamp: new Date(),
            execution_result: result.execution_result,
          },
        ],
        execution_results: result.execution_result,
      };
      
      set({
        currentSession: updatedSession,
        isLoading: false,
        error: null,
      });
      
      return result;
    } catch (error: any) {
      set({
        error: error.message || 'Failed to submit code solution',
        isLoading: false,
      });
      throw error;
    }
  },

  completeSession: async (sessionId: string) => {
    set({ isLoading: true, error: null });
    
    try {
      await questionApi.completeLearningSession(sessionId);
      
      set({
        currentSession: null,
        isLoading: false,
        error: null,
      });
    } catch (error: any) {
      set({
        error: error.message || 'Failed to complete session',
        isLoading: false,
      });
      throw error;
    }
  },

  loadRecentSessions: async () => {
    set({ isLoading: true, error: null });
    
    try {
      const sessions = await questionApi.getLearningSessions();
      
      set({
        sessions,
        isLoading: false,
        error: null,
      });
    } catch (error: any) {
      set({
        error: error.message || 'Failed to load recent sessions',
        isLoading: false,
      });
    }
  },

  loadSession: async (sessionId: string) => {
    set({ isLoading: true, error: null });
    
    try {
      const session = await questionApi.getLearningSession(sessionId);
      
      set({
        currentSession: session,
        isLoading: false,
        error: null,
      });
    } catch (error: any) {
      set({
        error: error.message || 'Failed to load session',
        isLoading: false,
      });
      throw error;
    }
  },

  loadProgressData: async () => {
    set({ isLoading: true, error: null });
    
    try {
      // This would typically load progress data from analytics API
      // For now, we'll use the sessions data
      const sessions = await questionApi.getLearningSessions();
      
      set({
        sessions,
        isLoading: false,
        error: null,
      });
    } catch (error: any) {
      set({
        error: error.message || 'Failed to load progress data',
        isLoading: false,
      });
    }
  },

  updateProgress: (sessionId: string, progress: any) => {
    const { sessions } = get();
    const updatedSessions = sessions.map(session =>
      session.id === sessionId ? { ...session, ...progress } : session
    );
    
    set({ sessions: updatedSessions });
  },

  setFilters: (filters) => {
    set({ filters: { ...get().filters, ...filters } });
  },

  setPagination: (pagination) => {
    set({ pagination: { ...get().pagination, ...pagination } });
  },

  loadMoreQuestions: async () => {
    const { pagination, filters } = get();
    
    if (!pagination.hasMore) return;
    
    set({ isLoading: true, error: null });
    
    try {
      const response = await questionApi.getPersonalizedQuestions({
        ...filters,
        limit: pagination.limit,
        offset: pagination.page * pagination.limit,
      });
      
      set({
        questions: [...get().questions, ...response.questions],
        pagination: {
          ...pagination,
          page: pagination.page + 1,
          hasMore: response.has_more,
        },
        isLoading: false,
        error: null,
      });
    } catch (error: any) {
      set({
        error: error.message || 'Failed to load more questions',
        isLoading: false,
      });
    }
  },

  setError: (error: string | null) => {
    set({ error });
  },

  clearError: () => {
    set({ error: null });
  },

  setLoading: (loading: boolean) => {
    set({ isLoading: loading });
  },
}));
