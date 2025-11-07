/* eslint-disable complexity */
import { useState } from 'react';
import Editor from '@monaco-editor/react';
import { Play, Send } from 'lucide-react';
import { cn } from '../../utils/cn.js';

const languageOptions = [
  { value: 'javascript', label: 'JavaScript' },
  { value: 'python', label: 'Python' },
  { value: 'java', label: 'Java' },
  { value: 'cpp', label: 'C++' },
  { value: 'go', label: 'Go' },
  { value: 'rust', label: 'Rust' },
];

const PracticeRunner = ({
  question,
  codeState,
  onChangeCode,
  onRun,
  onSubmit,
  runStatus,
  submitStatus,
  lastRun,
  feedback,
}) => {
  const [isExpanded, setExpanded] = useState(true);

  if (!question) return null;

  const handleLanguageChange = (event) => {
    onChangeCode({ ...codeState, language: event.target.value });
  };

  const handleEditorChange = (value) => {
    onChangeCode({ ...codeState, code: value || '' });
  };

  return (
    <section className="flex h-[calc(100%-260px)] flex-col overflow-hidden">
      <header className="flex items-center justify-between border-b border-[var(--bg-tertiary)] bg-[var(--bg-secondary)] px-6 py-3">
        <div className="flex items-center gap-3">
          <select
            value={codeState.language}
            onChange={handleLanguageChange}
            className="rounded-lg border border-[var(--bg-tertiary)] bg-[var(--bg-primary)] px-3 py-2 text-sm text-[var(--text-primary)] focus:border-[var(--primary-cyan)] focus:outline-none"
          >
            {languageOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => setExpanded((prev) => !prev)}
            className="text-xs uppercase tracking-[0.3em] text-[var(--text-muted)] hover:text-[var(--primary-cyan)]"
          >
            {isExpanded ? 'Collapse Output' : 'Expand Output'}
          </button>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onRun}
            disabled={runStatus === 'pending'}
            className={cn(
              'flex items-center gap-2 rounded-lg border border-[var(--primary-cyan)] px-4 py-2 text-sm font-semibold text-[var(--primary-cyan)] transition hover:bg-[var(--primary-cyan)] hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--primary-cyan)]',
              runStatus === 'pending' && 'opacity-70'
            )}
          >
            <Play className="h-4 w-4" />
            {runStatus === 'pending' ? 'Running...' : 'Run Code'}
          </button>
          <button
            type="button"
            onClick={onSubmit}
            disabled={submitStatus === 'pending'}
            className={cn(
              'flex items-center gap-2 rounded-lg bg-[var(--gradient-secondary)] px-4 py-2 text-sm font-semibold text-white shadow-lg transition hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--primary-cyan)]',
              submitStatus === 'pending' && 'opacity-70'
            )}
          >
            <Send className="h-4 w-4" />
            {submitStatus === 'pending' ? 'Submitting...' : 'Submit Answer'}
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 border-r border-[var(--bg-tertiary)]">
          <Editor
            height="100%"
            language={codeState.language}
            value={codeState.code}
            onChange={handleEditorChange}
            theme="vs-dark"
            options={{
              fontSize: 14,
              minimap: { enabled: false },
              smoothScrolling: true,
              automaticLayout: true,
            }}
          />
        </div>

        {isExpanded && (
          <aside className="w-[320px] flex-shrink-0 overflow-y-auto bg-[var(--bg-secondary)] p-4">
            <div>
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                Execution Output
              </h3>
              {lastRun ? (
                <div className="mt-3 space-y-3 text-xs text-[var(--text-secondary)]">
                  <div className="rounded-lg bg-[var(--bg-primary)] p-3">
                    <p className="font-semibold text-[var(--text-primary)]">
                      Status
                    </p>
                    <p className="mt-1">{lastRun.status}</p>
                  </div>
                  <div className="rounded-lg bg-[var(--bg-primary)] p-3">
                    <p className="font-semibold text-[var(--text-primary)]">
                      Stdout
                    </p>
                    <pre className="mt-1 whitespace-pre-wrap">
                      {lastRun.stdout || 'No output'}
                    </pre>
                  </div>
                  {lastRun.stderr && (
                    <div className="rounded-lg bg-[var(--bg-primary)] p-3">
                      <p className="font-semibold text-[var(--text-primary)]">
                        Stderr
                      </p>
                      <pre className="mt-1 whitespace-pre-wrap text-red-500">
                        {lastRun.stderr}
                      </pre>
                    </div>
                  )}
                </div>
              ) : (
                <p className="mt-3 text-xs text-[var(--text-muted)]">
                  Run your code to see output here.
                </p>
              )}
            </div>

            <div className="mt-6">
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                AI Feedback
              </h3>
              {feedback ? (
                <div className="mt-3 space-y-3 text-xs text-[var(--text-secondary)]">
                  <div className="rounded-lg bg-[var(--bg-primary)] p-3">
                    <p className="font-semibold text-[var(--text-primary)]">
                      Result
                    </p>
                    <p className="mt-1">
                      {feedback.correct ? 'Correct' : 'Needs revision'}
                    </p>
                  </div>
                  <div className="rounded-lg bg-[var(--bg-primary)] p-3">
                    <p className="font-semibold text-[var(--text-primary)]">
                      Feedback
                    </p>
                    <p className="mt-1 whitespace-pre-wrap">
                      {feedback.feedback}
                    </p>
                  </div>
                  {feedback.aiSuspected && (
                    <div className="rounded-lg bg-[var(--accent-orange)]/20 p-3 text-[var(--accent-orange)]">
                      Gemini detected signs of AI-generated code. Please attempt
                      the solution yourself.
                    </div>
                  )}
                </div>
              ) : (
                <p className="mt-3 text-xs text-[var(--text-muted)]">
                  Submit your code to receive detailed feedback and AI insights.
                </p>
              )}
            </div>
          </aside>
        )}
      </div>
    </section>
  );
};

export default PracticeRunner;
