import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

const ThemeToggle = () => {
  const { isDarkMode, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="p-3 rounded-xl transition-all duration-300 hover:scale-105 flex items-center justify-center"
      style={{
        background: 'var(--gradient-card)',
        border: '2px solid rgba(6, 95, 70, 0.2)',
        boxShadow: 'var(--shadow-card)'
      }}
      title={`Switch to ${isDarkMode ? 'light' : 'dark'} mode`}
    >
      {isDarkMode ? (
        <Sun className="w-5 h-5" style={{ color: 'var(--text-primary)' }} />
      ) : (
        <Moon className="w-5 h-5" style={{ color: 'var(--text-primary)' }} />
      )}
    </button>
  );
};

export default ThemeToggle;
