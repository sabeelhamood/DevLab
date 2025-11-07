import { useEffect, useMemo } from 'react';

const formatTime = (seconds) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

const resolveTotalSeconds = (total) => {
  if (typeof total === 'number') return total;
  if (typeof total !== 'string') return 0;
  const parts = total.split(':').map(Number);
  if (parts.length !== 3) return 0;
  const [hours, minutes, seconds] = parts;
  return hours * 3600 + minutes * 60 + seconds;
};

const CompetitionTimer = ({ remaining, total, onExpire }) => {
  const totalSeconds = useMemo(() => resolveTotalSeconds(total), [total]);
  const percentage = useMemo(() => {
    if (!totalSeconds) return 0;
    return Math.max(0, Math.min(100, (remaining / totalSeconds) * 100));
  }, [remaining, totalSeconds]);

  useEffect(() => {
    if (remaining === 0 && onExpire) {
      onExpire();
    }
  }, [remaining, onExpire]);

  return (
    <div className="w-full rounded-xl border border-[var(--bg-tertiary)] bg-[var(--bg-primary)] p-4 shadow">
      <div className="flex items-center justify-between text-xs font-semibold text-[var(--text-secondary)]">
        <span>Unified Timer</span>
        <span className="text-sm text-[var(--text-primary)]">
          {formatTime(remaining)}
        </span>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-[var(--bg-tertiary)]">
        <div
          className="h-full rounded-full bg-[var(--gradient-accent)] transition-all"
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    </div>
  );
};

export default CompetitionTimer;
