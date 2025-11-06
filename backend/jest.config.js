export default {
  testEnvironment: 'node',
  coverageThreshold: {
    global: {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90
    }
  },
  testMatch: ['**/tests/**/*.test.js'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup/testSetup.js'],
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/**/*.config.js'
  ],
  transform: {}
};





