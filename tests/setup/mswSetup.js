/**
 * MSW (Mock Service Worker) Setup
 * For frontend API mocking
 */

import { setupServer } from 'msw/node';
import { rest } from 'msw';

// Mock API handlers
const handlers = [
  // Question generation
  rest.post('http://localhost:3001/api/questions/generate', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        success: true,
        questions: [
          {
            question_id: 'q_test_001',
            question_text: 'Test question',
            programming_language: 'Python'
          }
        ]
      })
    );
  }),

  // Code execution
  rest.post('http://localhost:3001/api/code/execute', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        status: 'Accepted',
        stdout: 'Hello World',
        is_correct: true
      })
    );
  }),

  // Feedback generation
  rest.post('http://localhost:3001/api/feedback/generate', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        feedback: 'Good solution!',
        suggestions: [],
        improvements: []
      })
    );
  })
];

export const server = setupServer(...handlers);



