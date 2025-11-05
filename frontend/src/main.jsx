import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './styles/index.css';

// Build version marker - updated on each deployment
const BUILD_VERSION = '2024-01-15-v6-MANUAL-TRIGGER';
if (import.meta.env.PROD) {
  console.log(`🚀 DEVLAB Frontend - Build Version: ${BUILD_VERSION}`);
  console.log(`🌐 Environment: Production`);
  console.log(`📡 API URL: ${import.meta.env.VITE_API_URL || 'Using default Railway URL'}`);
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);




