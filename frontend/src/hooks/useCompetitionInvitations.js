import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import {
  listInvitations,
  acceptInvitation,
  declineInvitation,
} from '../services/api/competitions.js';

export const COMPETITION_INVITATIONS_QUERY_KEY = ['competition-invitations'];

const useCompetitionInvitations = () => {
  const queryClient = useQueryClient();
  const [busyId, setBusyId] = useState(null);

  const invitationsQuery = useQuery({
    queryKey: COMPETITION_INVITATIONS_QUERY_KEY,
    queryFn: listInvitations,
    staleTime: 30_000,
  });

  const acceptMutation = useMutation({
    mutationFn: (invitationId) => acceptInvitation(invitationId),
    onMutate: (invitationId) => setBusyId(invitationId),
    onSuccess: () => {
      toast.success('Invite accepted! A challenger will join shortly.');
      queryClient.invalidateQueries(COMPETITION_INVITATIONS_QUERY_KEY);
    },
    onError: () => toast.error('Unable to accept invite. Try again.'),
    onSettled: () => setBusyId(null),
  });

  const declineMutation = useMutation({
    mutationFn: (invitationId) => declineInvitation(invitationId),
    onMutate: (invitationId) => setBusyId(invitationId),
    onSuccess: () => {
      toast('Invite declined.', { icon: '👌' });
      queryClient.invalidateQueries(COMPETITION_INVITATIONS_QUERY_KEY);
    },
    onError: () => toast.error('Unable to decline invite.'),
    onSettled: () => setBusyId(null),
  });

  return {
    invitationsQuery,
    busyId,
    accept: (invitationId) => acceptMutation.mutate(invitationId),
    decline: (invitationId) => declineMutation.mutate(invitationId),
  };
};

export default useCompetitionInvitations;
