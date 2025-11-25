// Comprehensive Test Configuration
// Jest configuration for frontend testing

module.exports = {
  // Test environment
  testEnvironment: 'jsdom',

  // Setup files
  // setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],

  // Module name mapping
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/frontend/src/$1',
    '^@/components/(.*)$': '<rootDir>/frontend/src/components/$1',
    '^@/pages/(.*)$': '<rootDir>/frontend/src/pages/$1',
    '^@/services/(.*)$': '<rootDir>/frontend/src/services/$1',
    '^@/utils/(.*)$': '<rootDir>/frontend/src/utils/$1',
    '^@/types/(.*)$': '<rootDir>/frontend/src/types/$1',
  },

  // Test patterns
  testMatch: [
    '<rootDir>/__tests__/**/*.test.{js,jsx,ts,tsx}',
    '<rootDir>/tests/**/*.test.{js,jsx,ts,tsx}',
    '<rootDir>/services/__tests__/**/*.test.{js,jsx,ts,tsx}',
  ],

  // Coverage configuration
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html', 'json'],
  collectCoverageFrom: [
    'frontend/src/components/**/*.{js,jsx,ts,tsx}',
    'frontend/src/pages/**/*.{js,jsx,ts,tsx}',
    'frontend/src/services/**/*.{js,jsx,ts,tsx}',
    'frontend/src/utils/**/*.{js,jsx,ts,tsx}',
    'frontend/src/hooks/**/*.{js,jsx,ts,tsx}',
    '!**/*.d.ts',
    '!**/*.stories.{js,jsx,ts,tsx}',
    '!**/*.test.{js,jsx,ts,tsx}',
    '!**/__tests__/**',
    '!**/node_modules/**',
  ],

  // Coverage thresholds
  coverageThreshold: {
    global: {
      branches: 75,
      functions: 75,
      lines: 75,
      statements: 75,
    },
    './frontend/src/utils/': {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
    './frontend/src/components/': {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },

  // Transform configuration
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
    '^.+\\.(js|jsx)$': 'babel-jest',
  },

  // Module file extensions
  moduleFileExtensions: ['js', 'jsx', 'ts', 'tsx', 'json'],

  // Test timeout
  testTimeout: 10000,

  // Clear mocks between tests
  clearMocks: true,

  // Restore mocks after each test
  restoreMocks: true,

  // Verbose output
  verbose: true,

  // Transform ignore patterns
  transformIgnorePatterns: [
    'node_modules/(?!(.*\\.mjs$|@testing-library|@hookform|react-hook-form))',
  ],

  // Setup for import.meta
  globals: {
    'ts-jest': {
      useESM: true,
    },
  },

  // Module paths
  modulePaths: ['<rootDir>'],

  // Test environment options
  testEnvironmentOptions: {
    url: 'http://localhost:3000',
  },

  // Error handling
  errorOnDeprecated: true,

  // Force exit
  forceExit: true,

  // Detect open handles
  detectOpenHandles: true,

  // Detect leaks
  detectLeaks: true,
};
