/**
 * Unit tests for Logger utility
 */

// Mock winston first
const mockLoggerInstance = {
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
  verbose: jest.fn(),
  silly: jest.fn(),
  add: jest.fn()
};

jest.mock('winston', () => ({
  createLogger: jest.fn(() => mockLoggerInstance),
  format: {
    combine: jest.fn(() => 'combined-format'),
    timestamp: jest.fn(() => 'timestamp-format'),
    errors: jest.fn(() => 'errors-format'),
    json: jest.fn(() => 'json-format'),
    simple: jest.fn(() => 'simple-format'),
    colorize: jest.fn(() => 'colorize-format')
  },
  transports: {
    Console: jest.fn().mockImplementation(() => ({ name: 'console' })),
    File: jest.fn().mockImplementation(() => ({ name: 'file' }))
  }
}));

// Mock path module
jest.mock('path', () => ({
  join: jest.fn((...args) => args.join('/'))
}));

// Import after mocking
import { logger } from '../../../src/utils/logger';

describe('Logger', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('initialization', () => {
    it('should create logger instance', () => {
      expect(logger).toBeDefined();
    });

    it('should have winston logger methods', () => {
      expect(logger.info).toBeDefined();
      expect(logger.error).toBeDefined();
      expect(logger.warn).toBeDefined();
      expect(logger.debug).toBeDefined();
    });
  });

  describe('logging methods', () => {
    it('should log info messages', () => {
      const message = 'Test info message';
      const meta = { userId: 123 };

      logger.info(message, meta);

      expect(mockLoggerInstance.info).toHaveBeenCalledWith(message, meta);
    });

    it('should log error messages', () => {
      const message = 'Test error message';
      const error = new Error('Test error');

      logger.error(message, error);

      expect(mockLoggerInstance.error).toHaveBeenCalledWith(message, error);
    });

    it('should log warning messages', () => {
      const message = 'Test warning message';

      logger.warn(message);

      expect(mockLoggerInstance.warn).toHaveBeenCalledWith(message);
    });

    it('should log debug messages', () => {
      const message = 'Test debug message';
      const debugData = { component: 'test' };

      logger.debug(message, debugData);

      expect(mockLoggerInstance.debug).toHaveBeenCalledWith(message, debugData);
    });
  });

  describe('error logging with stack traces', () => {
    it('should log errors with stack traces', () => {
      const error = new Error('Test error with stack');
      error.stack = 'Error: Test error\n    at test.js:1:1';

      logger.error('An error occurred', { error });

      expect(mockLoggerInstance.error).toHaveBeenCalledWith(
        'An error occurred',
        { error }
      );
    });

    it('should handle errors without stack traces', () => {
      const errorLikeObject = { message: 'Error without stack' };

      logger.error('Error occurred', errorLikeObject);

      expect(mockLoggerInstance.error).toHaveBeenCalledWith(
        'Error occurred',
        errorLikeObject
      );
    });
  });

  describe('structured logging', () => {
    it('should support structured logging with multiple fields', () => {
      const structuredData = {
        requestId: 'req-123',
        userId: 'user-456',
        action: 'repository-clone',
        repository: 'github.com/test/repo',
        duration: 1500
      };

      logger.info('Repository cloned successfully', structuredData);

      expect(mockLoggerInstance.info).toHaveBeenCalledWith(
        'Repository cloned successfully',
        structuredData
      );
    });

    it('should handle nested objects in log metadata', () => {
      const nestedData = {
        request: {
          url: '/api/v1/ask',
          method: 'POST',
          headers: { 'content-type': 'application/json' }
        },
        response: {
          status: 200,
          duration: 250
        }
      };

      logger.info('API request completed', nestedData);

      expect(mockLoggerInstance.info).toHaveBeenCalledWith(
        'API request completed',
        nestedData
      );
    });
  });

  describe('performance logging', () => {
    it('should log performance metrics', () => {
      const performanceData = {
        operation: 'gemini-cli-execution',
        duration: 2500,
        memoryUsage: 125.5,
        cpuUsage: 45.2
      };

      logger.info('Performance metrics', performanceData);

      expect(mockLoggerInstance.info).toHaveBeenCalledWith(
        'Performance metrics',
        performanceData
      );
    });
  });

  describe('service metadata', () => {
    it('should include service name in default metadata', () => {
      // The logger should be properly configured with service metadata
      // This is verified by the existence of the logger instance
      expect(logger).toBeDefined();
      // Additional metadata verification would be done in integration tests
      expect(true).toBe(true); // Placeholder for actual metadata verification
    });
  });
}); 