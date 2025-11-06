/**
 * Question Service Unit Tests
 * TDD: RED-GREEN-REFACTOR
 */

import questionService from '../../../../backend/src/services/questionService.js';
import geminiClient from '../../../../backend/src/clients/geminiClient.js';
import supabase from '../../../../backend/src/database/supabase.js';

// Mock dependencies
jest.mock('../../../../backend/src/clients/geminiClient.js');
jest.mock('../../../../backend/src/database/supabase.js');

describe('Question Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generateCodingQuestions', () => {
    it('should generate coding questions with valid inputs', async () => {
      // RED: Test fails initially (no implementation)
      const params = {
        quantity: 4,
        lesson_id: 'lesson_123',
        course_name: 'Python Fundamentals',
        lesson_name: 'Variables',
        nano_skills: ['variable_declaration'],
        micro_skills: ['python_basics'],
        programming_language: 'Python'
      };

      const mockQuestions = [
        {
          question_text: 'Test question 1',
          difficulty: 'easy',
          test_cases: []
        }
      ];

      geminiClient.generateQuestions.mockResolvedValue(mockQuestions);
      supabase.from.mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { question_id: 'q_123', ...mockQuestions[0] },
              error: null
            })
          })
        })
      });

      const result = await questionService.generateCodingQuestions(params);

      expect(result).toBeDefined();
      expect(geminiClient.generateQuestions).toHaveBeenCalledWith(params);
    });

    it('should handle errors from Gemini API', async () => {
      geminiClient.generateQuestions.mockRejectedValue(new Error('API Error'));

      await expect(
        questionService.generateCodingQuestions({})
      ).rejects.toThrow();
    });
  });
});





