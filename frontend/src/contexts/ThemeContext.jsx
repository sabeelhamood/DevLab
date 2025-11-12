import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // Check localStorage first, then system preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      return savedTheme === 'night-mode';
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    // Save theme preference to localStorage
    const themeMode = isDarkMode ? 'night-mode' : 'day-mode';
    localStorage.setItem('theme', themeMode);
    
    // Update CSS custom properties
    const root = document.documentElement;
    
    if (isDarkMode) {
      // Night mode theme variables
      root.style.setProperty('--bg-primary', '#0f172a');
      root.style.setProperty('--bg-secondary', '#1e293b');
      root.style.setProperty('--bg-tertiary', '#334155');
      root.style.setProperty('--text-primary', '#f8fafc');
      root.style.setProperty('--text-secondary', '#cbd5e1');
      root.style.setProperty('--text-tertiary', '#94a3b8');
      root.style.setProperty('--primary-green', '#059669');
      root.style.setProperty('--accent-green', '#10b981');
      root.style.setProperty('--accent-gold', '#f59e0b');
      root.style.setProperty('--primary-purple', '#8b5cf6');
      root.style.setProperty('--gradient-primary', 'linear-gradient(135deg, #059669, #047857)');
      root.style.setProperty('--gradient-secondary', 'linear-gradient(135deg, #0f766e, #0d9488)');
      root.style.setProperty('--gradient-accent', 'linear-gradient(135deg, #f59e0b, #d97706)');
      root.style.setProperty('--gradient-card', 'linear-gradient(135deg, #1e293b, #334155)');
      root.style.setProperty('--shadow-card', '0 10px 25px rgba(0, 0, 0, 0.3)');
      root.style.setProperty('--shadow-glow', '0 0 20px rgba(5, 150, 105, 0.3)');
    } else {
      // Day mode theme variables
      root.style.setProperty('--bg-primary', '#f8fafc');
      root.style.setProperty('--bg-secondary', '#e2e8f0');
      root.style.setProperty('--bg-tertiary', '#cbd5e1');
      root.style.setProperty('--text-primary', '#1e293b');
      root.style.setProperty('--text-secondary', '#475569');
      root.style.setProperty('--text-tertiary', '#64748b');
      root.style.setProperty('--primary-green', '#059669');
      root.style.setProperty('--accent-green', '#10b981');
      root.style.setProperty('--accent-gold', '#f59e0b');
      root.style.setProperty('--primary-purple', '#8b5cf6');
      root.style.setProperty('--gradient-primary', 'linear-gradient(135deg, #065f46, #047857)');
      root.style.setProperty('--gradient-secondary', 'linear-gradient(135deg, #0f766e, #047857)');
      root.style.setProperty('--gradient-accent', 'linear-gradient(135deg, #f59e0b, #d97706)');
      root.style.setProperty('--gradient-card', 'linear-gradient(135deg, #ffffff, #f0fdfa)');
      root.style.setProperty('--shadow-card', '0 10px 25px rgba(0, 0, 0, 0.1)');
      root.style.setProperty('--shadow-glow', '0 0 20px rgba(6, 95, 70, 0.2)');
    }
    
    // Update document class for additional styling
    document.documentElement.classList.remove('day-mode', 'night-mode');
    document.documentElement.classList.add(themeMode);
  }, [isDarkMode]);

  const toggleTheme = () => {
    setIsDarkMode(prev => !prev);
  };

  const value = {
    isDarkMode,
    toggleTheme,
    theme: isDarkMode ? 'night-mode' : 'day-mode'
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};


