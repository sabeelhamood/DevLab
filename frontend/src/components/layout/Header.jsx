import { Bell, User } from 'lucide-react';
import ThemeToggle from '../ThemeToggle.jsx';

export default function Header() {
  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl border-b transition-all duration-300"
      style={{
        background: 'var(--bg-primary)',
        borderColor: 'rgba(6, 95, 70, 0.2)',
        boxShadow: 'var(--shadow-card)',
      }}
    >
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1
              className="text-2xl font-bold font-display"
              style={{
                background: 'var(--gradient-primary)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              DevLab
            </h1>
            <span
              className="text-sm"
              style={{ color: 'var(--text-secondary)' }}
            >
              Learning Platform
            </span>
          </div>

          <div className="flex items-center space-x-4">
            {/* Theme Toggle */}
            <ThemeToggle />

            <button
              className="p-2 transition-colors hover:scale-110"
              style={{ color: 'var(--text-secondary)' }}
            >
              <Bell className="h-5 w-5" />
            </button>

            <div className="flex items-center space-x-2">
              <div
                className="h-10 w-10 rounded-full flex items-center justify-center text-white font-semibold relative animate-pulse"
                style={{ background: 'var(--gradient-primary)' }}
              >
                <User className="h-5 w-5" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
