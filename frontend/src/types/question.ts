export interface Question {
  id: string;
  title: string;
  description: string;
  difficulty_level: number;
  programming_language: string;
  question_type: string;
  topic: string;
  micro_skills: string[];
  nano_skills: string[];
  test_cases: TestCase[];
  hints: string[];
  created_at: string;
  updated_at: string;
}

export interface TestCase {
  input: string;
  expected_output: string;
  is_hidden: boolean;
}

export interface QuestionSubmission {
  learnerId: string;
  code: string;
  language: string;
}

export interface QuestionSubmissionResponse {
  execution_result: ExecutionResult;
  feedback: {
    ai_feedback: string;
    suggestions: string[];
    score: number;
  };
  score: number;
  session_status: string;
  attempts_remaining: number;
}

export interface ExecutionResult {
  success: boolean;
  output: string;
  error_message?: string;
  execution_time: number;
  memory_usage: number;
  test_results: TestResult[];
}

export interface TestResult {
  test_case: TestCase;
  passed: boolean;
  actual_output: string;
  execution_time: number;
}

export interface LearningSession {
  id: string;
  learner_id: string;
  question_id: string;
  session_start: string;
  session_end?: string;
  status: 'active' | 'completed' | 'abandoned';
  attempts: number;
  max_attempts: number;
  score?: number;
  ai_feedback?: string;
  code_submissions?: CodeSubmission[];
  execution_results?: ExecutionResult;
  question?: Question;
}

export interface CodeSubmission {
  code: string;
  timestamp: string;
  execution_result: ExecutionResult;
}

export interface PersonalizedQuestionsResponse {
  questions: Question[];
  total_count: number;
  has_more: boolean;
  learner_profile: {
    skill_level: number;
    daily_quota_used: number;
    daily_quota_remaining: number;
  };
}

export interface PersonalizedQuestionsFilters {
  topic?: string;
  language?: string;
  difficulty?: number;
  limit?: number;
}

export interface LearningSessionsResponse {
  sessions: LearningSession[];
  total_count: number;
}

export interface ProgressData {
  total_sessions: number;
  completed_sessions: number;
  completion_rate: number;
  average_score: number;
  unique_questions: number;
  average_execution_time: number;
}

export interface QuestionStats {
  total_attempts: number;
  average_score: number;
  success_rate: number;
  average_execution_time: number;
}
