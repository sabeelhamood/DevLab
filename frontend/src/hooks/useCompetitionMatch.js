import { useEffect, useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import {
  fetchMatch,
  submitRound,
  completeMatch,
} from '../services/api/competitions.js';

export const createMatchQueryKey = (matchId) => ['competition-match', matchId];

const parseTimer = (timer) => {
  if (!timer) return 0;
  const parts = timer.split(':').map(Number);
  if (parts.length !== 3) return 0;
  const [hours, minutes, seconds] = parts;
  return hours * 3600 + minutes * 60 + seconds;
};

const useCompetitionMatch = (matchId) => {
  const queryClient = useQueryClient();
  const [remaining, setRemaining] = useState(0);

  const matchQuery = useQuery({
    queryKey: createMatchQueryKey(matchId),
    queryFn: () => fetchMatch(matchId),
    enabled: Boolean(matchId),
    refetchInterval: (data) => (data?.status === 'completed' ? false : 5000),
  });

  useEffect(() => {
    if (!matchQuery.data?.timer) return;
    const totalSeconds = parseTimer(matchQuery.data.timer);
    setRemaining(totalSeconds);

    const interval = setInterval(() => {
      setRemaining((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(interval);
  }, [matchQuery.data?.timer]);

  useEffect(() => {
    if (matchQuery.data?.winner) {
      toast.success(`Match complete! Winner: ${matchQuery.data.winner}`);
    }
  }, [matchQuery.data?.winner]);

  const submitMutation = useMutation({
    mutationFn: ({ code, language }) =>
      submitRound(matchId, { questionIndex: 0, code, language }),
    onSuccess: (data) => {
      if (data?.evaluation?.correct) {
        toast.success('Answer submitted!');
      } else {
        toast('Feedback received—optimize and retry.', { icon: '🎯' });
      }
      queryClient.invalidateQueries(createMatchQueryKey(matchId));
    },
    onError: () => toast.error('Submission failed. Try again.'),
  });

  const completeMutation = useMutation({
    mutationFn: () => completeMatch(matchId),
    onSuccess: () => {
      toast.success('Match marked as complete.');
      queryClient.invalidateQueries(createMatchQueryKey(matchId));
    },
    onError: () => toast.error('Unable to close match.'),
  });

  const activeQuestion = useMemo(
    () => matchQuery.data?.questions?.[0],
    [matchQuery.data]
  );

  return {
    matchQuery,
    remaining,
    activeQuestion,
    submit: submitMutation.mutate,
    submitStatus: submitMutation.status,
    submitResult: submitMutation.data?.evaluation,
    complete: completeMutation.mutate,
    matchRefetch: () =>
      queryClient.invalidateQueries(createMatchQueryKey(matchId)),
  };
};

export default useCompetitionMatch;
