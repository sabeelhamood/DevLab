import { forwardRef } from 'react'
import { cn } from '../../utils/cn.js'
import { useTheme } from '../../contexts/ThemeContext.jsx'

const Card = forwardRef(
  ({ className, ...props }, ref) => {
    const { theme } = useTheme()
    return (
      <div
        ref={ref}
        className={cn(
          'rounded-2xl shadow-lg transition-all duration-300',
          theme === 'day-mode' 
            ? 'border border-gray-200 bg-white text-gray-900' 
            : 'border border-gray-600 bg-gray-800 text-white',
          className
        )}
        {...props}
      />
    )
  }
)
Card.displayName = 'Card'

const CardHeader = forwardRef(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex flex-col space-y-1.5 p-6', className)}
      {...props}
    />
  )
)
CardHeader.displayName = 'CardHeader'

const CardTitle = forwardRef(
  ({ className, ...props }, ref) => {
    return (
      <h3
        ref={ref}
        className={cn(
          'text-2xl font-semibold leading-none tracking-tight',
          className
        )}
        style={{ 
          background: 'var(--gradient-primary)', 
          WebkitBackgroundClip: 'text', 
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text'
        }}
        {...props}
      />
    )
  }
)
CardTitle.displayName = 'CardTitle'

const CardDescription = forwardRef(
  ({ className, ...props }, ref) => {
    const { theme } = useTheme()
    return (
      <p
        ref={ref}
        className={cn(`text-sm ${theme === 'day-mode' ? 'text-gray-600' : 'text-gray-400'}`, className)}
        {...props}
      />
    )
  }
)
CardDescription.displayName = 'CardDescription'

const CardContent = forwardRef(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('p-6 pt-0', className)} {...props} />
  )
)
CardContent.displayName = 'CardContent'

const CardFooter = forwardRef(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex items-center p-6 pt-0', className)}
      {...props}
    />
  )
)
CardFooter.displayName = 'CardFooter'

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }

