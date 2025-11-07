import { BookOpen, CheckCircle2, AlertTriangle } from 'lucide-react';
import { cn } from '../../utils/cn.js';

const PracticeSidebar = ({
  session,
  activeQuestionId,
  onSelectQuestion,
  geminiStatus,
}) => {
  if (!session?.questions?.length) return null;

  return (
    <aside className="hidden w-[280px] flex-shrink-0 border-r border-[var(--bg-tertiary)] bg-[var(--bg-secondary)] p-6 md:flex md:flex-col">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">
            {session.courseName || 'Practice Session'}
          </h2>
          <p className="text-sm text-[var(--text-secondary)]">
            {session.questions.length} questions
          </p>
        </div>
        {geminiStatus === 'ai-flagged' ? (
          <AlertTriangle className="h-5 w-5 text-[var(--accent-orange)]" />
        ) : (
          <CheckCircle2 className="h-5 w-5 text-[var(--accent-green)]" />
        )}
      </header>

      <ul className="mt-6 space-y-3">
        {session.questions.map((question, index) => {
          const isActive = question.id === activeQuestionId;
          const hintsLeft = Math.max(0, 3 - (question.hintsUsed || 0));

          return (
            <li key={question.id}>
              <button
                type="button"
                onClick={() => onSelectQuestion(question.id)}
                className={cn(
                  'w-full rounded-xl border border-transparent bg-[var(--bg-primary)] p-4 text-left transition hover:border-[var(--primary-cyan)] hover:shadow',
                  isActive && 'border-[var(--primary-cyan)] shadow-lg'
                )}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-[var(--text-muted)]">
                      Question {index + 1}
                    </p>
                    <h3 className="mt-1 text-sm font-semibold text-[var(--text-primary)]">
                      {question.title || question.topic || 'Untitled Question'}
                    </h3>
                  </div>
                  <span className="rounded bg-[var(--bg-tertiary)] px-2 py-1 text-xs text-[var(--text-secondary)]">
                    {question.language?.toUpperCase() || 'LANG'}
                  </span>
                </div>
                <div className="mt-3 flex items-center justify-between text-xs text-[var(--text-muted)]">
                  <span className="flex items-center gap-1">
                    <BookOpen className="h-4 w-4" />
                    {question.skills?.join(', ') || 'Skills pending'}
                  </span>
                  <span>Hints left: {hintsLeft}</span>
                </div>
              </button>
            </li>
          );
        })}
      </ul>
    </aside>
  );
};

export default PracticeSidebar;
