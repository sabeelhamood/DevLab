import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { config } from '../config/environment.js'

export const authController = {
  async login(req, res) {
    try {
      const { email, password } = req.body

      // Mock user data - in real implementation, this would come from database
      const mockUser = {
        id: 'user-123',
        email,
        name: 'John Doe',
        role: 'learner',
        organizationId: 'org-123',
        password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi' // password
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, mockUser.password)
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          error: 'Invalid credentials'
        })
      }

      // Generate JWT token
      const token = jwt.sign(
        { 
          id: mockUser.id, 
          email: mockUser.email, 
          role: mockUser.role,
          organizationId: mockUser.organizationId
        },
        config.security.jwtSecret,
        { expiresIn: '24h' }
      )

      res.json({
        success: true,
        data: {
          id: mockUser.id,
          email: mockUser.email,
          name: mockUser.name,
          role: mockUser.role,
          organizationId: mockUser.organizationId,
          token
        }
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      })
    }
  },

  async register(req, res) {
    try {
      const { name, email, password, role, organizationId } = req.body

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10)

      // Mock user creation - in real implementation, this would save to database
      const newUser = {
        id: `user-${Date.now()}`,
        name,
        email,
        role,
        organizationId,
        password: hashedPassword,
        createdAt: new Date().toISOString()
      }

      // Generate JWT token
      const token = jwt.sign(
        { 
          id: newUser.id, 
          email: newUser.email, 
          role: newUser.role,
          organizationId: newUser.organizationId
        },
        config.security.jwtSecret,
        { expiresIn: '24h' }
      )

      res.status(201).json({
        success: true,
        data: {
          id: newUser.id,
          email: newUser.email,
          name: newUser.name,
          role: newUser.role,
          organizationId: newUser.organizationId,
          token
        }
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      })
    }
  },

  async validateToken(req, res) {
    try {
      const { token } = req.body

      const decoded = jwt.verify(token, config.security.jwtSecret)

      res.json({
        success: true,
        data: {
          id: decoded.id,
          email: decoded.email,
          role: decoded.role,
          organizationId: decoded.organizationId
        }
      })
    } catch (error) {
      res.status(401).json({
        success: false,
        error: 'Invalid token'
      })
    }
  },

  async refreshToken(req, res) {
    try {
      // In real implementation, this would validate refresh token
      const newToken = jwt.sign(
        { id: 'user-123', email: 'user@example.com', role: 'learner' },
        config.security.jwtSecret,
        { expiresIn: '24h' }
      )

      res.json({
        success: true,
        data: {
          accessToken: newToken,
          refreshToken: 'new-refresh-token'
        }
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      })
    }
  },

  async logout(req, res) {
    try {
      // In real implementation, this would invalidate the token
      res.json({
        success: true,
        message: 'Logged out successfully'
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      })
    }
  },

  async getProfile(req, res) {
    try {
      // Mock user profile data
      const profile = {
        id: req.user?.id,
        email: req.user?.email,
        name: 'John Doe',
        role: req.user?.role,
        organizationId: req.user?.organizationId,
        profile: {
          skillLevel: 'intermediate',
          preferences: {
            language: 'python',
            difficulty: 'intermediate',
            notifications: true
          },
          statistics: {
            totalQuestions: 45,
            correctAnswers: 38,
            averageScore: 84.4,
            timeSpent: 120
          }
        }
      }

      res.json({
        success: true,
        data: profile
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      })
    }
  },

  async updateProfile(req, res) {
    try {
      const { name, preferences } = req.body

      // Mock profile update
      const updatedProfile = {
        id: req.user?.id,
        email: req.user?.email,
        name: name || 'John Doe',
        role: req.user?.role,
        organizationId: req.user?.organizationId,
        profile: {
          skillLevel: 'intermediate',
          preferences: preferences || {
            language: 'python',
            difficulty: 'intermediate',
            notifications: true
          },
          statistics: {
            totalQuestions: 45,
            correctAnswers: 38,
            averageScore: 84.4,
            timeSpent: 120
          }
        }
      }

      res.json({
        success: true,
        data: updatedProfile
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      })
    }
  }
}
