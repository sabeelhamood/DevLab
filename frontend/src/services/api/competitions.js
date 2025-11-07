import apiClient from './client.js';

// Temporary override to bypass login while auth service is offline.
const FORCE_MOCK_MODE = true;

const buildMockInvitations = () => ([
  {
    id: 'mock-invite-1',
    competitionId: 'comp-1',
    competitionName: 'Mock Algo Sprint',
    createdAt: new Date().toISOString(),
    status: 'PENDING',
    host: 'Coach A',
    level: 'Intermediate',
  },
  {
    id: 'mock-invite-2',
    competitionId: 'comp-2',
    competitionName: 'Team Coding Challenge',
    createdAt: new Date().toISOString(),
    status: 'PENDING',
    host: 'Coach B',
    level: 'Beginner',
  },
]);

const buildMockMatch = (matchId) => ({
  id: matchId,
  competitionName: 'Mock Match',
  round: 1,
  totalRounds: 3,
  opponent: 'AI Challenger',
  status: 'IN_PROGRESS',
  prompts: [
    {
      id: 'prompt-1',
      title: 'Reverse Linked List',
      description:
        'Given the head of a singly linked list, reverse the list and return the new head.',
      language: 'javascript',
    },
  ],
});

export const listInvitations = async () => {
  if (FORCE_MOCK_MODE) {
    return buildMockInvitations();
  }

  const response = await apiClient.get('/competitions/invitations');
  return response.data?.data ?? response.data;
};

export const acceptInvitation = async (invitationId) => {
  if (FORCE_MOCK_MODE) {
    return Promise.resolve({ success: true, invitationId });
  }

  const response = await apiClient.post(
    `/competitions/invitations/${invitationId}/accept`
  );
  return response.data?.data ?? response.data;
};

export const declineInvitation = async (invitationId) => {
  if (FORCE_MOCK_MODE) {
    return Promise.resolve({ success: true, invitationId });
  }

  const response = await apiClient.post(
    `/competitions/invitations/${invitationId}/decline`
  );
  return response.data?.data ?? response.data;
};

export const fetchMatch = async (matchId) => {
  if (FORCE_MOCK_MODE) {
    return buildMockMatch(matchId);
  }

  const response = await apiClient.get(`/competitions/${matchId}`);
  return response.data?.data ?? response.data;
};

export const submitRound = async (matchId, payload) => {
  if (FORCE_MOCK_MODE) {
    return Promise.resolve({
      success: true,
      matchId,
      payload,
      feedback:
        'Mock judge: great effort! Try to optimize for edge cases next time.',
    });
  }

  const response = await apiClient.post(
    `/competitions/${matchId}/submit`,
    payload
  );
  return response.data?.data ?? response.data;
};

export const completeMatch = async (matchId) => {
  if (FORCE_MOCK_MODE) {
    return Promise.resolve({ success: true, matchId });
  }

  const response = await apiClient.post(`/competitions/${matchId}/complete`);
  return response.data?.data ?? response.data;
};
