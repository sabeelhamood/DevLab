/* eslint-disable max-lines-per-function */
const CONTENT_STUDIO_MOCK = {
  question_amount: 4,
  topic_id: 'topic-intro-functions',
  topic_name: 'Intro to Functions',
  topic: 'Intro to Functions',
  skills: ['Arithmetic', 'Functions'],
  question_type: 'code',
  programming_language: 'javascript',
  humanLanguage: 'en',
};

const coerceArray = value => {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
};

const parseMaybeJson = value => {
  if (value === null || value === undefined) return value;
  if (Array.isArray(value) || typeof value === 'object') return value;
  if (typeof value !== 'string') return value;

  try {
    return JSON.parse(value);
  } catch (error) {
    return value;
  }
};

const normaliseTestCase = (test, index) => {
  if (!test || typeof test !== 'object') {
    return { input: [], output: null, index };
  }

  const rawInput = parseMaybeJson(test.input ?? test.inputs ?? test.args);
  const rawOutput = parseMaybeJson(
    test.output ?? test.expected ?? test.result ?? test.answer
  );

  return {
    input: rawInput,
    output: rawOutput,
  };
};

const DEFAULT_TESTS = [
  { input: [1, 2], output: 3 },
  { input: [0, 0], output: 0 },
];

const toTrimmedString = value =>
  typeof value === 'string' ? value.trim() : '';

const pickTitle = generated =>
  toTrimmedString(generated?.question) || 'Practice Challenge';

const pickStem = (generated, fallbackTitle) =>
  toTrimmedString(generated?.stem) || fallbackTitle || '';

const pickDescription = (generated, fallbackTitle) =>
  toTrimmedString(generated?.explanation) ||
  fallbackTitle ||
  'Apply what you know to solve this challenge.';

const pickLanguage = (generated, metadata) => {
  const candidate = toTrimmedString(generated?.language);
  return candidate ? candidate.toLowerCase() : metadata.programming_language;
};

const pickProgrammingLanguage = (generated, metadata) =>
  metadata.programming_language ||
  toTrimmedString(generated?.language) ||
  'javascript';

const pickScaffold = (generated, metadata) => {
  const scaffolds = coerceArray(
    generated?.scaffold || generated?.starter
  ).filter(Boolean);

  if (scaffolds.length > 0) {
    return scaffolds[0];
  }

  const languageLabel = metadata.programming_language || 'JavaScript';
  return `// Implement your solution in ${languageLabel}\n`;
};

const prepareTests = generated => {
  const tests = coerceArray(generated?.tests)
    .map((test, testIndex) => normaliseTestCase(test, testIndex))
    .filter(Boolean);

  return tests.length ? tests : DEFAULT_TESTS;
};

const normaliseGeneratedQuestion = (generated, metadata, index) => {
  const hints = coerceArray(generated?.hints).filter(Boolean);
  const title = pickTitle(generated);
  const tests = prepareTests(generated);

  return {
    id: `${metadata.topic_id || 'topic'}-gemini-${index + 1}`,
    title,
    stem: pickStem(generated, title),
    description: pickDescription(generated, title),
    language: pickLanguage(generated, metadata),
    programming_language: pickProgrammingLanguage(generated, metadata),
    question_type: metadata.question_type,
    humanLanguage: metadata.humanLanguage || 'en',
    question_amount: metadata.question_amount,
    topic_id: metadata.topic_id,
    topic_name: metadata.topic_name,
    topic: metadata.topic,
    skills: metadata.skills,
    scaffold: pickScaffold(generated, metadata),
    solution: generated?.solution || '',
    explanation: generated?.explanation || '',
    hints,
    hintsUsed: 0,
    tests,
    submissions: [],
    lastHintAt: null,
    lastSubmissionAt: null,
  };
};

