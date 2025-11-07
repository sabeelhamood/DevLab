import { Lightbulb, Sparkles } from 'lucide-react';
import { cn } from '../../utils/cn.js';
import HintList from './PracticeQuestionHints.jsx';

const PracticeQuestionCard = ({
  question,
  session,
  onRequestHint,
  onRevealAnswer,
  hintLoading,
  remainingHints,
}) => {
  if (!question) return null;

  return (
    <section className="border-b border-[var(--bg-tertiary)] bg-[var(--bg-card)] px-8 py-6 shadow-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="max-w-3xl">
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--text-muted)]">
            {question.topic || session?.courseName}
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-[var(--text-primary)]">
            {question.title || 'Practice Challenge'}
          </h1>
          <p className="mt-4 whitespace-pre-line text-[var(--text-secondary)]">
            {question.description || question.stem}
          </p>

          {question.tests?.length > 0 && (
            <div className="mt-6 rounded-xl border border-[var(--bg-tertiary)] bg-[var(--bg-secondary)] p-4">
              <h2 className="text-sm font-semibold text-[var(--text-primary)]">
                Test Cases
              </h2>
              <ul className="mt-3 space-y-2 text-sm text-[var(--text-muted)]">
                {question.tests.map((test, index) => (
                  <li
                    key={index}
                    className="rounded-lg bg-[var(--bg-primary)] p-3"
                  >
                    <div className="font-semibold text-[var(--text-primary)]">
                      Input:
                    </div>
                    <pre className="mt-1 whitespace-pre-wrap">
                      {JSON.stringify(test.input)}
                    </pre>
                    <div className="mt-2 font-semibold text-[var(--text-primary)]">
                      Expected Output:
                    </div>
                    <pre className="mt-1 whitespace-pre-wrap">
                      {JSON.stringify(test.output)}
                    </pre>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="flex flex-col items-end gap-3">
          <button
            type="button"
            onClick={onRequestHint}
            disabled={hintLoading || remainingHints === 0}
            className={cn(
              'flex items-center gap-2 rounded-lg bg-[var(--gradient-primary)] px-4 py-2 font-semibold text-white shadow-lg transition hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--primary-cyan)]',
              hintLoading && 'opacity-70'
            )}
          >
            <Lightbulb className="h-4 w-4" />
            {hintLoading
              ? 'Fetching Hint...'
              : remainingHints === 0
                ? 'Hints Exhausted'
                : `Get Hint (${remainingHints})`}
          </button>
          <button
            type="button"
            onClick={onRevealAnswer}
            className="flex items-center gap-2 rounded-lg border border-[var(--accent-orange)] px-4 py-2 text-sm font-semibold text-[var(--accent-orange)] transition hover:bg-[var(--accent-orange)] hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--accent-orange)]"
          >
            <Sparkles className="h-4 w-4" />
            Reveal Answer
          </button>
        </div>
      </div>

      <HintList hints={question.hints} />
    </section>
  );
};

export default PracticeQuestionCard;
