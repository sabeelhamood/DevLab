const config = {
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testMatch: [
    '**/__tests__/**/*.(spec|test).[cm]js',
    '**/?(*.)+(spec|test).[cm]js',
  ],
  collectCoverageFrom: ['src/**/*.{js,jsx}', '!src/app.js'],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html', 'json'],
  coveragePathIgnorePatterns: [
    '<rootDir>/src/config/',
    '<rootDir>/src/middleware/security.js',
    '<rootDir>/src/middleware/validateRequest.js',
    '<rootDir>/src/middleware/errorHandler.js',
    '<rootDir>/src/routes/security/',
    '<rootDir>/src/services/security/',
    '<rootDir>/src/integrations/',
    '<rootDir>/src/controllers/healthController.js',
  ],
  coverageThreshold: {
    global: {
      branches: 50,
      functions: 60,
      lines: 60,
      statements: 60,
    },
  },
  transform: {},
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  testTimeout: 10000,
  verbose: true,
  forceExit: true,
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
};

export default config;
