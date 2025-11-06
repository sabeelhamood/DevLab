/**
 * Content Studio Mock Data
 * Mock requests that simulate what Content Studio will send to DEVLAB
 * Used for testing and development when Content Studio is not yet available
 */

/**
 * Mock Content Studio request for coding questions
 * This simulates a real request from Content Studio
 */
export const mockContentStudioCodingRequest = {
  lesson_id: 'lesson_001',
  course_name: 'Python Fundamentals',
  lesson_name: 'Introduction to Functions',
  nano_skills: ['functions', 'parameters', 'return', 'scope'],
  micro_skills: ['function_definitions', 'code_organization', 'modular_programming'],
  question_type: 'code',
  programming_language: 'python',
  quantity: 4,
  language: 'english', // Hebrew, English, Arabic, Russian, etc.
  difficulty: 'medium', // Optional
  category: 'functions' // Optional
};

/**
 * Mock Content Studio request for Hebrew coding questions
 */
export const mockContentStudioHebrewRequest = {
  lesson_id: 'lesson_002',
  course_name: 'יסודות Python',
  lesson_name: 'מבוא לפונקציות',
  nano_skills: ['פונקציות', 'פרמטרים', 'החזרת ערכים'],
  micro_skills: ['הגדרת פונקציות', 'ארגון קוד'],
  question_type: 'code',
  programming_language: 'python',
  quantity: 4,
  language: 'hebrew', // Hebrew language
  difficulty: 'medium',
  category: 'functions'
};

/**
 * Mock Content Studio request for Arabic coding questions
 */
export const mockContentStudioArabicRequest = {
  lesson_id: 'lesson_003',
  course_name: 'أساسيات Python',
  lesson_name: 'مقدمة للدوال',
  nano_skills: ['الدوال', 'المعاملات', 'إرجاع القيم'],
  micro_skills: ['تعريف الدوال', 'تنظيم الكود'],
  question_type: 'code',
  programming_language: 'python',
  quantity: 4,
  language: 'arabic', // Arabic language
  difficulty: 'medium',
  category: 'functions'
};

/**
 * Mock Content Studio request for Russian coding questions
 */
export const mockContentStudioRussianRequest = {
  lesson_id: 'lesson_004',
  course_name: 'Основы Python',
  lesson_name: 'Введение в функции',
  nano_skills: ['функции', 'параметры', 'возврат значений'],
  micro_skills: ['определение функций', 'организация кода'],
  question_type: 'code',
  programming_language: 'python',
  quantity: 4,
  language: 'russian', // Russian language
  difficulty: 'medium',
  category: 'functions'
};

/**
 * Mock Content Studio request for theoretical questions
 */
export const mockContentStudioTheoreticalRequest = {
  lesson_id: 'lesson_005',
  course_name: 'Data Structures',
  lesson_name: 'Introduction to Arrays',
  nano_skills: ['arrays', 'indexing', 'iteration'],
  micro_skills: ['data_structures', 'algorithms'],
  question_type: 'theoretical',
  quantity: 5,
  language: 'english',
  difficulty: 'easy',
  category: 'data_structures',
  answer_options: [
    { id: 'a', text: 'Option A' },
    { id: 'b', text: 'Option B' },
    { id: 'c', text: 'Option C' },
    { id: 'd', text: 'Option D' }
  ]
};

/**
 * Generate a mock Content Studio request with custom parameters
 */
export const generateMockContentStudioRequest = (overrides = {}) => {
  const defaultRequest = {
    lesson_id: `lesson_${Date.now()}`,
    course_name: 'Test Course',
    lesson_name: 'Test Lesson',
    nano_skills: ['skill1', 'skill2'],
    micro_skills: ['micro_skill1'],
    question_type: 'code',
    programming_language: 'python',
    quantity: 4,
    language: 'english',
    ...overrides
  };

  return defaultRequest;
};

/**
 * Batch of mock Content Studio requests
 */
export const mockContentStudioBatchRequest = [
  mockContentStudioCodingRequest,
  mockContentStudioHebrewRequest,
  mockContentStudioArabicRequest,
  mockContentStudioRussianRequest
];

