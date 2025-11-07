import apiClient from './client.js';

export const getPracticeSession = async (sessionId) => {
  const response = await apiClient.get(`/practice/sessions/${sessionId}`);
  return response.data?.data ?? response.data;
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
