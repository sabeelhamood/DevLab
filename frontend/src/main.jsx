import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import { setupGlobalErrorHandlers } from './utils/errorHandler.js';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import './index.css';

// Initialize global error handlers
setupGlobalErrorHandlers();

if (import.meta.env.DEV && typeof window !== 'undefined') {
  const defaultDevToken =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJsZWFybmVyLTEyMyIsInJvbGUiOiJsZWFybmVyIiwiaWF0IjoxNzYyNTI5NzM4LCJleHAiOjE3NjUxMjE3Mzh9.Y2S1ToOotv8Y5J-1YKhp0rWnoElRJm5J_r6W8LbMbK4';

  if (!window.localStorage.getItem('auth-token')) {
    window.localStorage.setItem('auth-token', defaultDevToken);
  }
}

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById('root')).render(
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </ErrorBoundary>
);
