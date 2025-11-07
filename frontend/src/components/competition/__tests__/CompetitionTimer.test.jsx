import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import CompetitionTimer from '../CompetitionTimer.jsx';

describe('CompetitionTimer', () => {
  it('renders formatted time from numeric seconds', () => {
    render(
      <CompetitionTimer remaining={125} total={300} onExpire={() => {}} />
    );
    expect(screen.getByText('02:05')).toBeInTheDocument();
  });

  it('parses string timers and calls onExpire when remaining hits zero', () => {
    const handleExpire = vi.fn();
    render(
      <CompetitionTimer
        remaining={0}
        total="00:30:00"
        onExpire={handleExpire}
      />
    );
    expect(handleExpire).toHaveBeenCalledTimes(1);
  });
});
