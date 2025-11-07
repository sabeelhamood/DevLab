import axios from 'axios';
import toast from 'react-hot-toast';

const FALLBACK_LEARNER_TOKEN = import.meta.env.VITE_PUBLIC_LEARNER_TOKEN || '';

const getAuthToken = () => {
  if (typeof window === 'undefined') {
    return null;
  }

  const storedToken = localStorage.getItem('auth-token');
  if (storedToken) {
    return storedToken;
  }

  if (FALLBACK_LEARNER_TOKEN) {
    localStorage.setItem('auth-token', FALLBACK_LEARNER_TOKEN);
    return FALLBACK_LEARNER_TOKEN;
  }

  return null;
};

class ApiClient {
  constructor() {
    this.client = axios.create({
      baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001/api',
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  setupInterceptors() {
    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        const token = getAuthToken();
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
    this.client.interceptors.response.use(
      (response) => {
        return response;
      },
      (error) => {
        if (error.response?.status === 401 && typeof window !== 'undefined') {
          localStorage.removeItem('auth-token');
        }

        if (error.response?.status >= 500) {
          toast.error('Server error. Please try again later.');
        }

        return Promise.reject(error);
      }
    );
  }

  async get(url, config) {
    const response = await this.client.get(url, config);
    return response;
  }

  async post(url, data, config) {
    const response = await this.client.post(url, data, config);
    return response;
  }

  async put(url, data, config) {
    const response = await this.client.put(url, data, config);
    return response;
  }

  async delete(url, config) {
    const response = await this.client.delete(url, config);
    return response;
  }

  async patch(url, data, config) {
    const response = await this.client.patch(url, data, config);
    return response;
  }
}

export const apiClient = new ApiClient();
export default apiClient;
