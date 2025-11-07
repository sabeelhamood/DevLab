import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { AlertTriangle } from 'lucide-react';

const PracticeRevealDialog = ({ open, onClose, question }) => {
  if (!question) return null;

  return (
    <Transition show={open} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/40" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-xl transform overflow-hidden rounded-2xl bg-[var(--bg-card)] p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title
                  as="h3"
                  className="flex items-center gap-2 text-lg font-semibold text-[var(--text-primary)]"
                >
                  <AlertTriangle className="h-5 w-5 text-[var(--accent-orange)]" />
                  Reveal Solution
                </Dialog.Title>
                <div className="mt-2 text-sm text-[var(--text-secondary)]">
                  Are you sure you want to reveal the full solution? Once
                  revealed, it's best to revisit the question on your own to
                  reinforce learning.
                </div>

                {question.solution && (
                  <div className="mt-4 rounded-xl border border-[var(--bg-tertiary)] bg-[var(--bg-secondary)] p-4 text-sm text-[var(--text-secondary)]">
                    <pre className="whitespace-pre-wrap text-[var(--text-primary)]">
                      {question.solution}
                    </pre>
                    {question.explanation && (
                      <p className="mt-3 text-[var(--text-secondary)]">
                        {question.explanation}
                      </p>
                    )}
                  </div>
                )}

                <div className="mt-6 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="rounded-lg border border-[var(--bg-tertiary)] px-4 py-2 text-sm font-semibold text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]"
                  >
                    Keep Practicing
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default PracticeRevealDialog;
