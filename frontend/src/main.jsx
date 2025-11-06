import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './styles/index.css';

// Build version marker - updated on each deployment
const BUILD_VERSION = '2024-01-15-v16-AUTO-DEPLOY-FIXED';
if (import.meta.env.PROD) {
  console.log(`🚀 DEVLAB Frontend - Build Version: ${BUILD_VERSION}`);
  console.log(`🌐 Environment: Production`);
  console.log(`📡 API URL: ${import.meta.env.VITE_API_URL || 'Using default Railway URL'}`);
  console.log(`🌐 Frontend URL: ${window.location.origin}`);
  console.log(`🔧 Environment: ${import.meta.env.MODE}`);
  
  // Check backend health on startup
  const checkBackendHealth = async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'https://devlab-backend-production-0bcb.up.railway.app';
      const response = await fetch(`${apiUrl}/api/health/detailed`);
      const health = await response.json();
      console.log('🏥 Backend Health:', health);
      if (health.services?.gemini === 'not configured') {
        console.warn('⚠️ Gemini API is not configured in backend. Questions will use mock data.');
      } else if (health.services?.gemini === 'configured') {
        console.log('✅ Gemini API is configured in backend.');
      }
    } catch (error) {
      console.error('❌ Failed to check backend health:', error);
    }
  };
  
  // Check backend health after a short delay
  setTimeout(checkBackendHealth, 1000);
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);




