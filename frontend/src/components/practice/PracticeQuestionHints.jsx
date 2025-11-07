const PracticeQuestionHints = ({ hints = [] }) => {
  if (!hints.length) return null;

  return (
    <div className="mt-6 rounded-xl border border-[var(--primary-cyan)] bg-[var(--bg-primary)] p-4 shadow-inner">
      <h3 className="text-sm font-semibold text-[var(--primary-cyan)]">
        Hints you've unlocked
      </h3>
      <ol className="mt-3 space-y-3 text-sm text-[var(--text-secondary)]">
        {hints.map((hint, index) => (
          <li
            key={index}
            className="rounded-lg border border-[var(--bg-tertiary)] bg-[var(--bg-secondary)] p-3"
          >
            <p className="font-semibold text-[var(--text-primary)]">
              Hint {index + 1}
            </p>
            <p className="mt-1">{hint}</p>
          </li>
        ))}
      </ol>
    </div>
  );
};

export default PracticeQuestionHints;
