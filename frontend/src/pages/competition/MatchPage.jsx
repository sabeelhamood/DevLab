import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import {
  CompetitionAtmosphere,
  CompetitionTimer,
  CompetitionResults,
} from '../../components/competition/index.js';
import PracticeRunner from '../../components/practice/PracticeRunner.jsx';
import LoadingSpinner from '../../components/LoadingSpinner.jsx';
import ErrorMessage from '../../components/ErrorMessage.jsx';
import useCompetitionMatch from '../../hooks/useCompetitionMatch.js';

const MatchPage = () => {
  const { matchId } = useParams();
  const navigate = useNavigate();
  const [codeState, setCodeState] = useState({
    language: 'javascript',
    code: '',
  });
  const {
    matchQuery,
    remaining,
    activeQuestion,
    submit,
    submitStatus,
    submitResult,
    complete,
  } = useCompetitionMatch(matchId);

  useEffect(() => {
    if (!matchId) {
      navigate('/competition/invitations', { replace: true });
    }
  }, [matchId, navigate]);

  useEffect(() => {
    if (
      activeQuestion?.language &&
      activeQuestion.language !== codeState.language
    ) {
      setCodeState((prev) => ({ ...prev, language: activeQuestion.language }));
    }
  }, [activeQuestion, codeState.language]);

  if (!matchId) {
    return null;
  }

  if (matchQuery.isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <LoadingSpinner label="Loading competition arena..." />
      </div>
    );
  }

  if (matchQuery.isError) {
    return (
      <div className="flex h-full items-center justify-center">
        <ErrorMessage
          title="Match unavailable"
          message={matchQuery.error?.message}
        />
      </div>
    );
  }

  if (!matchQuery.data) {
    return null;
  }

  const handleSubmit = () =>
    submit({ code: codeState.code, language: codeState.language });
  const handleRun = () =>
    toast('Code execution runs automatically on submission.', { icon: 'ℹ️' });

  return (
    <div className="relative h-full overflow-hidden bg-[var(--bg-primary)] text-[var(--text-primary)]">
      <CompetitionAtmosphere />
      <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-col gap-6 px-6 py-8">
        <header className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-[var(--text-muted)]">
              Match {matchId.slice(0, 8)}
            </p>
            <h1 className="text-3xl font-semibold text-[var(--text-primary)]">
              {matchQuery.data.courseName}
            </h1>
            <p className="text-sm text-[var(--text-secondary)]">
              Compete anonymously and let Gemini evaluate correctness and
              authenticity.
            </p>
          </div>
          <CompetitionTimer
            remaining={remaining}
            total={matchQuery.data.timer}
            onExpire={() => {
              toast('Timer expired—finalizing results.');
              complete();
            }}
          />
        </header>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <PracticeRunner
              question={activeQuestion}
              codeState={codeState}
              onChangeCode={setCodeState}
              onRun={handleRun}
              onSubmit={handleSubmit}
              runStatus={submitStatus === 'pending' ? 'pending' : 'idle'}
              submitStatus={submitStatus}
              lastRun={null}
              feedback={submitResult}
            />
          </div>
          <CompetitionResults match={matchQuery.data} />
        </div>

        {matchQuery.data.status !== 'completed' && (
          <button
            type="button"
            onClick={() => complete()}
            className="self-end rounded-lg border border-[var(--accent-orange)] px-4 py-2 text-sm font-semibold text-[var(--accent-orange)] transition hover:bg-[var(--accent-orange)] hover:text-white"
          >
            Finalize Match
          </button>
        )}
      </div>
    </div>
  );
};

export default MatchPage;
