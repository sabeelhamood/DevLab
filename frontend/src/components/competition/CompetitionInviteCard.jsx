import { CalendarClock, MapPin, Trophy } from 'lucide-react';
import { cn } from '../../utils/cn.js';

const CompetitionInviteCard = ({ invitation, onAccept, onDecline, busyId }) => {
  const isProcessing = busyId === invitation.id;

  return (
    <article className="relative rounded-2xl border border-[var(--bg-tertiary)] bg-[var(--gradient-card)] p-5 shadow-md transition hover:shadow-lg">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-[var(--text-primary)]">
            {invitation.courseName}
          </h3>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Tailored challenge awaiting your skills.
          </p>
        </div>
        <div className="rounded-full bg-[var(--gradient-accent)] px-3 py-1 text-xs font-semibold text-white shadow">
          New Invite
        </div>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-3 text-xs text-[var(--text-muted)] md:grid-cols-3">
        <div className="flex items-center gap-2 rounded-lg bg-[var(--bg-primary)]/70 p-3">
          <Trophy className="h-4 w-4 text-[var(--accent-gold)]" />
          <div>
            <dt className="font-semibold text-[var(--text-primary)]">Mode</dt>
            <dd>{invitation.metadata?.mode || 'Head-to-head'}</dd>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-lg bg-[var(--bg-primary)]/70 p-3">
          <CalendarClock className="h-4 w-4 text-[var(--primary-cyan)]" />
          <div>
            <dt className="font-semibold text-[var(--text-primary)]">Timer</dt>
            <dd>{invitation.metadata?.timer || '00:30:00'}</dd>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-lg bg-[var(--bg-primary)]/70 p-3">
          <MapPin className="h-4 w-4 text-[var(--accent-green)]" />
          <div>
            <dt className="font-semibold text-[var(--text-primary)]">
              Skill Focus
            </dt>
            <dd>{invitation.metadata?.skills?.join(', ') || 'Adaptive'}</dd>
          </div>
        </div>
      </dl>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => onAccept(invitation)}
          disabled={isProcessing}
          className={cn(
            'inline-flex items-center gap-2 rounded-lg bg-[var(--gradient-secondary)] px-4 py-2 text-sm font-semibold text-white shadow transition hover:translate-y-[-1px] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--primary-cyan)]',
            isProcessing && 'opacity-70'
          )}
        >
          {isProcessing ? 'Joining...' : 'Accept Challenge'}
        </button>
        <button
          type="button"
          onClick={() => onDecline(invitation)}
          disabled={isProcessing}
          className="inline-flex items-center gap-2 rounded-lg border border-[var(--accent-orange)] px-4 py-2 text-sm font-semibold text-[var(--accent-orange)] transition hover:bg-[var(--accent-orange)] hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--accent-orange)]"
        >
          Decline
        </button>
      </div>
    </article>
  );
};

export default CompetitionInviteCard;
