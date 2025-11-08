import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import { setupGlobalErrorHandlers } from './utils/errorHandler.js'
import './index.css'

// Initialize global error handlers
setupGlobalErrorHandlers()

ReactDOM.createRoot(document.getElementById('root')).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
)