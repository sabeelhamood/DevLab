// frontend/src/services/api/judge0.js
import { apiClient } from './client.js'

/**
 * Judge0 API service for code execution
 */
export const judge0API = {
  /**
   * Check if Judge0 service is available
   */
  async checkHealth() {
    try {
      console.log('🔍 Judge0 API: Checking health endpoint...')
      const response = await apiClient.get('/judge0/health')
      console.log('✅ Judge0 API: Health check response:', response)
      return response
    } catch (error) {
      console.error('❌ Judge0 API: Health check failed:', error)
      return { available: false, error: error.message }
    }
  },

  /**
   * Get supported programming languages
   */
  async getSupportedLanguages() {
    try {
      const response = await apiClient.get('/judge0/languages')
      return response
    } catch (error) {
      console.error('Failed to get supported languages:', error)
      throw error
    }
  },

  /**
   * Execute code with Judge0
   */
  async executeCode(sourceCode, language, input = '', expectedOutput = null) {
    try {
      const response = await apiClient.post('/judge0/execute', {
        sourceCode,
        language,
        input,
        expectedOutput
      })
      return response
    } catch (error) {
      console.error('Judge0 execution failed:', error)
      throw error
    }
  },

  /**
   * Execute test cases
   */
  async executeTestCases(sourceCode, language, testCases) {
    try {
      const response = await apiClient.post('/judge0/test-cases', {
        sourceCode,
        language,
        testCases
      })
      return response
    } catch (error) {
      console.error('Judge0 test execution failed:', error)
      // Fallback to sequential execution
      try {
        const response = await apiClient.post('/judge0/test-cases-sequential', {
          sourceCode,
          language,
          testCases
        })
        return response
      } catch (fallbackError) {
        console.error('Judge0 sequential test execution failed:', fallbackError)
        throw fallbackError
      }
    }
  },

  /**
   * Test connectivity to Judge0 service
   */
  async testConnectivity() {
    try {
      console.log('🔍 Testing Judge0 connectivity...')
      const healthResponse = await this.checkHealth()
      console.log('✅ Judge0 health check:', healthResponse)
      
      if (healthResponse.available) {
        const languagesResponse = await this.getSupportedLanguages()
        console.log('✅ Judge0 languages check:', languagesResponse)
        return { 
          connected: true, 
          available: true,
          languages: languagesResponse.languages || {},
          service: 'Judge0'
        }
      } else {
        return { 
          connected: false, 
          available: false, 
          error: healthResponse.error || 'Judge0 service unavailable',
          service: 'Judge0'
        }
      }
    } catch (error) {
      console.error('❌ Judge0 connectivity test failed:', error)
      return { 
        connected: false, 
        available: false, 
        error: error.message,
        service: 'Judge0'
      }
    }
  },

  /**
   * Execute test cases with fallback to mock
   */
  async executeTestCasesWithFallback(sourceCode, language, testCases) {
    try {
      // Try Judge0 first
      return await this.executeTestCases(sourceCode, language, testCases)
    } catch (error) {
      console.warn('Judge0 unavailable, falling back to mock execution:', error)
      
      // Fallback to mock execution
      return this.mockExecuteTestCases(sourceCode, language, testCases)
    }
  },

  /**
   * Mock test execution (fallback)
   */
  mockExecuteTestCases(sourceCode, language, testCases) {
    // Simulate test execution with random results
    const results = testCases.map((testCase, index) => {
      const passed = Math.random() > 0.3 // 70% pass rate for demo
      const mockOutput = typeof testCase.expected_output === 'object'
        ? JSON.stringify(testCase.expected_output)
        : testCase.expected_output

      return {
        testNumber: index + 1,
        input: testCase.input,
        expected: testCase.expected_output,
        result: passed ? mockOutput : 'Mock failed result',
        passed,
        status: passed ? 'Accepted' : 'Wrong Answer',
        error: !passed,
        stderr: passed ? '' : 'Mock error message',
        time: (Math.random() * 0.5 + 0.1).toFixed(3)
      }
    })

    return {
      success: true,
      results,
      totalTests: testCases.length,
      passedTests: results.filter(r => r.passed).length,
      service: 'Mock'
    }
  }
}
