import { describe, it, expect, vi, beforeEach } from 'vitest'
import { apiClient } from '../api/client'
import axios from 'axios'

// Mock axios
vi.mock('axios')
const mockedAxios = vi.mocked(axios)

describe('API Client', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('makes GET request', async () => {
    const mockResponse = { data: { success: true, data: 'test' } }
    mockedAxios.create.mockReturnValue({
      get: vi.fn().mockResolvedValue(mockResponse),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
      patch: vi.fn(),
      interceptors: {
        request: { use: vi.fn() },
        response: { use: vi.fn() }
      }
    } as any)

    const result = await apiClient.get('/test')
    expect(result).toEqual(mockResponse.data)
  })

  it('makes POST request', async () => {
    const mockResponse = { data: { success: true, data: 'created' } }
    mockedAxios.create.mockReturnValue({
      get: vi.fn(),
      post: vi.fn().mockResolvedValue(mockResponse),
      put: vi.fn(),
      delete: vi.fn(),
      patch: vi.fn(),
      interceptors: {
        request: { use: vi.fn() },
        response: { use: vi.fn() }
      }
    } as any)

    const result = await apiClient.post('/test', { data: 'test' })
    expect(result).toEqual(mockResponse.data)
  })

  it('handles errors', async () => {
    const mockError = new Error('Network error')
    mockedAxios.create.mockReturnValue({
      get: vi.fn().mockRejectedValue(mockError),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
      patch: vi.fn(),
      interceptors: {
        request: { use: vi.fn() },
        response: { use: vi.fn() }
      }
    } as any)

    await expect(apiClient.get('/test')).rejects.toThrow('Network error')
  })
})
