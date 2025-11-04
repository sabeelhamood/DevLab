/**
 * Test Setup
 * Global test configuration and setup
 */

// Mock environment variables for tests
process.env.NODE_ENV = 'test';
process.env.SUPABASE_URL = 'https://test-project.supabase.co';
process.env.SUPABASE_KEY = 'test-key';
process.env.MONGO_URL = 'mongodb://localhost:27017/devlab-test';
process.env.GEMINI_API_KEY = 'test-gemini-key';
process.env.JUDGE0_API_KEY = 'test-judge0-key';

// Suppress console.log in tests (optional)
// global.console = {
//   ...console,
//   log: jest.fn(),
//   debug: jest.fn(),
//   info: jest.fn(),
//   warn: jest.fn(),
//   error: jest.fn(),
// };



