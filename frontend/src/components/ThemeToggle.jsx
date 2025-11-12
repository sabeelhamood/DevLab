import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className={`p-2 rounded-lg transition-all duration-300 hover:scale-110 flex items-center justify-center ${theme === 'day-mode' ? 'text-gray-400 hover:text-gray-600' : 'text-gray-400 hover:text-gray-300'}`}
      title={`Switch to ${theme === 'day-mode' ? 'night' : 'day'} mode`}
    >
      {theme === 'day-mode' ? (
        <Moon className="w-5 h-5" />
      ) : (
        <Sun className="w-5 h-5" />
      )}
    </button>
  );
};

export default ThemeToggle;
