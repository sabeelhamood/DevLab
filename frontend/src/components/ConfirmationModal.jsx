import { AlertTriangle, X } from 'lucide-react'
import { useTheme } from '../contexts/ThemeContext.jsx'

const ConfirmationModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'warning'
}) => {
  const { theme } = useTheme()
  
  if (!isOpen) return null

  const getTypeStyles = (type) => {
    switch (type) {
      case 'warning':
        return {
          icon: <AlertTriangle className="h-6 w-6 text-orange-500" />,
          button: 'bg-orange-600 hover:bg-orange-700 focus:ring-orange-500'
        }
      case 'danger':
        return {
          icon: <AlertTriangle className="h-6 w-6 text-red-500" />,
          button: 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
        }
      default:
        return {
          icon: <AlertTriangle className="h-6 w-6 text-emerald-500" />,
          button: theme === 'day-mode' 
            ? 'bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-500' 
            : 'bg-emerald-500 hover:bg-emerald-600 focus:ring-emerald-500'
        }
    }
  }

  const typeStyles = getTypeStyles(type)

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={handleBackdropClick}>
      <div className={`rounded-2xl shadow-2xl max-w-md w-full mx-4 ${theme === 'day-mode' ? 'bg-white' : 'bg-gray-800'}`}>
        <div className="p-6">
          <div className={`flex items-center justify-between mb-4 ${theme === 'day-mode' ? 'border-b border-gray-200' : 'border-b border-gray-700'} pb-4`}>
            <div className="flex items-center">
              {typeStyles.icon}
              <h3 
                className={`ml-3 text-lg font-semibold ${theme === 'day-mode' ? 'text-gray-900' : 'text-white'}`}
                style={{ 
                  background: 'var(--gradient-primary)', 
                  WebkitBackgroundClip: 'text', 
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}
              >
                {title}
              </h3>
            </div>
            <button
              onClick={onClose}
              className={`p-2 rounded-lg transition-colors ${theme === 'day-mode' ? 'text-gray-400 hover:text-gray-600' : 'text-gray-400 hover:text-gray-300'}`}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          
          <div className="mb-6">
            <p className={`text-sm ${theme === 'day-mode' ? 'text-gray-600' : 'text-gray-300'}`}>
              {message}
            </p>
          </div>
          
          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${theme === 'day-mode' ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' : 'bg-emerald-600/20 text-emerald-100 hover:bg-emerald-600/30 border border-emerald-500/30'}`}
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              className={`px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${typeStyles.button}`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ConfirmationModal








