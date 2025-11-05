/**
 * Competition Routes
 * Routes for competition system
 */

import express from 'express';
import competitionController from '../controllers/competitionController.js';

const router = express.Router();

/**
 * POST /api/competitions/invite
 * Create competition invitation (from Course Builder)
 */
router.post('/invite', competitionController.createInvitation);

/**
 * GET /api/competitions/invitations/:learnerId
 * Get pending invitations for learner
 */
router.get('/invitations/:learnerId', competitionController.getInvitations);

/**
 * POST /api/competitions/select-competitor
 * Learner selects competitor from list
 */
router.post('/select-competitor', competitionController.selectCompetitor);

/**
 * POST /api/competitions/:competitionId/submit
 * Submit solution in competition
 */
router.post('/:competitionId/submit', competitionController.submitSolution);

/**
 * GET /api/competitions/:competitionId/status
 * Get competition status
 */
router.get('/:competitionId/status', competitionController.getCompetitionStatus);

export default router;




