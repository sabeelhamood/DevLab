/**
 * API Client Setup
 * Axios instance with base configuration
 */

import axios from 'axios';

// API URL Configuration:
// - Production (Vercel): Uses Railway backend URL from VITE_API_URL env var
// - Local Development: Uses localhost:3001 or VITE_API_URL from .env.local
// NOTE: Automatically strips trailing /api if present to prevent double /api paths
const getApiUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  const fallbackUrl = import.meta.env.PROD 
    ? 'https://devlab-backend-production-0bcb.up.railway.app' 
    : 'http://localhost:3001';
  
  const baseUrl = envUrl || fallbackUrl;
  
  // Remove trailing /api if present (frontend services already add /api/ to paths)
  return baseUrl.replace(/\/api\/?$/, '');
};

const API_URL = getApiUrl();

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 30000 // 30 seconds
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle errors globally
    if (error.response?.status === 401) {
      // Handle unauthorized
      localStorage.removeItem('token');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

export default api;



