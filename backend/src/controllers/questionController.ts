import { Request, Response } from 'express'
import { AuthRequest } from '../middleware/auth'

// Mock question data
const mockQuestions = [
  {
    id: '1',
    title: 'Python Hello World',
    description: 'Write a Python program that prints "Hello, World!" to the console.',
    type: 'code',
    difficulty: 'beginner',
    language: 'python',
    testCases: [
      {
        input: '',
        expectedOutput: 'Hello, World!',
        description: 'Should print Hello, World!'
      }
    ],
    hints: [
      'Use the print() function to output text',
      'Remember to use quotes around your text',
      'Make sure to include the exclamation mark'
    ],
    solution: 'print("Hello, World!")',
    explanation: 'The print() function outputs the string to the console.',
    macroSkills: ['Programming Fundamentals'],
    microSkills: ['Python Basics'],
    nanoSkills: ['Print Statements'],
    courseId: '1',
    topicId: '1',
    createdBy: 'system',
    isAIGenerated: true,
    validationStatus: 'approved',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '2',
    title: 'JavaScript Variables',
    description: 'What is the difference between let, const, and var in JavaScript?',
    type: 'theoretical',
    difficulty: 'intermediate',
    hints: [
      'Consider scope differences',
      'Think about hoisting behavior',
      'Consider reassignment capabilities'
    ],
    solution: 'let and const are block-scoped, var is function-scoped. const cannot be reassigned, let and var can be reassigned.',
    explanation: 'let and const were introduced in ES6 to address issues with var. They provide block scoping and prevent common bugs.',
    macroSkills: ['JavaScript Fundamentals'],
    microSkills: ['Variable Declarations'],
    nanoSkills: ['Scope and Hoisting'],
    courseId: '2',
    topicId: '2',
    createdBy: 'system',
    isAIGenerated: true,
    validationStatus: 'approved',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
]

export const questionController = {
  async getPersonalizedQuestions(req: Request, res: Response) {
    try {
      const { courseId, topicId, type } = req.query
      
      let filteredQuestions = mockQuestions.filter(q => q.courseId === courseId)
      
      if (topicId) {
        filteredQuestions = filteredQuestions.filter(q => q.topicId === topicId)
      }
      
      if (type) {
        filteredQuestions = filteredQuestions.filter(q => q.type === type)
      }

      res.json({
        success: true,
        data: filteredQuestions
      })
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      })
    }
  },

  async getQuestion(req: Request, res: Response) {
    try {
      const { id } = req.params
      const question = mockQuestions.find(q => q.id === id)
      
      if (!question) {
        return res.status(404).json({
          success: false,
          error: 'Question not found'
        })
      }

      res.json({
        success: true,
        data: question
      })
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      })
    }
  },

  async submitAnswer(req: Request, res: Response) {
    try {
      const { id } = req.params
      const { solution, language, timeSpent } = req.body
      
      const question = mockQuestions.find(q => q.id === id)
      if (!question) {
        return res.status(404).json({
          success: false,
          error: 'Question not found'
        })
      }

      // Mock AI evaluation
      const isCorrect = solution.includes('print') && solution.includes('Hello')
      const score = isCorrect ? 100 : 0
      
      const feedback = isCorrect 
        ? 'Great job! Your solution is correct.'
        : 'Your solution needs some adjustments. Try using the print() function.'

      res.json({
        success: true,
        data: {
          isCorrect,
          score,
          feedback,
          testResults: [
            {
              testCase: question.testCases?.[0],
              passed: isCorrect,
              actualOutput: isCorrect ? 'Hello, World!' : undefined
            }
          ]
        }
      })
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      })
    }
  },

  async getFeedback(req: Request, res: Response) {
    try {
      const { id } = req.params
      
      res.json({
        success: true,
        data: {
          feedback: 'This is AI-generated feedback for your solution.',
          suggestions: [
            'Consider using more descriptive variable names',
            'Add comments to explain complex logic',
            'Test your code with different inputs'
          ]
        }
      })
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      })
    }
  },

  async requestHint(req: Request, res: Response) {
    try {
      const { id } = req.params
      const { hintNumber } = req.body
      
      const question = mockQuestions.find(q => q.id === id)
      if (!question) {
        return res.status(404).json({
          success: false,
          error: 'Question not found'
        })
      }

      const hint = question.hints[hintNumber - 1]
      if (!hint) {
        return res.status(400).json({
          success: false,
          error: 'Hint not available'
        })
      }

      res.json({
        success: true,
        data: {
          hint,
          hintsRemaining: question.hints.length - hintNumber
        }
      })
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      })
    }
  },

  async getSolution(req: Request, res: Response) {
    try {
      const { id } = req.params
      
      const question = mockQuestions.find(q => q.id === id)
      if (!question) {
        return res.status(404).json({
          success: false,
          error: 'Question not found'
        })
      }

      res.json({
        success: true,
        data: {
          solution: question.solution,
          explanation: question.explanation
        }
      })
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      })
    }
  },

  async createQuestion(req: Request, res: Response) {
    try {
      const questionData = req.body
      
      const newQuestion = {
        id: `q-${Date.now()}`,
        ...questionData,
        createdBy: (req as AuthRequest).user?.id,
        isAIGenerated: false,
        validationStatus: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      res.status(201).json({
        success: true,
        data: newQuestion
      })
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      })
    }
  },

  async updateQuestion(req: Request, res: Response) {
    try {
      const { id } = req.params
      const updateData = req.body
      
      const updatedQuestion = {
        id,
        ...updateData,
        updatedAt: new Date().toISOString()
      }

      res.json({
        success: true,
        data: updatedQuestion
      })
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      })
    }
  },

  async deleteQuestion(req: Request, res: Response) {
    try {
      const { id } = req.params
      
      res.json({
        success: true,
        message: 'Question deleted successfully'
      })
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      })
    }
  },

  async getQuestionsByCourse(req: Request, res: Response) {
    try {
      const { courseId } = req.params
      const { page = 1, limit = 10 } = req.query
      
      const questions = mockQuestions.filter(q => q.courseId === courseId)
      
      res.json({
        success: true,
        data: questions,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: questions.length,
          totalPages: Math.ceil(questions.length / Number(limit))
        }
      })
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      })
    }
  },

  async validateQuestion(req: Request, res: Response) {
    try {
      const { id } = req.params
      
      // Mock AI validation
      const isValid = true
      const feedback = 'Question is relevant and well-structured.'
      
      res.json({
        success: true,
        data: {
          isValid,
          feedback
        }
      })
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      })
    }
  }
}
