import { useMemo } from 'react';
import CompetitionInviteCard from './CompetitionInviteCard.jsx';

const CompetitionInviteList = ({
  invitations,
  onAccept,
  onDecline,
  busyId,
}) => {
  const sortedInvites = useMemo(() => {
    return [...(invitations || [])].sort((a, b) =>
      a.createdAt < b.createdAt ? 1 : -1
    );
  }, [invitations]);

  if (!sortedInvites.length) {
    return (
      <div className="rounded-2xl border border-[var(--bg-tertiary)] bg-[var(--bg-card)] p-10 text-center shadow">
        <p className="text-lg font-semibold text-[var(--text-primary)]">
          No invitations right now
        </p>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          Keep practicing—new challenges will appear once your peers complete
          their courses.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
      {sortedInvites.map((invitation) => (
        <CompetitionInviteCard
          key={invitation.id}
          invitation={invitation}
          onAccept={onAccept}
          onDecline={onDecline}
          busyId={busyId}
        />
      ))}
    </div>
  );
};

export default CompetitionInviteList;
