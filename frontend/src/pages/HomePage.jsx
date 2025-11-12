import { Link } from 'react-router-dom'
import { useTheme } from '../contexts/ThemeContext.jsx'

function HomePage() {
  const { theme } = useTheme()

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      {/* Hero Section */}
      <section className="hero py-20 px-4">
        <div className="hero-container max-w-6xl mx-auto">
          <div className="hero-content">
            <h1 
              className="text-5xl text-center md:text-6xl font-bold mb-6 leading-tight" 
              style={{ 
                background: 'var(--gradient-primary)', 
                WebkitBackgroundClip: 'text', 
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              DEVLAB
            </h1>
            <p className={`subtitle text-xl mb-8 text-center ${theme === 'day-mode' ? 'text-gray-600' : 'text-gray-300'}`}>
              Master Your Skills with AI-Powered Learning Platform
            </p>
            <p className={`text-lg mb-8 text-center max-w-2xl mx-auto ${theme === 'day-mode' ? 'text-gray-600' : 'text-gray-400'}`}>
              Interactive AI-powered practice for coding and theoretical questions.
            </p>
            <div className="flex gap-4 justify-center">
              <Link 
                to="/register" 
                className={`px-8 py-3 rounded-lg font-semibold transition-colors ${theme === 'day-mode' ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg'}`}
              >
                Get Started
              </Link>
              <Link 
                to="/login" 
                className={`px-8 py-3 rounded-lg font-semibold transition-colors ${theme === 'day-mode' ? 'border-2 border-emerald-600 text-emerald-600 hover:bg-emerald-50' : 'bg-emerald-600/20 text-emerald-100 hover:bg-emerald-600/30 border border-emerald-500/30'}`}
              >
                Login
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className={`py-20 px-4 ${theme === 'day-mode' ? 'bg-white' : 'bg-gray-800'}`}>
        <div className="max-w-6xl mx-auto">
          <h2 
            className="text-4xl font-bold text-center mb-12"
            style={{ 
              background: 'var(--gradient-primary)', 
              WebkitBackgroundClip: 'text', 
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}
          >
            Why Choose DEVLAB?
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className={`text-center p-6 rounded-2xl shadow-lg ${theme === 'day-mode' ? 'bg-emerald-50' : 'bg-gray-700'}`}>
              <div className="text-4xl mb-4">💡</div>
              <h3 className={`text-xl font-semibold mb-3 ${theme === 'day-mode' ? 'text-gray-900' : 'text-white'}`}>AI-Powered Learning</h3>
              <p className={theme === 'day-mode' ? 'text-gray-600' : 'text-gray-300'}>
                Dynamic questions, personalized feedback, and intelligent hints powered by Gemini.
              </p>
            </div>
            <div className={`text-center p-6 rounded-2xl shadow-lg ${theme === 'day-mode' ? 'bg-emerald-50' : 'bg-gray-700'}`}>
              <div className="text-4xl mb-4">💻</div>
              <h3 className={`text-xl font-semibold mb-3 ${theme === 'day-mode' ? 'text-gray-900' : 'text-white'}`}>Secure Code Sandbox</h3>
              <p className={theme === 'day-mode' ? 'text-gray-600' : 'text-gray-300'}>
                Practice coding in a safe, isolated environment supporting multiple languages.
              </p>
            </div>
            <div className={`text-center p-6 rounded-2xl shadow-lg ${theme === 'day-mode' ? 'bg-emerald-50' : 'bg-gray-700'}`}>
              <div className="text-4xl mb-4">🏆</div>
              <h3 className={`text-xl font-semibold mb-3 ${theme === 'day-mode' ? 'text-gray-900' : 'text-white'}`}>Anonymous Competitions</h3>
              <p className={theme === 'day-mode' ? 'text-gray-600' : 'text-gray-300'}>
                Challenge peers and climb leaderboards without revealing your identity.
              </p>
            </div>
            <div className={`text-center p-6 rounded-2xl shadow-lg ${theme === 'day-mode' ? 'bg-emerald-50' : 'bg-gray-700'}`}>
              <div className="text-4xl mb-4">📈</div>
              <h3 className={`text-xl font-semibold mb-3 ${theme === 'day-mode' ? 'text-gray-900' : 'text-white'}`}>Skill-Based Progression</h3>
              <p className={theme === 'day-mode' ? 'text-gray-600' : 'text-gray-300'}>
                Exercises tailored to your macro and nano skills, ensuring targeted development.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Dashboard Preview */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 
            className="text-4xl font-bold text-center mb-12"
            style={{ 
              background: 'var(--gradient-primary)', 
              WebkitBackgroundClip: 'text', 
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}
          >
            What You'll Find
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className={`p-8 rounded-2xl shadow-lg ${theme === 'day-mode' ? 'bg-white' : 'bg-gray-800'}`}>
              <h3 className={`text-2xl font-semibold mb-4 ${theme === 'day-mode' ? 'text-gray-900' : 'text-white'}`}>📚 Courses & Topics</h3>
              <p className={`mb-6 ${theme === 'day-mode' ? 'text-gray-600' : 'text-gray-300'}`}>Structured learning paths with detailed sub-topics.</p>
              <Link 
                to="/dashboard" 
                className={`px-6 py-3 rounded-lg font-semibold transition-colors inline-block ${theme === 'day-mode' ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg'}`}
              >
                View Courses
              </Link>
            </div>
            <div className={`p-8 rounded-2xl shadow-lg ${theme === 'day-mode' ? 'bg-white' : 'bg-gray-800'}`}>
              <h3 className={`text-2xl font-semibold mb-4 ${theme === 'day-mode' ? 'text-gray-900' : 'text-white'}`}>📝 Practice Sessions</h3>
              <p className={`mb-6 ${theme === 'day-mode' ? 'text-gray-600' : 'text-gray-300'}`}>Interactive coding and theoretical exercises.</p>
              <button className={`px-6 py-3 rounded-lg font-semibold transition-colors ${theme === 'day-mode' ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg'}`}>
                Start Practice
              </button>
            </div>
            <div className={`p-8 rounded-2xl shadow-lg ${theme === 'day-mode' ? 'bg-white' : 'bg-gray-800'}`}>
              <h3 className={`text-2xl font-semibold mb-4 ${theme === 'day-mode' ? 'text-gray-900' : 'text-white'}`}>⚡ Live Competition</h3>
              <p className={`mb-6 ${theme === 'day-mode' ? 'text-gray-600' : 'text-gray-300'}`}>Compete with other learners in real-time coding battles</p>
              <button className={`px-6 py-3 rounded-lg font-semibold transition-colors ${theme === 'day-mode' ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg'}`}>
                Join Now
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default HomePage


