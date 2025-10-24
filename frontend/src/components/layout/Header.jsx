import { useAuthStore } from '../../store/authStore.js'
import { Bell, User, LogOut, Sun, Moon } from 'lucide-react'
import Button from '../ui/Button.jsx'
import { useState } from 'react'

export default function Header() {
  const { user, logout } = useAuthStore()
  const [isDarkMode, setIsDarkMode] = useState(false)

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode)
    document.documentElement.classList.toggle('night-mode')
    document.documentElement.classList.toggle('day-mode')
  }

  return (
    <header 
      className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl border-b transition-all duration-300"
      style={{ 
        background: 'rgba(255, 255, 255, 0.95)',
        borderColor: 'rgba(0, 0, 0, 0.1)'
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
                backgroundClip: 'text'
              }}
            >
              DEVLAB
            </h1>
            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              AI-Powered Learning Platform
            </span>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Theme Toggle */}
            <button 
              onClick={toggleTheme}
              className="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110"
              style={{ 
                background: 'var(--bg-tertiary)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: 'var(--text-primary)'
              }}
            >
              {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
            
            <button 
              className="p-2 transition-colors hover:scale-110"
              style={{ color: 'var(--text-secondary)' }}
            >
              <Bell className="h-5 w-5" />
            </button>
            
            <div className="flex items-center space-x-3">
              <div className="text-right">
                <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                  {user?.name}
                </p>
                <p className="text-xs capitalize" style={{ color: 'var(--text-secondary)' }}>
                  {user?.role}
                </p>
              </div>
              
              <div className="flex items-center space-x-2">
                <div 
                  className="h-10 w-10 rounded-full flex items-center justify-center text-white font-semibold relative animate-pulse"
                  style={{ background: 'var(--gradient-primary)' }}
                >
                  <User className="h-5 w-5" />
                </div>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={logout}
                  className="transition-all duration-300 hover:scale-110"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}