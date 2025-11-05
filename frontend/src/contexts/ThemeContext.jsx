import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    // Get from localStorage or default to 'day'
    return localStorage.getItem('theme') || 'day';
  });

  useEffect(() => {
    // Apply theme class to document
    document.documentElement.classList.remove('day-mode', 'night-mode');
    document.documentElement.classList.add(`${theme}-mode`);
    
    // Save to localStorage
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'day' ? 'night' : 'day');
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};




