import { NavLink } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore.js'
import { useTheme } from '../../contexts/ThemeContext.jsx'
import { 
  Home, 
  BookOpen, 
  Trophy, 
  BarChart3, 
  Settings, 
  Users,
  Monitor,
  HelpCircle
} from 'lucide-react'
import { cn } from '../../utils/cn.js'

const navigation = {
  learner: [
    { name: 'Dashboard', href: '/', icon: Home },
    { name: 'Practice', href: '/practice', icon: BookOpen },
    { name: 'Competition', href: '/competitions', icon: Trophy },
    { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  ],
  trainer: [
    { name: 'Dashboard', href: '/trainer', icon: Home },
    { name: 'Questions', href: '/trainer/questions', icon: BookOpen },
    { name: 'Analytics', href: '/trainer/analytics', icon: BarChart3 },
    { name: 'Settings', href: '/trainer/settings', icon: Settings },
  ],
  admin: [
    { name: 'Dashboard', href: '/admin', icon: Home },
    { name: 'Users', href: '/admin/users', icon: Users },
    { name: 'Monitoring', href: '/admin/monitoring', icon: Monitor },
    { name: 'Settings', href: '/admin/settings', icon: Settings },
  ]
}

export default function Sidebar() {
  const { user } = useAuthStore()
  const { theme } = useTheme()
  
  if (!user) return null

  const userNavigation = navigation[user.role] || navigation.learner

  return (
    <div 
      className={`w-64 shadow-lg border-r transition-all duration-300 ${theme === 'day-mode' ? 'bg-white border-gray-200' : 'bg-gray-800 border-gray-600'}`}
    >
      <nav className="mt-6 px-3">
        <div className="space-y-1">
          {userNavigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive }) =>
                cn(
                  'group flex items-center px-4 py-3 text-sm font-semibold rounded-lg transition-all duration-300 relative overflow-hidden',
                  isActive
                    ? 'text-white shadow-lg'
                    : theme === 'day-mode' 
                      ? 'hover:bg-gray-100 text-gray-700' 
                      : 'hover:bg-gray-700 text-gray-300'
                )
              }
              style={({ isActive }) => ({
                background: isActive ? 'var(--gradient-primary)' : 'transparent',
                color: isActive ? 'white' : undefined,
                boxShadow: isActive ? 'var(--shadow-glow)' : 'none'
              })}
            >
              {({ isActive }) => (
                <>
                  <item.icon
                    className={cn(
                      'mr-3 h-5 w-5 flex-shrink-0 transition-colors',
                      isActive ? 'text-white' : theme === 'day-mode' ? 'text-gray-500 group-hover:text-emerald-600' : 'text-gray-400 group-hover:text-emerald-400'
                    )}
                  />
                  {item.name}
                  {isActive && (
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-20 animate-pulse"></div>
                  )}
                </>
              )}
            </NavLink>
          ))}
        </div>
        
        <div 
          className={`mt-8 pt-6 ${theme === 'day-mode' ? 'border-t border-gray-200' : 'border-t border-gray-700'}`}
        >
          <NavLink
            to="/help"
            className={`flex items-center px-4 py-3 text-sm font-semibold rounded-lg transition-all duration-300 ${theme === 'day-mode' ? 'hover:bg-gray-100 text-gray-700' : 'hover:bg-gray-700 text-gray-300'}`}
          >
            <HelpCircle className={`mr-3 h-5 w-5 ${theme === 'day-mode' ? 'text-gray-500' : 'text-gray-400'}`} />
            Help & Support
          </NavLink>
        </div>
      </nav>
    </div>
  )
}