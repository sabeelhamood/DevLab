import { config } from '../src/config/environment'

// Mock environment variables
process.env.NODE_ENV = 'test'
process.env.PORT = '3001'
process.env.SUPABASE_URL = 'https://test.supabase.co'
process.env.SUPABASE_SERVICE_KEY = 'test-service-key'
process.env.MONGODB_ATLAS_URI = 'mongodb://test:test@localhost:27017/test'
process.env.GEMINI_API_KEY = 'test-gemini-key'
process.env.SANDBOX_API_KEY = 'test-sandbox-key'
process.env.SERVICE_JWT_SECRET = 'test-jwt-secret'
process.env.SERVICE_API_KEYS = 'test-key1,test-key2'
process.env.CORS_ORIGINS = 'http://localhost:3000'

// Global test setup
beforeAll(() => {
  // Setup test database connections
  console.log('Setting up test environment...')
})

afterAll(() => {
  // Cleanup test database connections
  console.log('Cleaning up test environment...')
})

beforeEach(() => {
  // Reset mocks before each test
  jest.clearAllMocks()
})

// Mock external services
jest.mock('../src/services/external/geminiService', () => ({
  generateQuestion: jest.fn().mockResolvedValue({
    title: 'Test Question',
    description: 'Test Description',
    solution: 'Test Solution'
  }),
  evaluateSolution: jest.fn().mockResolvedValue({
    isCorrect: true,
    score: 100,
    feedback: 'Great job!'
  })
}))

jest.mock('../src/services/external/sandboxService', () => ({
  executeCode: jest.fn().mockResolvedValue({
    output: 'Hello, World!',
    error: null,
    executionTime: 100
  })
}))

// Mock database connections
jest.mock('../src/config/database', () => ({
  supabase: {
    from: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: null, error: null })
        })
      }),
      insert: jest.fn().mockResolvedValue({ data: null, error: null }),
      update: jest.fn().mockResolvedValue({ data: null, error: null }),
      delete: jest.fn().mockResolvedValue({ data: null, error: null })
    })
  },
  mongodb: {
    collection: jest.fn().mockReturnValue({
      find: jest.fn().mockReturnValue({
        toArray: jest.fn().mockResolvedValue([])
      }),
      insertOne: jest.fn().mockResolvedValue({ insertedId: 'test-id' }),
      updateOne: jest.fn().mockResolvedValue({ modifiedCount: 1 }),
      deleteOne: jest.fn().mockResolvedValue({ deletedCount: 1 })
    })
  }
}))
