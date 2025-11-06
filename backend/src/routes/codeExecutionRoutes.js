/**
 * Code Execution Routes
 * Routes for code execution via Judge0
 */

import express from 'express';
import codeExecutionController from '../controllers/codeExecutionController.js';

const router = express.Router();

/**
 * POST /api/code/execute
 * Execute code in Judge0 sandbox
 */
router.post('/execute', codeExecutionController.executeCode);

export default router;





