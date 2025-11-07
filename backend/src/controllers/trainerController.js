const createTrainerController = trainerService => ({
  validateQuestion: async (req, res, next) => {
    try {
      const result = await trainerService.validateQuestion({
        question: req.body.question,
        topicId: req.body.topicId,
        topicName: req.body.topicName,
        skills: req.body.skills,
        questionType: req.body.questionType,
        programmingLanguage: req.body.programmingLanguage,
        humanLanguage: req.body.humanLanguage,
      });

      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  generateQuestion: async (req, res, next) => {
    try {
      const result = await trainerService.generateQuestion({
        topicId: req.body.topicId,
        topicName: req.body.topicName,
        skills: req.body.skills,
        questionType: req.body.questionType,
        programmingLanguage: req.body.programmingLanguage,
        humanLanguage: req.body.humanLanguage,
      });

      res.status(201).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  acknowledgeQuestion: async (req, res, next) => {
    try {
      const result = await trainerService.acknowledgeQuestion(req.params.id);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },
});

export default createTrainerController;
