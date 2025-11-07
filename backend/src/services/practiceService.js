/* eslint-disable max-lines-per-function */
const HINT_LIMIT = 3;

const sanitizeSession = session => {
  const clone = JSON.parse(JSON.stringify(session));
  clone.questions = clone.questions.map(question => ({
    ...question,
    hints: question.hints || [],
    hintsUsed: question.hintsUsed || 0,
    submissions: question.submissions || [],
  }));
  return clone;
};

const ensureDependencies = deps => {
  const missing = Object.entries(deps)
    .filter(([, value]) => !value)
    .map(([key]) => key);

  if (missing.length > 0) {
    throw new Error(
      `Missing practiceService dependencies: ${missing.join(', ')}`
    );
  }
};

export function createPracticeService({
  repository,
  geminiClient,
  judge0Client,
  logger,
}) {
  ensureDependencies({ repository, geminiClient, judge0Client, logger });

  const now = () => new Date().toISOString();

  const assertOwnership = async ({ sessionId, learnerId }) => {
    const session = await repository.getSession(sessionId);

    if (!session) {
      const error = new Error('SESSION_NOT_FOUND');
      error.code = 'SESSION_NOT_FOUND';
      throw error;
    }

    if (learnerId && session.learnerId !== learnerId) {
      const error = new Error('SESSION_FORBIDDEN');
      error.code = 'SESSION_FORBIDDEN';
      throw error;
    }

    return sanitizeSession(session);
  };

  const initializeSession = async sessionInput => {
    const normalized = {
      ...sessionInput,
      createdAt: sessionInput.createdAt || now(),
      updatedAt: now(),
      questions: sessionInput.questions.map(question => ({
        ...question,
        hints: question.hints || [],
        hintsUsed: question.hintsUsed || 0,
        submissions: question.submissions || [],
        lastHintAt: null,
        lastSubmissionAt: null,
      })),
    };

    await repository.saveSession(normalized);
    logger.info?.('practiceService.initializeSession', {
      sessionId: normalized.id,
      learnerId: normalized.learnerId,
      questionCount: normalized.questions.length,
    });

    return sanitizeSession(normalized);
  };

  const getSession = async ({ sessionId, learnerId }) => {
    const session = await assertOwnership({ sessionId, learnerId });
    return sanitizeSession(session);
  };

  const requestHint = async ({
    sessionId,
    questionId,
    learnerId,
    context = {},
  }) => {
    const session = await assertOwnership({ sessionId, learnerId });
    const question = session.questions.find(item => item.id === questionId);

    if (!question) {
      const error = new Error('QUESTION_NOT_FOUND');
      error.code = 'QUESTION_NOT_FOUND';
      throw error;
    }

    if (question.hintsUsed >= HINT_LIMIT) {
      const error = new Error('HINT_LIMIT_REACHED');
      error.code = 'HINT_LIMIT_REACHED';
      throw error;
    }

    const hintResponse = await geminiClient.generateHint({
      question,
      session: {
        id: sessionId,
        courseId: session.courseId,
        learnerId: session.learnerId,
      },
      context,
      previousHints: question.hints,
      hintsUsed: question.hintsUsed,
    });

    const updatedQuestion = await repository.updateQuestion(
      sessionId,
      questionId,
      current => ({
        hints: [...(current.hints || []), hintResponse.hint],
        hintsUsed: (current.hintsUsed || 0) + 1,
        lastHintAt: now(),
      })
    );

    logger.info?.('practiceService.requestHint', {
      sessionId,
      questionId,
      hintsUsed: updatedQuestion?.hintsUsed,
    });

    const remainingHints = Math.max(
      0,
      HINT_LIMIT - (updatedQuestion?.hintsUsed ?? 0)
    );

    return {
      hint: hintResponse.hint,
      reasoning: hintResponse.reasoning,
      remainingHints,
    };
  };

  const runCode = async ({ sessionId, questionId, learnerId, submission }) => {
    await assertOwnership({ sessionId, learnerId });

    const judgeResponse = await judge0Client.execute({
      ...submission,
      sessionId,
      questionId,
      learnerId,
    });

    await repository.recordSubmission(sessionId, questionId, {
      type: 'run',
      submittedAt: now(),
      submission,
      result: judgeResponse,
    });

    logger.info?.('practiceService.runCode', {
      sessionId,
      questionId,
      status: judgeResponse?.status?.description,
    });

    return {
      stdout: judgeResponse?.stdout ?? '',
      stderr: judgeResponse?.stderr ?? '',
      status: judgeResponse?.status?.description ?? 'Unknown',
      time: judgeResponse?.time ?? null,
      memory: judgeResponse?.memory ?? null,
    };
  };

  const submitSolution = async ({
    sessionId,
    questionId,
    learnerId,
    language,
    code,
  }) => {
    const session = await assertOwnership({ sessionId, learnerId });
    const question = session.questions.find(item => item.id === questionId);

    if (!question) {
      const error = new Error('QUESTION_NOT_FOUND');
      error.code = 'QUESTION_NOT_FOUND';
      throw error;
    }

    const evaluation = await geminiClient.evaluateSolution({
      question,
      submission: { language, code },
      session: {
        id: sessionId,
        courseId: session.courseId,
        learnerId: session.learnerId,
      },
    });

    await repository.recordSubmission(sessionId, questionId, {
      type: 'submit',
      submittedAt: now(),
      submission: { language, code },
      evaluation,
    });

    logger.info?.('practiceService.submitSolution', {
      sessionId,
      questionId,
      correct: evaluation?.correct,
      aiSuspected: evaluation?.aiSuspected,
    });

    return {
      correct: Boolean(evaluation?.correct),
      aiSuspected: Boolean(evaluation?.aiSuspected),
      feedback: evaluation?.feedback ?? '',
      diagnostics: evaluation?.diagnostics ?? null,
    };
  };

  return {
    initializeSession,
    getSession,
    requestHint,
    runCode,
    submitSolution,
  };
}

export default createPracticeService;
