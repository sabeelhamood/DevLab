import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import { setupGlobalErrorHandlers } from './utils/errorHandler.js';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import './index.css';

// Initialize global error handlers
setupGlobalErrorHandlers();

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById('root')).render(
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </ErrorBoundary>
);
