import React from 'react'
import { AlertCircle, RefreshCw, Wifi, Clock } from 'lucide-react'

const ErrorMessage = ({ error, onRetry, isLoading = false }) => {
  const getErrorIcon = (errorMessage) => {
    if (errorMessage.includes('timeout') || errorMessage.includes('timed out')) {
      return <Clock className="h-5 w-5 text-orange-500" />
    }
    if (errorMessage.includes('connection') || errorMessage.includes('network')) {
      return <Wifi className="h-5 w-5 text-red-500" />
    }
    return <AlertCircle className="h-5 w-5 text-red-500" />
  }

  const getErrorType = (errorMessage) => {
    if (errorMessage.includes('timeout') || errorMessage.includes('timed out')) {
      return 'timeout'
    }
    if (errorMessage.includes('connection') || errorMessage.includes('network')) {
      return 'connection'
    }
    return 'general'
  }

  const getErrorColor = (errorType) => {
    switch (errorType) {
      case 'timeout':
        return 'bg-orange-50 border-orange-200 text-orange-800'
      case 'connection':
        return 'bg-red-50 border-red-200 text-red-800'
      default:
        return 'bg-red-50 border-red-200 text-red-800'
    }
  }

  const getErrorTitle = (errorType) => {
    switch (errorType) {
      case 'timeout':
        return 'Request Timeout'
      case 'connection':
        return 'Connection Lost'
      default:
        return 'Error Occurred'
    }
  }

  const getErrorSuggestion = (errorType) => {
    switch (errorType) {
      case 'timeout':
        return 'The request is taking longer than expected. This might be due to high server load or network issues.'
      case 'connection':
        return 'Please check your internet connection and try again.'
      default:
        return 'An unexpected error occurred. Please try again.'
    }
  }

  const errorType = getErrorType(error)
  const errorColor = getErrorColor(errorType)

  return (
    <div className={`rounded-lg border p-4 ${errorColor}`}>
      <div className="flex items-start">
        {getErrorIcon(error)}
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium">
            {getErrorTitle(errorType)}
          </h3>
          <div className="mt-2 text-sm">
            <p className="mb-2">{error}</p>
            <p className="text-xs opacity-75">
              {getErrorSuggestion(errorType)}
            </p>
          </div>
          {onRetry && (
            <div className="mt-4">
              <button
                onClick={onRetry}
                disabled={isLoading}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Retrying...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Try Again
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ErrorMessage