const buildStaticMockQuestion = () => ({
  id: 'demo-question',
  title: 'Sample Practice Question',
  stem: 'Implement add(a, b) to return their sum.',
  description:
    'Write a function that returns the sum of the provided arguments.',
  language: 'javascript',
  programming_language: 'javascript',
  question_type: 'code',
  humanLanguage: 'en',
  question_amount: 4,
  topic_id: 'topic-intro-functions',
  topic_name: 'Intro to Functions',
  topic: 'Intro to Functions',
  skills: ['Arithmetic', 'Functions'],
  scaffold: 'function add(a, b) {\n  // TODO: return the sum of a and b\n}\n',
  hints: [
    'Remember how addition works in JavaScript.',
    'Try returning the result of adding the parameters.',
    'Think about negative numbers and zero.',
  ],
  hintsUsed: 0,
  tests: [
    { input: [1, 2], output: 3 },
    { input: [0, 0], output: 0 },
    { input: [-5, 7], output: 2 },
  ],
  submissions: [],
  lastHintAt: null,
  lastSubmissionAt: null,
});

const MAX_GENERATED_QUESTIONS = 5;

const computeRequestedCount = questionAmount => {
  const safeAmount = Math.max(questionAmount || 1, 1);
  return Math.min(safeAmount, MAX_GENERATED_QUESTIONS);
};

const attemptGenerateQuestion = async ({
  metadata,
  index,
  geminiClient,
  logger,
}) => {
  try {
    const generated = await geminiClient.generateQuestion({
      topicName: metadata.topic_name,
      skills: metadata.skills,
      questionType: metadata.question_type,
      programmingLanguage: metadata.programming_language,
      humanLanguage: metadata.humanLanguage,
    });

    return normaliseGeneratedQuestion(generated, metadata, index);
  } catch (error) {
    logger?.warn?.('practiceController.mockSession.geminiFallback', {
      error: error.message,
      index,
    });
    return null;
  }
};

const generateQuestionsFromGemini = async ({
  metadata,
  requestedCount,
  geminiClient,
  logger,
}) => {
  if (!geminiClient?.generateQuestion) {
    return [];
  }

  const questions = [];

  for (let index = 0; index < requestedCount; index += 1) {
    const generated = await attemptGenerateQuestion({
      metadata,
      index,
      geminiClient,
      logger,
    });

    if (!generated) {
      break;
    }

    questions.push(generated);
  }

  return questions;
};

const ensureQuestions = questions =>
  questions.length ? questions : [buildStaticMockQuestion()];

const buildMockSession = async ({
  sessionId,
  learnerId,
  geminiClient,
  logger,
}) => {
  const now = new Date().toISOString();
  const metadata = { ...CONTENT_STUDIO_MOCK };
  const requestedCount = computeRequestedCount(metadata.question_amount);

  const generatedQuestions = await generateQuestionsFromGemini({
    metadata,
    requestedCount,
    geminiClient,
    logger,
  });

  const questions = ensureQuestions(generatedQuestions);

  return {
    id: sessionId || 'session-demo',
    learnerId: learnerId || 'demo-learner',
    courseId: 'demo-course',
    createdAt: now,
    updatedAt: now,
    questions,
  };
};

const persistMockSession = async (practiceService, session, logger) => {
  try {
    return await practiceService.initializeSession(session);
  } catch (error) {
    logger?.warn?.('practiceController.mockSession.persistFailed', {
      error: error.message,
    });
    return session;
  }
};

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

export const createPracticeController = (
  practiceService,
  { geminiClient = null, logger = console } = {}
) => ({
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

      if (
        !session?.questions?.length &&
        process.env['NODE_ENV'] !== 'production'
      ) {
        const fallbackSession = await buildMockSession({
          sessionId: req.params.sessionId,
          learnerId: req.user?.sub || req.user?.id,
          geminiClient,
          logger,
        });
        const persisted = await persistMockSession(
          practiceService,
          fallbackSession,
          logger
        );
        res.status(200).json({
          success: true,
          data: persisted,
          warning:
            'Returning mock practice session because the requested session has no questions.',
        });
        return;
      }

      res.status(200).json({ success: true, data: session });
    } catch (error) {
      if (
        ['SESSION_NOT_FOUND', 'SUPABASE_FETCH_ERROR'].includes(error?.code) &&
        process.env['NODE_ENV'] !== 'production'
      ) {
        const fallbackSession = await buildMockSession({
          sessionId: req.params.sessionId,
          learnerId: req.user?.sub || req.user?.id,
          geminiClient,
          logger,
        });
        const persisted = await persistMockSession(
          practiceService,
          fallbackSession,
          logger
        );
        res.status(200).json({
          success: true,
          data: persisted,
          warning:
            'Returning mock practice session because the requested session was not found.',
        });
        return;
      }

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
