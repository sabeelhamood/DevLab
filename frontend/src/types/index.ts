// User and Authentication Types
export interface User {
  id: string
  email: string
  name: string
  role: 'learner' | 'trainer' | 'admin'
  organizationId: string
  profile?: UserProfile
  createdAt: string
  updatedAt: string
}

export interface UserProfile {
  skillLevel: 'beginner' | 'intermediate' | 'advanced'
  preferences: {
    language: string
    difficulty: string
    notifications: boolean
  }
  statistics: {
    totalQuestions: number
    correctAnswers: number
    averageScore: number
    timeSpent: number
  }
}

// Question Types
export interface Question {
  id: string
  title: string
  description: string
  type: 'code' | 'theoretical'
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  language?: string
  testCases?: TestCase[]
  hints: string[]
  solution?: string
  explanation?: string
  macroSkills: string[]
  microSkills: string[]
  nanoSkills: string[]
  courseId: string
  topicId: string
  createdBy: string
  isAIGenerated: boolean
  validationStatus: 'pending' | 'approved' | 'rejected'
  createdAt: string
  updatedAt: string
}

export interface TestCase {
  input: string
  expectedOutput: string
  description?: string
}

export interface QuestionSubmission {
  questionId: string
  solution: string
  language?: string
  timeSpent: number
  hintsUsed: number
}

// Session Types
export interface PracticeSession {
  id: string
  learnerId: string
  courseId: string
  sessionType: 'practice' | 'competition'
  status: 'active' | 'completed' | 'paused'
  startedAt: string
  completedAt?: string
  totalQuestions: number
  correctAnswers: number
  score: number
  questions: SessionQuestion[]
}

export interface SessionQuestion {
  id: string
  sessionId: string
  questionId: string
  questionOrder: number
  learnerAnswer?: string
  isCorrect?: boolean
  hintsUsed: number
  timeSpent: number
  aiFeedback?: string
  submittedAt?: string
  createdAt: string
}

// Competition Types
export interface Competition {
  id: string
  courseId: string
  name: string
  description: string
  maxParticipants: number
  questionCount: number
  timeLimit: number
  status: 'waiting' | 'active' | 'completed'
  startedAt?: string
  endedAt?: string
  participants: CompetitionParticipant[]
  questions: Question[]
  leaderboard: LeaderboardEntry[]
  createdAt: string
}

export interface CompetitionParticipant {
  id: string
  competitionId: string
  learnerId: string
  score: number
  rank?: number
  joinedAt: string
}

export interface LeaderboardEntry {
  rank: number
  learnerId: string
  score: number
  timeSpent: number
  isAnonymous: boolean
}

// Course and Topic Types
export interface Course {
  id: string
  name: string
  description: string
  organizationId: string
  difficultyLevel: string
  macroSkills: string[]
  microSkills: string[]
  nanoSkills: string[]
  topics: Topic[]
  createdAt: string
  updatedAt: string
}

export interface Topic {
  id: string
  courseId: string
  name: string
  description: string
  orderIndex: number
  createdAt: string
}

// Gamification Types
export interface Achievement {
  id: string
  learnerId: string
  achievementType: string
  achievementName: string
  description: string
  points: number
  earnedAt: string
}

export interface Badge {
  id: string
  learnerId: string
  badgeType: string
  badgeName: string
  description: string
  earnedAt: string
}

export interface ProgressData {
  courseId: string
  topicId: string
  completionPercentage: number
  lastActivity: string
  totalQuestions: number
  correctAnswers: number
  averageScore: number
  timeSpent: number
}

// Analytics Types
export interface LearningAnalytics {
  learnerId: string
  courseId: string
  sessionId: string
  metricType: string
  metricValue: number
  recordedAt: string
}

export interface PerformanceMetrics {
  learnerId: string
  courseId: string
  date: string
  totalQuestions: number
  correctAnswers: number
  averageTimePerQuestion: number
  hintsUsed: number
  competitionsParticipated: number
  achievementsEarned: number
  skillProgression: Record<string, number>
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// AI Integration Types
export interface AIFeedback {
  isCorrect: boolean
  score: number
  feedback: string
  suggestions: string[]
  testResults: TestResult[]
}

export interface TestResult {
  testCase: TestCase
  passed: boolean
  actualOutput?: string
  error?: string
}

export interface AIQuestionGeneration {
  courseId: string
  topicId: string
  difficulty: string
  questionType: 'code' | 'theoretical'
  skills: string[]
  count: number
}

// External Service Integration Types
export interface DirectoryServiceData {
  learnerId: string
  profile: UserProfile
  quota: number
  organizationMapping: Record<string, string>
}

export interface AssessmentServiceData {
  theoreticalQuestions: Question[]
  codeQuestions: Question[]
}

export interface ContentStudioData {
  questionType: 'code' | 'theoretical'
  contextualContent: string
  topic: string
  microSkills: string[]
  nanoSkills: string[]
  exerciseType: string
}

export interface LearningAnalyticsData {
  sessionCompletion: boolean
  performanceMetrics: PerformanceMetrics
  progressData: ProgressData
}

// Error Types
export interface ApiError {
  code: string
  message: string
  details?: Record<string, any>
}

// Form Types
export interface LoginForm {
  email: string
  password: string
}

export interface RegisterForm {
  name: string
  email: string
  password: string
  confirmPassword: string
  role: 'learner' | 'trainer'
  organizationId: string
}

export interface QuestionForm {
  title: string
  description: string
  type: 'code' | 'theoretical'
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  language?: string
  testCases?: TestCase[]
  hints: string[]
  solution?: string
  explanation?: string
  macroSkills: string[]
  microSkills: string[]
  nanoSkills: string[]
  courseId: string
  topicId: string
}

// UI State Types
export interface LoadingState {
  isLoading: boolean
  message?: string
}

export interface ErrorState {
  hasError: boolean
  message?: string
  code?: string
}

export interface NotificationState {
  type: 'success' | 'error' | 'warning' | 'info'
  message: string
  duration?: number
}

