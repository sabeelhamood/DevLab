const CompetitionResults = ({ match }) => {
  if (!match?.results) return null;

  const participants = match.participants || [];

  const scoreFor = (participantId) => {
    const submissions = match.results?.[participantId] || [];
    return submissions.filter((item) => item?.evaluation?.correct).length;
  };

  const totalQuestions = match.questions?.length || 1;

  return (
    <section
      className="rounded-2xl border border-[var(--bg-tertiary)] bg-[var(--bg-card)] p-4 shadow"
      aria-live="polite"
    >
      <header className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">
          Live Scoreboard
        </h3>
        {match.status === 'completed' && (
          <span className="rounded-full bg-[var(--gradient-accent)] px-3 py-1 text-xs font-semibold text-white">
            Winner: {match.winner}
          </span>
        )}
      </header>
      <div className="mt-4 space-y-3">
        {participants.map((participant) => {
          const score = scoreFor(participant.id);
          const percentage = Math.round((score / totalQuestions) * 100);

          return (
            <div
              key={participant.id}
              className="rounded-xl bg-[var(--bg-primary)]/90 p-3 text-sm text-[var(--text-secondary)]"
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-[var(--text-primary)]">
                  {participant.pseudonym}
                </span>
                <span>
                  {score} / {totalQuestions} pts
                </span>
              </div>
              <div
                className="mt-2 h-2 overflow-hidden rounded-full bg-[var(--bg-tertiary)]"
                aria-hidden
              >
                <div
                  className="h-full rounded-full bg-[var(--gradient-secondary)] transition-all"
                  style={{ width: `${percentage}%` }}
                ></div>
              </div>
              <p className="mt-1 text-xs text-[var(--text-muted)]">
                Accuracy {percentage}%
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default CompetitionResults;
