import express from 'express';
import {
  authenticateToken,
  authenticateService,
  requireRole,
} from '../../middleware/auth.js';
import { createPracticeController } from '../../controllers/practiceController.js';
import { createPracticeService } from '../../services/practiceService.js';
import { createSupabasePracticeRepository } from '../../repositories/practiceRepository.js';
import { createGeminiClient } from '../../integrations/geminiClient.js';
import { createJudge0Client } from '../../integrations/judge0Client.js';
import { config } from '../../config/environment.js';

const router = express.Router();

const practiceService = createPracticeService({
  repository: createSupabasePracticeRepository(),
  geminiClient: createGeminiClient({
    apiKey: config.ai.gemini.apiKey || process.env['GEMINI_API_KEY'],
    model: config.ai.gemini.model,
    logger: console,
  }),
  judge0Client: createJudge0Client({
    rapidApiKey: config.externalServices.judge0.rapidApiKey,
    rapidApiHost: config.externalServices.judge0.rapidApiHost,
    baseUrl: config.externalServices.judge0.baseUrl,
    logger: console,
  }),
  logger: console,
});

const controller = createPracticeController(practiceService);

router.post('/sessions', authenticateService, controller.initializeSession);
router.get(
  '/sessions/:sessionId',
  authenticateToken,
  requireRole(['learner']),
  controller.getSession
);
router.post(
  '/sessions/:sessionId/hints',
  authenticateToken,
  requireRole(['learner']),
  controller.requestHint
);
router.post(
  '/sessions/:sessionId/run',
  authenticateToken,
  requireRole(['learner']),
  controller.runCode
);
router.post(
  '/sessions/:sessionId/submit',
  authenticateToken,
  requireRole(['learner']),
  controller.submitSolution
);

export default router;
