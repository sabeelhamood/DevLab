import express from 'express';
import { authenticateService } from '../../middleware/auth.js';
import createTrainerController from '../../controllers/trainerController.js';
import createQuestionStagingRepository from '../../repositories/questionStagingRepository.js';
import createTrainerService from '../../services/trainerService.js';
import { createGeminiClient } from '../../integrations/geminiClient.js';
import { config } from '../../config/environment.js';

const router = express.Router();

const trainerService = createTrainerService({
  repository: createQuestionStagingRepository(),
  geminiClient: createGeminiClient({
    apiKey: config.ai.gemini.apiKey,
    model: config.ai.gemini.model,
    logger: console,
  }),
  logger: console,
});

const controller = createTrainerController(trainerService);

router.post(
  '/questions/validate',
  authenticateService,
  controller.validateQuestion
);
router.post(
  '/questions/generate',
  authenticateService,
  controller.generateQuestion
);
router.delete(
  '/questions/:id',
  authenticateService,
  controller.acknowledgeQuestion
);

export default router;
