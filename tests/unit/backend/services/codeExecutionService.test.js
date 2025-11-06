/**
 * Code Execution Service Unit Tests
 * TDD: RED-GREEN-REFACTOR
 */

import codeExecutionService from '../../../../backend/src/services/codeExecutionService.js';
import judge0Client from '../../../../backend/src/clients/judge0Client.js';

jest.mock('../../../../backend/src/clients/judge0Client.js');

describe('Code Execution Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('executeCode', () => {
    it('should execute code successfully', async () => {
      const params = {
        code: 'print("Hello")',
        programming_language: 'Python',
        test_cases: [{ input: '', expected_output: 'Hello' }],
        question_id: 'q_123'
      };

      const mockResults = {
        status: 'Accepted',
        stdout: 'Hello',
        is_correct: true
      };

      judge0Client.executeCode.mockResolvedValue(mockResults);

      const result = await codeExecutionService.executeCode(params);

      expect(result).toEqual(mockResults);
      expect(judge0Client.executeCode).toHaveBeenCalledWith(params);
    });

    it('should reject code exceeding size limit', async () => {
      const largeCode = 'x'.repeat(1000001); // 1MB + 1 byte

      await expect(
        codeExecutionService.executeCode({
          code: largeCode,
          programming_language: 'Python',
          test_cases: [],
          question_id: 'q_123'
        })
      ).rejects.toThrow('Code size exceeds maximum limit');
    });
  });
});





