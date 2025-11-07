import apiClient from './client.js';

export const listInvitations = async () => {
  const response = await apiClient.get('/competitions/invitations');
  return response.data?.data ?? response.data;
};

export const acceptInvitation = async (invitationId) => {
  const response = await apiClient.post(
    `/competitions/invitations/${invitationId}/accept`
  );
  return response.data?.data ?? response.data;
};

export const declineInvitation = async (invitationId) => {
  const response = await apiClient.post(
    `/competitions/invitations/${invitationId}/decline`
  );
  return response.data?.data ?? response.data;
};

export const fetchMatch = async (matchId) => {
  const response = await apiClient.get(`/competitions/${matchId}`);
  return response.data?.data ?? response.data;
};

export const submitRound = async (matchId, payload) => {
  const response = await apiClient.post(
    `/competitions/${matchId}/submit`,
    payload
  );
  return response.data?.data ?? response.data;
};

export const completeMatch = async (matchId) => {
  const response = await apiClient.post(`/competitions/${matchId}/complete`);
  return response.data?.data ?? response.data;
};
