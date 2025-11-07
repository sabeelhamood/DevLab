/* eslint-disable max-lines-per-function */
const createTrainerService = ({ repository, geminiClient, logger }) => {
  const validateQuestion = async ({
    question,
    topicId,
    topicName,
    skills,
    questionType,
    programmingLanguage,
    humanLanguage,
  }) => {
    const response = await geminiClient.validateQuestion({
      question,
      topicName,
      skills,
      questionType,
      programmingLanguage,
      humanLanguage,
    });

    if (response.valid && questionType === 'code') {
      await repository.stageQuestion({
        topicId,
        topicName,
        questionType,
        programmingLanguage,
        question,
        metadata: { skills },
      });
    }

    logger.info?.('trainerService.validateQuestion', {
      topicId,
      questionType,
      valid: response.valid,
    });

    return response;
  };

  const generateQuestion = async ({
    topicId,
    topicName,
    skills,
    questionType,
    programmingLanguage,
    humanLanguage,
  }) => {
    const generated = await geminiClient.generateQuestion({
      topicName,
      skills,
      questionType,
      programmingLanguage,
      humanLanguage,
    });

    const staged = await repository.stageQuestion({
      topicId,
      topicName,
      questionType,
      programmingLanguage: generated.language || programmingLanguage,
      question: generated,
      generated: true,
      metadata: { skills },
    });

    logger.info?.('trainerService.generateQuestion', {
      topicId,
      questionType,
      stagedId: staged.id,
    });

    return { stagedId: staged.id, question: generated };
  };

  const acknowledgeQuestion = async id => {
    await repository.deleteQuestion(id);
    logger.info?.('trainerService.acknowledgeQuestion', { id });
    return { success: true };
  };

  return {
    validateQuestion,
    generateQuestion,
    acknowledgeQuestion,
  };
};

export default createTrainerService;
