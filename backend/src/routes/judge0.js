// backend/src/routes/judge0.js
import express from 'express';
import { judge0Service } from '../services/judge0Service.js';

const router = express.Router();

/**
 * Check Judge0 availability
 */
router.get('/health', async (req, res) => {
  try {
    const isAvailable = await judge0Service.checkAvailability();
    res.json({
      available: isAvailable,
      service: 'Judge0',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      available: false,
      error: error.message,
      service: 'Judge0',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Get supported languages
 */
router.get('/languages', (req, res) => {
  try {
    const languages = judge0Service.getSupportedLanguages();
    res.json({
      languages,
      count: Object.keys(languages).length,
      service: 'Judge0'
    });
  } catch (error) {
    res.status(500).json({
      error: error.message,
      service: 'Judge0'
    });
  }
});

/**
 * Execute single code submission
 */
router.post('/execute', async (req, res) => {
  try {
    const { sourceCode, language, input, expectedOutput } = req.body;

    if (!sourceCode || !language) {
      return res.status(400).json({
        error: 'sourceCode and language are required'
      });
    }

    const result = await judge0Service.executeCode(
      sourceCode, 
      language, 
      input || '', 
      expectedOutput || null
    );

    res.json({
      success: true,
      result,
      service: 'Judge0'
    });
  } catch (error) {
    console.error('Judge0 execution error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      service: 'Judge0'
    });
  }
});

/**
 * Execute test cases
 */
router.post('/test-cases', async (req, res) => {
  try {
    const { sourceCode, language, testCases } = req.body;

    if (!sourceCode || !language || !testCases || !Array.isArray(testCases)) {
      return res.status(400).json({
        error: 'sourceCode, language, and testCases array are required'
      });
    }

    // Use batch execution for better performance
    const results = await judge0Service.batchExecute(sourceCode, language, testCases);

    res.json({
      success: true,
      results,
      totalTests: testCases.length,
      passedTests: results.filter(r => r.passed).length,
      service: 'Judge0'
    });
  } catch (error) {
    console.error('Judge0 test execution error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      service: 'Judge0'
    });
  }
});

/**
 * Execute test cases (sequential fallback)
 */
router.post('/test-cases-sequential', async (req, res) => {
  try {
    const { sourceCode, language, testCases } = req.body;

    if (!sourceCode || !language || !testCases || !Array.isArray(testCases)) {
      return res.status(400).json({
        error: 'sourceCode, language, and testCases array are required'
      });
    }

    // Use sequential execution as fallback
    const results = await judge0Service.executeTestCases(sourceCode, language, testCases);

    res.json({
      success: true,
      results,
      totalTests: testCases.length,
      passedTests: results.filter(r => r.passed).length,
      service: 'Judge0'
    });
  } catch (error) {
    console.error('Judge0 sequential test execution error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      service: 'Judge0'
    });
  }
});

export default router;



