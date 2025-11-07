import { useEffect, useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import {
  getPracticeSession,
  requestHint,
  runCode,
  submitSolution,
} from '../../services/api/practice.js';
import PracticeQuestionCard from '../../components/practice/PracticeQuestionCard.jsx';
import PracticeSidebar from '../../components/practice/PracticeSidebar.jsx';
import PracticeRunner from '../../components/practice/PracticeRunner.jsx';
import PracticeRevealDialog from '../../components/practice/PracticeRevealDialog.jsx';
import LoadingSpinner from '../../components/LoadingSpinner.jsx';
import ErrorMessage from '../../components/ErrorMessage.jsx';

const DEFAULT_LANGUAGE = 'javascript';

const PracticePage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const DEFAULT_SESSION_ID =
    import.meta.env.VITE_DEFAULT_PRACTICE_SESSION_ID || 'session-demo';

  const sessionId = searchParams.get('sessionId') || DEFAULT_SESSION_ID;

  useEffect(() => {
    if (!searchParams.get('sessionId') && DEFAULT_SESSION_ID) {
      setSearchParams({ sessionId: DEFAULT_SESSION_ID }, { replace: true });
    }
  }, [searchParams, setSearchParams, DEFAULT_SESSION_ID]);

  const [activeQuestionId, setActiveQuestionId] = useState(null);
  const [codeState, setCodeState] = useState({
    language: DEFAULT_LANGUAGE,
    code: '',
  });
  const [isRevealOpen, setRevealOpen] = useState(false);

  const {
    data: session,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['practice-session', sessionId],
    queryFn: () => getPracticeSession(sessionId),
    enabled: Boolean(sessionId),
    onSuccess: (data) => {
      if (!activeQuestionId && data?.questions?.length) {
        setActiveQuestionId(data.questions[0].id);
      }
    },
  });

  const activeQuestion = useMemo(() => {
    return session?.questions?.find(
      (question) => question.id === activeQuestionId
    );
  }, [session, activeQuestionId]);

  useEffect(() => {
    if (!session?.questions?.length) return;

    const firstQuestionId = session.questions[0]?.id ?? null;
    const existsInSession = session.questions.some(
      (question) => question.id === activeQuestionId
    );

    if (!activeQuestionId && firstQuestionId) {
      setActiveQuestionId(firstQuestionId);
    } else if (!existsInSession && firstQuestionId) {
      setActiveQuestionId(firstQuestionId);
    }
  }, [session, activeQuestionId]);

  useEffect(() => {
    if (!sessionId && session?.id) {
      navigate({ search: `sessionId=${session.id}` }, { replace: true });
    }
  }, [sessionId, session, navigate]);

  useEffect(() => {
    if (!activeQuestion) return;
    if (
      activeQuestion.language &&
      activeQuestion.language !== codeState.language
    ) {
      setCodeState((prev) => ({ ...prev, language: activeQuestion.language }));
    }
    if (
      activeQuestion.scaffold &&
      activeQuestion.scaffold !== codeState.scaffoldApplied
    ) {
      setCodeState({
        language: activeQuestion.language || DEFAULT_LANGUAGE,
        code: activeQuestion.scaffold,
        scaffoldApplied: activeQuestion.scaffold,
      });
    }
  }, [activeQuestion]);

  const hintMutation = useMutation({
    mutationFn: (questionId) => requestHint(sessionId, questionId),
    onSuccess: () => {
      queryClient.invalidateQueries(['practice-session', sessionId]);
    },
    onError: (err) => {
      const message = err?.response?.data?.error;
      if (message === 'HINT_LIMIT_REACHED') {
        toast.error('You have used all available hints for this question.');
      } else {
        toast.error('Unable to fetch hint. Please try again later.');
      }
    },
  });

  const runMutation = useMutation({
    mutationFn: ({ questionId, submission }) =>
      runCode(sessionId, questionId, submission),
    onSuccess: (data) => {
      if (data.status === 'Configuration Error') {
        toast.error(
          'Code execution service is unavailable. Please try again later.'
        );
      }
      queryClient.invalidateQueries(['practice-session', sessionId]);
    },
    onError: () => {
      toast.error('Failed to run code. Please try again.');
    },
  });

  const submitMutation = useMutation({
    mutationFn: ({ questionId, payload }) =>
      submitSolution(sessionId, questionId, payload),
    onSuccess: (data) => {
      if (data.aiSuspected) {
        toast.error('AI-generated solution detected. Try solving it yourself!');
      } else if (data.correct) {
        toast.success('Great job! Your solution passed.');
      } else {
        toast('Review the feedback and try again.', { icon: '💡' });
      }
      queryClient.invalidateQueries(['practice-session', sessionId]);
    },
    onError: () => {
      toast.error('Submission failed. Please retry.');
    },
  });

  const handleSelectQuestion = (questionId) => {
    setActiveQuestionId(questionId);
  };

  const handleHint = () => {
    if (!activeQuestion) return;
    hintMutation.mutate(activeQuestion.id);
  };

  const handleRun = () => {
    if (!activeQuestion) return;
    runMutation.mutate({
      questionId: activeQuestion.id,
      submission: {
        language: codeState.language,
        code: codeState.code,
        stdin: '',
        expectedOutput: '',
      },
    });
  };

  const handleSubmit = () => {
    if (!activeQuestion) return;
    submitMutation.mutate({
      questionId: activeQuestion.id,
      payload: {
        language: codeState.language,
        code: codeState.code,
      },
    });
  };

  const handleReveal = () => {
    setRevealOpen(true);
  };

  const handleCloseReveal = () => setRevealOpen(false);

  const fallbackChecks = [
    {
      condition: () => !sessionId,
      render: () => (
        <ErrorMessage
          title="Practice session not found"
          message="Please launch practice from your course or contact your trainer."
        />
      ),
    },
    {
      condition: () => isLoading,
      render: () => <LoadingSpinner label="Loading your practice session..." />,
    },
    {
      condition: () => isError,
      render: () => (
        <ErrorMessage
          title="Unable to load practice session"
          message={error?.message || 'Please refresh or try again later.'}
        />
      ),
    },
    {
      condition: () => session?.error === 'UNAUTHORIZED',
      render: () => (
        <ErrorMessage
          title="Sign in required"
          message="We could not verify your access to this practice session. Please log in again or contact your administrator."
        />
      ),
    },
    {
      condition: () => !session,
      render: () => (
        <ErrorMessage
          title="No active practice session"
          message="Launch practice from your course or ask your trainer to assign a session."
        />
      ),
    },
    {
      condition: () => !activeQuestion,
      render: () => (
        <ErrorMessage
          title="No questions available"
          message="This session has no practice questions assigned."
        />
      ),
    },
  ];

  const fallbackResult = fallbackChecks.find(({ condition }) => condition());

  if (fallbackResult) {
    return (
      <div className="flex h-full items-center justify-center">
        {fallbackResult.render()}
      </div>
    );
  }

  const remainingHints = Math.max(0, 3 - (activeQuestion.hintsUsed || 0));

  return (
    <div className="flex h-full bg-[var(--bg-primary)] text-[var(--text-primary)]">
      <PracticeSidebar
        session={session}
        activeQuestionId={activeQuestionId}
        onSelectQuestion={handleSelectQuestion}
        geminiStatus={submitMutation.data?.aiSuspected ? 'ai-flagged' : 'ok'}
      />
      <main className="flex-1 overflow-hidden">
        <PracticeQuestionCard
          question={activeQuestion}
          session={session}
          onRequestHint={handleHint}
          onRevealAnswer={handleReveal}
          hintLoading={hintMutation.isLoading}
          remainingHints={remainingHints}
        />
        <PracticeRunner
          question={activeQuestion}
          codeState={codeState}
          onChangeCode={setCodeState}
          onRun={handleRun}
          onSubmit={handleSubmit}
          runStatus={runMutation.status}
          submitStatus={submitMutation.status}
          lastRun={runMutation.data}
          feedback={submitMutation.data}
        />
      </main>
      <PracticeRevealDialog
        open={isRevealOpen}
        onClose={handleCloseReveal}
        question={activeQuestion}
      />
    </div>
  );
};

export default PracticePage;
