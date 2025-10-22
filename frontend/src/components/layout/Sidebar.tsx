import { NavLink } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
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
import { cn } from '../../utils/cn'

const navigation = {
  learner: [
    { name: 'Dashboard', href: '/', icon: Home },
    { name: 'Practice', href: '/practice', icon: BookOpen },
    { name: 'Competition', href: '/competition', icon: Trophy },
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
  
  if (!user) return null

  const userNavigation = navigation[user.role] || navigation.learner

  return (
    <div className="w-64 bg-white shadow-sm border-r border-gray-200">
      <nav className="mt-6 px-3">
        <div className="space-y-1">
          {userNavigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive }) =>
                cn(
                  'group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
                  isActive
                    ? 'bg-primary-100 text-primary-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                )
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon
                    className={cn(
                      'mr-3 h-5 w-5 flex-shrink-0',
                      isActive ? 'text-primary-500' : 'text-gray-400 group-hover:text-gray-500'
                    )}
                  />
                  {item.name}
                </>
              )}
            </NavLink>
          ))}
        </div>
        
        <div className="mt-8 pt-6 border-t border-gray-200">
          <NavLink
            to="/help"
            className="flex items-center px-3 py-2 text-sm font-medium text-gray-600 rounded-md hover:bg-gray-50 hover:text-gray-900 transition-colors"
          >
            <HelpCircle className="mr-3 h-5 w-5 text-gray-400" />
            Help & Support
          </NavLink>
        </div>
      </nav>
    </div>
  )
}
