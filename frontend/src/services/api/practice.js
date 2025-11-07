import apiClient from './client.js';

const buildDevMockSession = (sessionId) => ({
  id: sessionId || 'session-demo',
  learnerId: 'demo-learner',
  courseId: 'demo-course',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  questions: [
    {
      id: 'demo-question',
      title: 'Sample Practice Question',
      stem: 'Write a function that returns the sum of two numbers.',
      description:
        'Implement add(a, b) to return the combined total of both arguments.',
      language: 'javascript',
      programming_language: 'javascript',
      question_type: 'code',
      humanLanguage: 'en',
      question_amount: 4,
      topic_id: 'topic-intro-functions',
      topic_name: 'Intro to Functions',
      topic: 'Intro to Functions',
      skills: ['Arithmetic', 'Functions'],
      scaffold:
        'function add(a, b) {\n  // TODO: return the sum of a and b\n}\n',
      hints: [
        'Start by thinking about JavaScript operators.',
        'You can return the result of adding the two parameters directly.',
      ],
      hintsUsed: 0,
      tests: [
        { input: [1, 2], output: 3 },
        { input: [0, 5], output: 5 },
        { input: [-3, 3], output: 0 },
      ],
      submissions: [],
      lastHintAt: null,
      lastSubmissionAt: null,
    },
  ],
});

const sessionCache = new Map();

const cacheSession = (sessionId, data) => {
  sessionCache.set(sessionId, data);
  return data;
};

const retrieveCachedSession = (sessionId) =>
  sessionCache.get(sessionId) ?? null;

const buildAndCacheDevMock = (sessionId) =>
  cacheSession(sessionId, buildDevMockSession(sessionId));

const handleSuccessfulResponse = ({ sessionId, payload, response, isDev }) => {
  if (payload?.questions?.length) {
    return cacheSession(sessionId, payload);
  }

  if (isDev) {
    return buildAndCacheDevMock(sessionId);
  }

  if (response.status === 304) {
    return retrieveCachedSession(sessionId);
  }

  return retrieveCachedSession(sessionId);
};

const handleErrorResponse = ({ sessionId, error, isDev }) => {
  const status = error?.response?.status;

  if (status === 304) {
    return retrieveCachedSession(sessionId);
  }

  if (status === 404) {
    return isDev ? buildAndCacheDevMock(sessionId) : null;
  }

  if (status === 401 || status === 403) {
    return {
      id: sessionId,
      error: 'UNAUTHORIZED',
      questions: [],
    };
  }

  if (isDev) {
    return buildAndCacheDevMock(sessionId);
  }

  throw error;
};

export const getPracticeSession = async (sessionId) => {
  if (!sessionId) return null;

  const isDev = Boolean(import.meta.env.DEV);

  try {
    const cacheBypassParam = isDev ? `?_=${Date.now()}` : '';
    const response = await apiClient.get(
      `/practice/sessions/${sessionId}${cacheBypassParam}`
    );
    const payload = response.data?.data ?? response.data ?? null;

    if (isDev) {
      console.debug('[practiceApi] response payload', payload);
    }

    return handleSuccessfulResponse({
      sessionId,
      payload,
      response,
      isDev,
    });
  } catch (error) {
    return handleErrorResponse({ sessionId, error, isDev });
  }
};

export const requestHint = async (sessionId, questionId) => {
  const response = await apiClient.post(
    `/practice/sessions/${sessionId}/hints`,
    {
      questionId,
    }
  );
  return response.data?.data ?? response.data;
};

export const runCode = async (sessionId, questionId, submission) => {
  const response = await apiClient.post(`/practice/sessions/${sessionId}/run`, {
    questionId,
    submission,
  });
  return response.data?.data ?? response.data;
};

export const submitSolution = async (sessionId, questionId, payload) => {
  const response = await apiClient.post(
    `/practice/sessions/${sessionId}/submit`,
    {
      questionId,
      ...payload,
    }
  );
  return response.data?.data ?? response.data;
};
