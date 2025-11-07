import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import CompetitionInviteCard from '../CompetitionInviteCard.jsx';

const invitation = {
  id: 'invite-1',
  courseName: 'Advanced Algorithms',
  metadata: {
    mode: 'Head-to-head',
    timer: '00:30:00',
    skills: ['graphs'],
  },
};

describe('CompetitionInviteCard', () => {
  it('invokes callbacks on accept and decline', () => {
    const onAccept = vi.fn();
    const onDecline = vi.fn();

    render(
      <CompetitionInviteCard
        invitation={invitation}
        onAccept={onAccept}
        onDecline={onDecline}
        busyId={null}
      />
    );

    fireEvent.click(screen.getByText(/Accept Challenge/i));
    expect(onAccept).toHaveBeenCalledWith(invitation);

    fireEvent.click(screen.getByText(/Decline/i));
    expect(onDecline).toHaveBeenCalledWith(invitation);
  });
});
