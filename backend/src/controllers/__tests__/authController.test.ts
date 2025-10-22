import { Request, Response } from 'express'
import { authController } from '../authController'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

// Mock bcrypt
jest.mock('bcryptjs')
const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>

// Mock jwt
jest.mock('jsonwebtoken')
const mockedJwt = jwt as jest.Mocked<typeof jwt>

describe('AuthController', () => {
  let mockRequest: Partial<Request>
  let mockResponse: Partial<Response>
  let mockNext: jest.Mock

  beforeEach(() => {
    mockRequest = {}
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    }
    mockNext = jest.fn()
  })

  describe('login', () => {
    it('should login successfully with valid credentials', async () => {
      mockRequest.body = {
        email: 'test@example.com',
        password: 'password123'
      }

      mockedBcrypt.compare.mockResolvedValue(true)
      mockedJwt.sign.mockReturnValue('mock-jwt-token')

      await authController.login(mockRequest as Request, mockResponse as Response)

      expect(mockResponse.status).toHaveBeenCalledWith(200)
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          id: 'user-123',
          email: 'test@example.com',
          name: 'John Doe',
          role: 'learner',
          organizationId: 'org-123',
          token: 'mock-jwt-token'
        })
      })
    })

    it('should return error for invalid credentials', async () => {
      mockRequest.body = {
        email: 'test@example.com',
        password: 'wrongpassword'
      }

      mockedBcrypt.compare.mockResolvedValue(false)

      await authController.login(mockRequest as Request, mockResponse as Response)

      expect(mockResponse.status).toHaveBeenCalledWith(401)
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid credentials'
      })
    })

    it('should handle missing email or password', async () => {
      mockRequest.body = {
        email: 'test@example.com'
        // missing password
      }

      await authController.login(mockRequest as Request, mockResponse as Response)

      expect(mockResponse.status).toHaveBeenCalledWith(500)
    })
  })

  describe('register', () => {
    it('should register new user successfully', async () => {
      mockRequest.body = {
        name: 'John Doe',
        email: 'newuser@example.com',
        password: 'password123',
        role: 'learner',
        organizationId: 'org-123'
      }

      mockedBcrypt.hash.mockResolvedValue('hashed-password')
      mockedJwt.sign.mockReturnValue('mock-jwt-token')

      await authController.register(mockRequest as Request, mockResponse as Response)

      expect(mockResponse.status).toHaveBeenCalledWith(201)
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          id: expect.any(String),
          email: 'newuser@example.com',
          name: 'John Doe',
          role: 'learner',
          organizationId: 'org-123',
          token: 'mock-jwt-token'
        })
      })
    })

    it('should handle registration errors', async () => {
      mockRequest.body = {
        name: 'John Doe',
        email: 'newuser@example.com',
        password: 'password123',
        role: 'learner',
        organizationId: 'org-123'
      }

      mockedBcrypt.hash.mockRejectedValue(new Error('Hashing failed'))

      await authController.register(mockRequest as Request, mockResponse as Response)

      expect(mockResponse.status).toHaveBeenCalledWith(500)
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Hashing failed'
      })
    })
  })

  describe('validateToken', () => {
    it('should validate token successfully', async () => {
      mockRequest.body = {
        token: 'valid-token'
      }

      mockedJwt.verify.mockReturnValue({
        id: 'user-123',
        email: 'test@example.com',
        role: 'learner',
        organizationId: 'org-123'
      })

      await authController.validateToken(mockRequest as Request, mockResponse as Response)

      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: {
          id: 'user-123',
          email: 'test@example.com',
          role: 'learner',
          organizationId: 'org-123'
        }
      })
    })

    it('should return error for invalid token', async () => {
      mockRequest.body = {
        token: 'invalid-token'
      }

      mockedJwt.verify.mockImplementation(() => {
        throw new Error('Invalid token')
      })

      await authController.validateToken(mockRequest as Request, mockResponse as Response)

      expect(mockResponse.status).toHaveBeenCalledWith(401)
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid token'
      })
    })
  })
})
