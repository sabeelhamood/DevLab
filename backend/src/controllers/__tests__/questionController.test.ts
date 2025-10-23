import { Request, Response } from 'express'
import { questionController } from '../questionController'

describe('QuestionController', () => {
  let mockRequest: Partial<Request>
  let mockResponse: Partial<Response>

  beforeEach(() => {
    mockRequest = {}
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    }
  })

  describe('getPersonalizedQuestions', () => {
    it('should return personalized questions', async () => {
      mockRequest.query = {
        courseId: '1',
        topicId: '1',
        type: 'code'
      }

      await questionController.getPersonalizedQuestions(mockRequest as Request, mockResponse as Response)

      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: expect.arrayContaining([
          expect.objectContaining({
            id: expect.any(String),
            title: expect.any(String),
            description: expect.any(String),
            type: expect.any(String),
            difficulty: expect.any(String)
          })
        ])
      })
    })

    it('should filter questions by type', async () => {
      mockRequest.query = {
        courseId: '1',
        type: 'theoretical'
      }

      await questionController.getPersonalizedQuestions(mockRequest as Request, mockResponse as Response)

      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: expect.arrayContaining([
          expect.objectContaining({
            type: 'theoretical'
          })
        ])
      })
    })
  })

  describe('getQuestion', () => {
    it('should return question by id', async () => {
      mockRequest.params = { id: '1' }

      await questionController.getQuestion(mockRequest as Request, mockResponse as Response)

      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          id: '1',
          title: expect.any(String),
          description: expect.any(String)
        })
      })
    })

    it('should return 404 for non-existent question', async () => {
      mockRequest.params = { id: 'non-existent' }

      await questionController.getQuestion(mockRequest as Request, mockResponse as Response)

      expect(mockResponse.status).toHaveBeenCalledWith(404)
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Question not found'
      })
    })
  })

  describe('submitAnswer', () => {
    it('should evaluate correct answer', async () => {
      mockRequest.params = { id: '1' }
      mockRequest.body = {
        solution: 'print("Hello, World!")',
        language: 'python',
        timeSpent: 120
      }

      await questionController.submitAnswer(mockRequest as Request, mockResponse as Response)

      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          isCorrect: true,
          score: 100,
          feedback: expect.any(String),
          testResults: expect.any(Array)
        })
      })
    })

    it('should evaluate incorrect answer', async () => {
      mockRequest.params = { id: '1' }
      mockRequest.body = {
        solution: 'wrong solution',
        language: 'python',
        timeSpent: 120
      }

      await questionController.submitAnswer(mockRequest as Request, mockResponse as Response)

      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          isCorrect: false,
          score: 0,
          feedback: expect.any(String)
        })
      })
    })
  })

  describe('requestHint', () => {
    it('should return hint for valid question', async () => {
      mockRequest.params = { id: '1' }
      mockRequest.body = { hintNumber: 1 }

      await questionController.requestHint(mockRequest as Request, mockResponse as Response)

      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          hint: expect.any(String),
          hintsRemaining: expect.any(Number)
        })
      })
    })

    it('should return error for invalid hint number', async () => {
      mockRequest.params = { id: '1' }
      mockRequest.body = { hintNumber: 5 } // Invalid hint number

      await questionController.requestHint(mockRequest as Request, mockResponse as Response)

      expect(mockResponse.status).toHaveBeenCalledWith(400)
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Hint not available'
      })
    })
  })

  describe('createQuestion', () => {
    it('should create new question', async () => {
      mockRequest.body = {
        title: 'New Question',
        description: 'Question description',
        type: 'code',
        difficulty: 'beginner',
        courseId: '1',
        topicId: '1'
      }
      mockRequest.user = { id: 'trainer-123' }

      await questionController.createQuestion(mockRequest as Request, mockResponse as Response)

      expect(mockResponse.status).toHaveBeenCalledWith(201)
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          id: expect.any(String),
          title: 'New Question',
          description: 'Question description',
          type: 'code',
          difficulty: 'beginner',
          createdBy: 'trainer-123',
          isAIGenerated: false,
          validationStatus: 'pending'
        })
      })
    })
  })
})




