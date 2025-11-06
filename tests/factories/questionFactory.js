/**
 * Question Factory
 * Generates test question data
 */

export const createQuestion = (overrides = {}) => ({
  question_id: `q_test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  question_text: 'Write a function that returns the sum of two numbers',
  programming_language: 'Python',
  course_name: 'Python Fundamentals',
  lesson_name: 'Functions',
  nano_skills: ['function_definition', 'return_statement'],
  micro_skills: ['python_basics'],
  question_type: 'code',
  test_cases: [
    {
      input: '2, 3',
      expected_output: '5',
      is_hidden: false
    }
  ],
  hints: [],
  ...overrides
});

export const createCodingQuestion = (overrides = {}) => 
  createQuestion({
    question_type: 'code',
    programming_language: 'Python',
    ...overrides
  });

export const createTheoreticalQuestion = (overrides = {}) => ({
  question_id: `q_test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  question_text: 'What is the difference between a list and a tuple?',
  question_type: 'theoretical',
  course_name: 'Python Fundamentals',
  lesson_name: 'Data Structures',
  ...overrides
});





