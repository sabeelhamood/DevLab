import express from 'express';
import {
  authenticateToken,
  authenticateService,
  requireRole,
} from '../../middleware/auth.js';
import createCompetitionController from '../../controllers/competitionController.js';
import createCompetitionRepository from '../../repositories/competitionRepository.js';
import createQueueManager from '../../services/competitionQueue.js';
import createCompetitionService from '../../services/competitionService.js';
import { createGeminiClient } from '../../integrations/geminiClient.js';
import { config } from '../../config/environment.js';
import createLearningAnalyticsExporter from '../../services/learningAnalyticsExporter.js';

const router = express.Router();

const repository = createCompetitionRepository();
const queueManager = createQueueManager({ repository, logger: console });
const competitionService = createCompetitionService({
  queueManager,
  geminiClient: createGeminiClient({
    apiKey: config.ai.gemini.apiKey,
    model: config.ai.gemini.model,
    logger: console,
  }),
  analyticsExporter: createLearningAnalyticsExporter({
    logger: console,
    config: config.externalServices.learningAnalytics,
  }),
});

const controller = createCompetitionController(competitionService);

router.post('/invitations', authenticateService, controller.queueInvitation);
router.get(
  '/invitations',
  authenticateToken,
  requireRole(['learner']),
  controller.listInvitations
);
router.post(
  '/invitations/:invitationId/accept',
  authenticateToken,
  requireRole(['learner']),
  controller.acceptInvitation
);
router.post(
  '/invitations/:invitationId/decline',
  authenticateToken,
  requireRole(['learner']),
  controller.declineInvitation
);

router.post('/', authenticateService, controller.startMatch);
router.get(
  '/:matchId',
  authenticateToken,
  requireRole(['learner']),
  controller.getMatch
);
router.post(
  '/:matchId/submit',
  authenticateToken,
  requireRole(['learner']),
  controller.submitRound
);
router.post(
  '/:matchId/complete',
  authenticateService,
  controller.completeMatch
);

export default router;
