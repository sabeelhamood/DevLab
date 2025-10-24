import axios from 'axios'
import toast from 'react-hot-toast'

class ApiClient {
  constructor() {
    this.client = axios.create({
      baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    this.setupInterceptors()
  }

  setupInterceptors() {
    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('auth-token')
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }
        return config
      },
      (error) => {
        return Promise.reject(error)
      }
    )

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => {
        return response
      },
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('auth-token')
          window.location.href = '/login'
        }
        
        if (error.response?.status >= 500) {
          toast.error('Server error. Please try again later.')
        }
        
        return Promise.reject(error)
      }
    )
  }

  async get(url, config) {
    const response = await this.client.get(url, config)
    return response.data
  }

  async post(url, data, config) {
    const response = await this.client.post(url, data, config)
    return response.data
  }

  async put(url, data, config) {
    const response = await this.client.put(url, data, config)
    return response.data
  }

  async delete(url, config) {
    const response = await this.client.delete(url, config)
    return response.data
  }

  async patch(url, data, config) {
    const response = await this.client.patch(url, data, config)
    return response.data
  }
}

export const apiClient = new ApiClient()


