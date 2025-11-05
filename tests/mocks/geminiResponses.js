/**
 * Gemini API Mock Responses
 * Mock responses for Gemini API calls
 */

export const mockGeminiQuestionResponse = {
  questions: [
    {
      question_text: 'Write a function that returns the sum of two numbers',
      difficulty: 'medium',
      test_cases: [
        {
          input: '2, 3',
          expected_output: '5',
          is_hidden: false
        },
        {
          input: '-5, 10',
          expected_output: '5',
          is_hidden: true
        }
      ],
      hints: [
        'Think about function parameters',
        'Consider how to add numbers',
        'Remember to return the result'
      ]
    }
  ]
};

export const mockGeminiFeedbackResponse = {
  feedback: 'Good solution! Your code correctly implements the sum function.',
  suggestions: [
    'Consider adding error handling for invalid inputs',
    'You could add type hints for better code clarity'
  ],
  improvements: [
    'Add input validation',
    'Add docstring documentation'
  ],
  is_correct: true
};

export const mockGeminiIncorrectFeedbackResponse = {
  feedback: 'Your solution has some issues. The function is not returning the correct result.',
  suggestions: [
    'Check your return statement',
    'Verify that you are adding the numbers correctly'
  ],
  is_correct: false
};

export const mockGeminiHintsResponse = {
  hints: [
    'Think about what a function needs: parameters and a return statement',
    'Consider how you can add two numbers together',
    'Remember to return the result'
  ]
};

export const mockGeminiFraudDetectionResponse = {
  fraud_score: 0.85,
  fraud_level: 'high',
  detection_details: {
    ai_likelihood: 0.85,
    patterns_detected: ['excessive_comments', 'perfect_formatting']
  },
  message: 'This code appears to be AI-generated. Please ensure you write code yourself.'
};

export const mockGeminiSolutionResponse = {
  solution_code: 'def sum_numbers(a, b):\n    return a + b',
  explanation: 'This function takes two parameters and returns their sum.',
  time_complexity: 'O(1)',
  space_complexity: 'O(1)'
};




