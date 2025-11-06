import { Link } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext.jsx';

const Header = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="fixed top-0 left-0 right-0 bg-bg-card backdrop-blur-lg border-b border-gray-200 dark:border-gray-700 z-50">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link to="/" className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              DEVLAB
            </Link>
          </div>
          
          <div className="flex items-center gap-4">
            <Link
              to="/practice"
              className="text-text-secondary hover:text-text-primary px-3 py-2 rounded-md text-sm font-medium transition-colors"
            >
              Practice
            </Link>
            <Link
              to="/competition"
              className="text-text-secondary hover:text-text-primary px-3 py-2 rounded-md text-sm font-medium transition-colors"
            >
              Competition
            </Link>
            
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full bg-bg-secondary hover:bg-bg-tertiary transition-colors"
              aria-label="Toggle theme"
            >
              {theme === 'day' ? '🌙' : '☀️'}
            </button>
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Header;





