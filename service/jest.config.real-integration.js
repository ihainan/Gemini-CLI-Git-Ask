module.exports = {
  // Use ts-jest preset for TypeScript support
  preset: 'ts-jest',
  
  // Test environment
  testEnvironment: 'node',
  
  // Only run real integration tests
  testMatch: [
    '<rootDir>/tests/real-integration/**/*.test.ts'
  ],
  
  // Setup files
  setupFilesAfterEnv: [
    '<rootDir>/tests/real-integration/setup-real-integration.ts'
  ],
  
  // TypeScript configuration
  transform: {
    '^.+\\.ts$': 'ts-jest'
  },
  
  // Module resolution
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  
  // Increase timeout for real API calls
  testTimeout: 60000, // 60 seconds
  
  // Don't use any mocks - we want real integration
  clearMocks: false,
  resetMocks: false,
  restoreMocks: false,
  
  // Ensure no modules are mocked for real integration
  unmockedModulePathPatterns: [
    'simple-git',
    'child_process',
    'fs',
    'path'
  ],
  
  // Coverage settings (optional for real integration tests)
  collectCoverage: false,
  
  // Verbose output to see what's happening
  verbose: true,
  
  // Run tests serially to avoid API rate limiting
  maxWorkers: 1,
  
  // Detect open handles for better debugging
  detectOpenHandles: true,
  forceExit: true,
  
  // Global setup and teardown
  globalSetup: '<rootDir>/tests/real-integration/global-setup.ts',
  globalTeardown: '<rootDir>/tests/real-integration/global-teardown.ts'
}; 