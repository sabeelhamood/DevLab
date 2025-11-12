import { forwardRef } from 'react'
import { cn } from '../../utils/cn.js'
import { useTheme } from '../../contexts/ThemeContext.jsx'

const Button = forwardRef(
  ({ className, variant = 'primary', size = 'md', isLoading, children, disabled, ...props }, ref) => {
    const { theme } = useTheme()
    const baseClasses = 'inline-flex items-center justify-center rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none'
    
    const variants = {
      primary: theme === 'day-mode' 
        ? 'bg-emerald-600 text-white hover:bg-emerald-700' 
        : 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-lg',
      secondary: theme === 'day-mode'
        ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        : 'bg-emerald-600/20 text-emerald-100 hover:bg-emerald-600/30 border border-emerald-500/30',
      outline: theme === 'day-mode'
        ? 'border border-emerald-600 text-emerald-600 hover:bg-emerald-50'
        : 'border border-emerald-500/30 text-emerald-100 hover:bg-emerald-600/20',
      ghost: theme === 'day-mode'
        ? 'hover:bg-gray-100 text-gray-700'
        : 'hover:bg-gray-700 text-gray-300',
      destructive: 'bg-red-600 text-white hover:bg-red-700'
    }
    
    const sizes = {
      sm: 'h-9 px-3 text-sm',
      md: 'h-10 px-4 py-2',
      lg: 'h-11 px-8 text-lg'
    }

    return (
      <button
        className={cn(
          baseClasses,
          variants[variant],
          sizes[size],
          className
        )}
        ref={ref}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && (
          <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        )}
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'

export default Button