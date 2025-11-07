/* eslint-disable max-lines-per-function */
const errorStatusMap = {
  SESSION_NOT_FOUND: 404,
  SESSION_FORBIDDEN: 403,
  QUESTION_NOT_FOUND: 404,
  HINT_LIMIT_REACHED: 429,
};

const mapErrorToStatus = error => {
  if (!error) return 500;
  const code = error.code || error.message;
  return errorStatusMap[code] || 500;
};

export const createPracticeController = practiceService => ({
  initializeSession: async (req, res, next) => {
    try {
      const session = await practiceService.initializeSession(req.body);
      res.status(201).json({ success: true, data: session });
    } catch (error) {
      next(error);
    }
  },

  getSession: async (req, res) => {
    try {
      const session = await practiceService.getSession({
        sessionId: req.params.sessionId,
        learnerId: req.user?.sub || req.user?.id,
      });

      res.status(200).json({ success: true, data: session });
    } catch (error) {
      const status = mapErrorToStatus(error);
      res.status(status).json({ success: false, error: error.message });
    }
  },

  requestHint: async (req, res) => {
    try {
      const hint = await practiceService.requestHint({
        sessionId: req.params.sessionId,
        questionId: req.body.questionId,
        learnerId: req.user?.sub || req.user?.id,
        context: req.body.context || {},
      });

      res.status(200).json({ success: true, data: hint });
    } catch (error) {
      const status = mapErrorToStatus(error);
      res.status(status).json({ success: false, error: error.message });
    }
  },

  runCode: async (req, res, next) => {
    try {
      const result = await practiceService.runCode({
        sessionId: req.params.sessionId,
        questionId: req.body.questionId,
        learnerId: req.user?.sub || req.user?.id,
        submission: req.body.submission,
      });

      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  submitSolution: async (req, res, next) => {
    try {
      const result = await practiceService.submitSolution({
        sessionId: req.params.sessionId,
        questionId: req.body.questionId,
        learnerId: req.user?.sub || req.user?.id,
        language: req.body.language,
        code: req.body.code,
      });

      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },
});

export default createPracticeController;
