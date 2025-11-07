/* eslint-disable max-lines-per-function */
const errorStatusMap = {
  INVITATION_NOT_FOUND: 404,
  INVITATION_FORBIDDEN: 403,
  MATCH_NOT_FOUND: 404,
};

const mapErrorToStatus = error => {
  if (!error) return 500;
  const code = error.code || error.message;
  return errorStatusMap[code] || 500;
};

export const createCompetitionController = competitionService => ({
  queueInvitation: async (req, res, next) => {
    try {
      const invitation = await competitionService.scheduleInvitation({
        courseId: req.body.courseId,
        courseName: req.body.courseName,
        learnerId: req.body.learnerId,
        metadata: req.body.metadata,
      });

      res.status(202).json({ success: true, data: invitation });
    } catch (error) {
      next(error);
    }
  },

  listInvitations: async (req, res, next) => {
    try {
      const invitations = await competitionService.listInvitations(
        req.user.sub
      );
      res.status(200).json({ success: true, data: invitations });
    } catch (error) {
      next(error);
    }
  },

  acceptInvitation: async (req, res) => {
    try {
      const invitation = await competitionService.acceptInvitation({
        invitationId: req.params.invitationId,
        learnerId: req.user.sub,
      });

      res.status(200).json({ success: true, data: invitation });
    } catch (error) {
      const status = mapErrorToStatus(error);
      res.status(status).json({ success: false, error: error.message });
    }
  },

  declineInvitation: async (req, res) => {
    try {
      const invitation = await competitionService.declineInvitation({
        invitationId: req.params.invitationId,
        learnerId: req.user.sub,
      });

      res.status(200).json({ success: true, data: invitation });
    } catch (error) {
      const status = mapErrorToStatus(error);
      res.status(status).json({ success: false, error: error.message });
    }
  },

  startMatch: async (req, res, next) => {
    try {
      const match = await competitionService.startMatch({
        courseId: req.body.courseId,
        courseName: req.body.courseName,
        participants: req.body.participants,
        questions: req.body.questions,
        timer: req.body.timer,
      });

      res.status(201).json({ success: true, data: match });
    } catch (error) {
      next(error);
    }
  },

  getMatch: async (req, res, next) => {
    try {
      const match = await competitionService.getMatch(req.params.matchId);
      if (!match) {
        return res
          .status(404)
          .json({ success: false, error: 'MATCH_NOT_FOUND' });
      }
      res.status(200).json({ success: true, data: match });
    } catch (error) {
      next(error);
    }
  },

  submitRound: async (req, res) => {
    try {
      const result = await competitionService.submitRound({
        matchId: req.params.matchId,
        submission: {
          participantId: req.user.sub,
          questionIndex: req.body.questionIndex,
          language: req.body.language,
          code: req.body.code,
        },
      });

      res.status(200).json({ success: true, data: result });
    } catch (error) {
      const status = mapErrorToStatus(error);
      res.status(status).json({ success: false, error: error.message });
    }
  },

  completeMatch: async (req, res) => {
    try {
      const match = await competitionService.completeMatch({
        matchId: req.params.matchId,
      });

      res.status(200).json({ success: true, data: match });
    } catch (error) {
      const status = mapErrorToStatus(error);
      res.status(status).json({ success: false, error: error.message });
    }
  },
});

export default createCompetitionController;
