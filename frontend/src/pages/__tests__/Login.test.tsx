import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { BrowserRouter } from 'react-router-dom'
import Login from '../auth/Login'
import { useAuthStore } from '../../store/authStore'

// Mock the auth store
vi.mock('../../store/authStore', () => ({
  useAuthStore: vi.fn()
}))

// Mock react-hot-toast
vi.mock('react-hot-toast', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn()
  }
}))

const mockLogin = vi.fn()

describe('Login Page', () => {
  beforeEach(() => {
    vi.mocked(useAuthStore).mockReturnValue({
      user: null,
      isLoading: false,
      error: null,
      login: mockLogin,
      register: vi.fn(),
      logout: vi.fn(),
      checkAuth: vi.fn(),
      clearError: vi.fn()
    })
  })

  it('renders login form', () => {
    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    )
    
    expect(screen.getByText('Sign in to your account')).toBeInTheDocument()
    expect(screen.getByLabelText('Email address')).toBeInTheDocument()
    expect(screen.getByLabelText('Password')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeInTheDocument()
  })

  it('handles form submission', async () => {
    mockLogin.mockResolvedValue(undefined)
    
    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    )
    
    fireEvent.change(screen.getByLabelText('Email address'), {
      target: { value: 'test@example.com' }
    })
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'password123' }
    })
    
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }))
    
    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password123')
    })
  })

  it('shows loading state', () => {
    vi.mocked(useAuthStore).mockReturnValue({
      user: null,
      isLoading: true,
      error: null,
      login: mockLogin,
      register: vi.fn(),
      logout: vi.fn(),
      checkAuth: vi.fn(),
      clearError: vi.fn()
    })
    
    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    )
    
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('displays error message', () => {
    vi.mocked(useAuthStore).mockReturnValue({
      user: null,
      isLoading: false,
      error: 'Invalid credentials',
      login: mockLogin,
      register: vi.fn(),
      logout: vi.fn(),
      checkAuth: vi.fn(),
      clearError: vi.fn()
    })
    
    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    )
    
    expect(screen.getByText('Invalid credentials')).toBeInTheDocument()
  })

  it('validates required fields', async () => {
    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    )
    
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }))
    
    // Should not call login with empty fields
    expect(mockLogin).not.toHaveBeenCalled()
  })
})

