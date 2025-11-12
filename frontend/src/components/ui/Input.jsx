import { forwardRef } from 'react'
import { cn } from '../../utils/cn.js'
import { useTheme } from '../../contexts/ThemeContext.jsx'

const Input = forwardRef(
  ({ className, type, label, error, helperText, ...props }, ref) => {
    const { theme } = useTheme()
    return (
      <div className="space-y-2">
        {label && (
          <label 
            className="text-sm font-medium"
            style={{ 
              background: 'var(--gradient-primary)', 
              WebkitBackgroundClip: 'text', 
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}
          >
            {label}
          </label>
        )}
        <input
          type={type}
          className={cn(
            'flex h-10 w-full rounded-lg border px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-colors',
            theme === 'day-mode' 
              ? 'border-gray-300 bg-white text-gray-900 placeholder-gray-500' 
              : 'border-gray-600 bg-gray-700 text-white placeholder-gray-400',
            error && 'border-red-500 focus-visible:ring-red-500',
            className
          )}
          ref={ref}
          {...props}
        />
        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}
        {helperText && !error && (
          <p className={`text-sm ${theme === 'day-mode' ? 'text-gray-500' : 'text-gray-400'}`}>{helperText}</p>
        )}
      </div>
    )
  }
)
Input.displayName = 'Input'

export default Input