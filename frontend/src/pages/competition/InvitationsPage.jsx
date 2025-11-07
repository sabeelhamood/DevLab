import {
  CompetitionInviteList,
  CompetitionAtmosphere,
} from '../../components/competition/index.js';
import LoadingSpinner from '../../components/LoadingSpinner.jsx';
import ErrorMessage from '../../components/ErrorMessage.jsx';
import useCompetitionInvitations from '../../hooks/useCompetitionInvitations.js';

const InvitationsPage = () => {
  const { invitationsQuery, busyId, accept, decline } =
    useCompetitionInvitations();

  if (invitationsQuery.isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <LoadingSpinner label="Syncing competition invitations..." />
      </div>
    );
  }

  if (invitationsQuery.isError) {
    return (
      <div className="flex h-full items-center justify-center">
        <ErrorMessage
          title="Unable to fetch invites"
          message={invitationsQuery.error?.message}
        />
      </div>
    );
  }

  return (
    <div className="relative h-full overflow-hidden bg-[var(--bg-primary)]">
      <CompetitionAtmosphere />
      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-10">
        <header className="flex flex-col gap-2">
          <p className="text-xs uppercase tracking-[0.3em] text-[var(--text-muted)]">
            Anonymous Arena
          </p>
          <h1 className="text-3xl font-semibold text-[var(--text-primary)]">
            Competition Invitations
          </h1>
          <p className="text-sm text-[var(--text-secondary)]">
            Select a challenge aligned with your recent course completion.
            Opponents remain anonymous to keep matches fair.
          </p>
        </header>

        <CompetitionInviteList
          invitations={invitationsQuery.data}
          onAccept={(invitation) => accept(invitation.id)}
          onDecline={(invitation) => decline(invitation.id)}
          busyId={busyId}
        />
      </div>
    </div>
  );
};

export default InvitationsPage;
