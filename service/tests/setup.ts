/**
 * Jest Test Setup
 * Global test configuration and utilities
 */

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'error'; // Only output error logs in tests

// Global test timeout
jest.setTimeout(30000);

// Global beforeAll setup
beforeAll(async () => {
  // Add global test initialization logic here
  console.log('🚀 Starting test suite...');
});

// Global afterAll cleanup
afterAll(async () => {
  // Add global test cleanup logic here
  console.log('✅ Test suite completed');
});

// Global beforeEach setup
beforeEach(() => {
  // Setup before each test
  jest.clearAllMocks();
});

// Global afterEach cleanup
afterEach(() => {
  // Cleanup after each test
  jest.restoreAllMocks();
});

// Extend Jest matchers (if needed)
export {}; // Make file a module

declare global {
  namespace jest {
    interface Matchers<R> {
      // Add custom matchers here if needed
    }
  }
} 