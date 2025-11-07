import { useEffect, useRef, useState, useMemo } from 'react';
import { Sparkles, Volume2, VolumeX } from 'lucide-react';
import { cn } from '../../utils/cn.js';

const particles = Array.from({ length: 12 }).map((_, index) => ({
  left: (index * 37) % 100,
  top: (index * 19) % 100,
  delay: (index * 0.45) % 5,
}));

const CompetitionAtmosphere = () => {
  const [muted, setMuted] = useState(true);
  const audioRef = useRef(null);

  useEffect(() => {
    if (!audioRef.current) return;
    if (muted) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(() => setMuted(true));
    }
  }, [muted]);

  const AmbientIcon = useMemo(() => (muted ? VolumeX : Volume2), [muted]);

  return (
    <div className="relative" aria-hidden>
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="particle-bg"></div>
        {particles.map(({ left, top, delay }, index) => (
          <Sparkles
            key={`particle-${index}`}
            className="absolute text-[var(--accent-gold)] opacity-30 animate-float"
            style={{
              left: `${left}%`,
              top: `${top}%`,
              animationDelay: `${delay}s`,
            }}
            aria-hidden
          />
        ))}
      </div>
      <button
        type="button"
        onClick={() => setMuted((prev) => !prev)}
        aria-pressed={!muted}
        aria-label={
          muted
            ? 'Enable ambient competition audio'
            : 'Mute ambient competition audio'
        }
        className={cn(
          'absolute right-4 top-4 z-10 flex items-center gap-2 rounded-full border border-[var(--bg-tertiary)] bg-[var(--bg-primary)]/80 px-3 py-1 text-xs font-semibold text-[var(--text-primary)] shadow-md backdrop-blur',
          'hover:border-[var(--primary-cyan)] hover:text-[var(--primary-cyan)]'
        )}
      >
        <AmbientIcon className="h-4 w-4" aria-hidden />
        <span className="sr-only">
          {muted ? 'Ambient sound disabled' : 'Ambient sound enabled'}
        </span>
        <span aria-hidden>Ambient {muted ? 'Off' : 'On'}</span>
      </button>
      <audio ref={audioRef} loop muted={muted} preload="auto">
        <source src="/sounds/competition-ambience.mp3" type="audio/mpeg" />
      </audio>
    </div>
  );
};

export default CompetitionAtmosphere;
