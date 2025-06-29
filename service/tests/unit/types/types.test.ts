/**
 * Unit tests for Type Definitions
 * Tests type safety, enums, and interfaces
 */

import {
  ErrorCode,
  ErrorCategory,
  ErrorSeverity,
  RepositoryStatus,
  LockType,
  LockStatus,
  GitCloneMethod
} from '../../../../src/types';

import { MockDataFactory, TestAssertions } from '../../helpers/test-utils';

describe('Type Definitions', () => {
  describe('Enums', () => {
    describe('ErrorCode', () => {
      it('should have all required error codes', () => {
        // Validation errors
        expect(ErrorCode.INVALID_REQUEST).toBe('INVALID_REQUEST');
        expect(ErrorCode.INVALID_REPOSITORY_URL).toBe('INVALID_REPOSITORY_URL');
        expect(ErrorCode.INVALID_PARAMETERS).toBe('INVALID_PARAMETERS');
        expect(ErrorCode.MISSING_REQUIRED_FIELD).toBe('MISSING_REQUIRED_FIELD');

        // Repository errors
        expect(ErrorCode.REPOSITORY_NOT_FOUND).toBe('REPOSITORY_NOT_FOUND');
        expect(ErrorCode.REPOSITORY_CLONE_FAILED).toBe('REPOSITORY_CLONE_FAILED');
        expect(ErrorCode.REPOSITORY_UPDATE_FAILED).toBe('REPOSITORY_UPDATE_FAILED');
        expect(ErrorCode.REPOSITORY_ACCESS_DENIED).toBe('REPOSITORY_ACCESS_DENIED');
        expect(ErrorCode.REPOSITORY_TOO_LARGE).toBe('REPOSITORY_TOO_LARGE');

        // Lock errors
        expect(ErrorCode.LOCK_TIMEOUT).toBe('LOCK_TIMEOUT');
        expect(ErrorCode.LOCK_ACQUISITION_FAILED).toBe('LOCK_ACQUISITION_FAILED');
        expect(ErrorCode.CONCURRENT_OPERATION_LIMIT).toBe('CONCURRENT_OPERATION_LIMIT');

        // Gemini errors
        expect(ErrorCode.GEMINI_EXECUTION_FAILED).toBe('GEMINI_EXECUTION_FAILED');
        expect(ErrorCode.GEMINI_API_ERROR).toBe('GEMINI_API_ERROR');
        expect(ErrorCode.GEMINI_QUOTA_EXCEEDED).toBe('GEMINI_QUOTA_EXCEEDED');
        expect(ErrorCode.GEMINI_MODEL_NOT_AVAILABLE).toBe('GEMINI_MODEL_NOT_AVAILABLE');

        // System errors
        expect(ErrorCode.TIMEOUT_EXCEEDED).toBe('TIMEOUT_EXCEEDED');
        expect(ErrorCode.STORAGE_FULL).toBe('STORAGE_FULL');
        expect(ErrorCode.INSUFFICIENT_RESOURCES).toBe('INSUFFICIENT_RESOURCES');
        expect(ErrorCode.NETWORK_ERROR).toBe('NETWORK_ERROR');
        expect(ErrorCode.FILE_SYSTEM_ERROR).toBe('FILE_SYSTEM_ERROR');
        expect(ErrorCode.INTERNAL_ERROR).toBe('INTERNAL_ERROR');

        // Configuration errors
        expect(ErrorCode.CONFIG_LOAD_FAILED).toBe('CONFIG_LOAD_FAILED');
        expect(ErrorCode.CONFIG_VALIDATION_FAILED).toBe('CONFIG_VALIDATION_FAILED');
        expect(ErrorCode.INVALID_CONFIG_FORMAT).toBe('INVALID_CONFIG_FORMAT');

        // Service errors
        expect(ErrorCode.SERVICE_UNAVAILABLE).toBe('SERVICE_UNAVAILABLE');
        expect(ErrorCode.SERVICE_OVERLOADED).toBe('SERVICE_OVERLOADED');
        expect(ErrorCode.MAINTENANCE_MODE).toBe('MAINTENANCE_MODE');
      });
    });

    describe('ErrorCategory', () => {
      it('should have all required categories', () => {
        expect(ErrorCategory.VALIDATION).toBe('validation');
        expect(ErrorCategory.REPOSITORY).toBe('repository');
        expect(ErrorCategory.CONCURRENCY).toBe('concurrency');
        expect(ErrorCategory.GEMINI).toBe('gemini');
        expect(ErrorCategory.SYSTEM).toBe('system');
        expect(ErrorCategory.CONFIGURATION).toBe('configuration');
        expect(ErrorCategory.SERVICE).toBe('service');
      });
    });

    describe('ErrorSeverity', () => {
      it('should have all severity levels', () => {
        expect(ErrorSeverity.LOW).toBe('low');
        expect(ErrorSeverity.MEDIUM).toBe('medium');
        expect(ErrorSeverity.HIGH).toBe('high');
        expect(ErrorSeverity.CRITICAL).toBe('critical');
      });
    });

    describe('RepositoryStatus', () => {
      it('should have all repository statuses', () => {
        expect(RepositoryStatus.NOT_EXISTS).toBe('not_exists');
        expect(RepositoryStatus.FRESH).toBe('fresh');
        expect(RepositoryStatus.STALE).toBe('stale');
        expect(RepositoryStatus.UPDATING).toBe('updating');
        expect(RepositoryStatus.ERROR).toBe('error');
      });
    });

    describe('LockType', () => {
      it('should have all lock types', () => {
        expect(LockType.READ).toBe('read');
        expect(LockType.WRITE).toBe('write');
      });
    });

    describe('LockStatus', () => {
      it('should have all lock statuses', () => {
        expect(LockStatus.AVAILABLE).toBe('available');
        expect(LockStatus.LOCKED).toBe('locked');
        expect(LockStatus.WAITING).toBe('waiting');
        expect(LockStatus.FAILED).toBe('failed');
        expect(LockStatus.EXPIRED).toBe('expired');
      });
    });
  });

  describe('MockDataFactory', () => {
    describe('createMockRequest', () => {
      it('should create valid AskRequest with defaults', () => {
        const request = MockDataFactory.createMockRequest();
        
        expect(request).toHaveProperty('repository_url');
        expect(request).toHaveProperty('question');
        expect(request).toHaveProperty('branch');
        expect(request).toHaveProperty('timeout');
        expect(typeof request.repository_url).toBe('string');
        expect(typeof request.question).toBe('string');
        expect(typeof request.branch).toBe('string');
        expect(typeof request.timeout).toBe('number');
      });

      it('should accept overrides', () => {
        const customRequest = MockDataFactory.createMockRequest({
          repository_url: 'https://github.com/custom/repo',
          question: 'Custom question?',
          branch: 'develop',
          timeout: 600
        });

        expect(customRequest.repository_url).toBe('https://github.com/custom/repo');
        expect(customRequest.question).toBe('Custom question?');
        expect(customRequest.branch).toBe('develop');
        expect(customRequest.timeout).toBe(600);
      });
    });

    describe('createMockSuccessResponse', () => {
      it('should create valid AskSuccessResponse', () => {
        const response = MockDataFactory.createMockSuccessResponse();
        
        TestAssertions.assertSuccessResponse(response);
        expect(response.status).toBe('success');
        expect(typeof response.answer).toBe('string');
        expect(typeof response.execution_time).toBe('number');
        expect(response.repository).toHaveProperty('url');
        expect(response.repository).toHaveProperty('branch');
        expect(response.repository).toHaveProperty('commit_hash');
      });
    });

    describe('createMockErrorResponse', () => {
      it('should create valid AskErrorResponse', () => {
        const response = MockDataFactory.createMockErrorResponse();
        
        TestAssertions.assertErrorResponse(response);
        expect(response.status).toBe('error');
        expect(Object.values(ErrorCode)).toContain(response.error_code);
      });

      it('should accept custom error code', () => {
        const response = MockDataFactory.createMockErrorResponse({
          error_code: ErrorCode.REPOSITORY_NOT_FOUND,
          message: 'Custom error message'
        });

        expect(response.error_code).toBe(ErrorCode.REPOSITORY_NOT_FOUND);
        expect(response.message).toBe('Custom error message');
      });
    });

    describe('createMockRepositoryMetadata', () => {
      it('should create valid RepositoryMetadata', () => {
        const metadata = MockDataFactory.createMockRepositoryMetadata();
        
        TestAssertions.assertValidRepositoryMetadata(metadata);
        expect(['https', 'ssh']).toContain(metadata.clone_method);
        expect(typeof metadata.size_mb).toBe('number');
        expect(typeof metadata.file_count).toBe('number');
      });

      it('should accept overrides', () => {
        const metadata = MockDataFactory.createMockRepositoryMetadata({
          url: 'https://github.com/custom/repo',
          branch: 'develop',
          clone_method: 'ssh' as GitCloneMethod,
          size_mb: 25.7,
          file_count: 300
        });

        expect(metadata.url).toBe('https://github.com/custom/repo');
        expect(metadata.branch).toBe('develop');  
        expect(metadata.clone_method).toBe('ssh');
        expect(metadata.size_mb).toBe(25.7);
        expect(metadata.file_count).toBe(300);
      });
    });

    describe('createMockRepositoryInfo', () => {
      it('should create valid RepositoryInfo', () => {
        const info = MockDataFactory.createMockRepositoryInfo();
        
        expect(info).toHaveProperty('url');
        expect(info).toHaveProperty('branch');
        expect(info).toHaveProperty('commit_hash');
        expect(typeof info.url).toBe('string');
        expect(typeof info.branch).toBe('string');
        expect(typeof info.commit_hash).toBe('string');
      });
    });
  });

  describe('TestAssertions', () => {
    describe('assertSuccessResponse', () => {
      it('should pass for valid success response', () => {
        const validResponse = MockDataFactory.createMockSuccessResponse();
        
        expect(() => {
          TestAssertions.assertSuccessResponse(validResponse);
        }).not.toThrow();
      });

      it('should fail for invalid response', () => {
        const invalidResponse = { status: 'error' };
        
        expect(() => {
          TestAssertions.assertSuccessResponse(invalidResponse);
        }).toThrow();
      });
    });

    describe('assertErrorResponse', () => {
      it('should pass for valid error response', () => {
        const validResponse = MockDataFactory.createMockErrorResponse();
        
        expect(() => {
          TestAssertions.assertErrorResponse(validResponse);
        }).not.toThrow();
      });

      it('should fail for invalid response', () => {
        const invalidResponse = { status: 'success' };
        
        expect(() => {
          TestAssertions.assertErrorResponse(invalidResponse);
        }).toThrow();
      });
    });

    describe('assertValidRepositoryMetadata', () => {
      it('should pass for valid metadata', () => {
        const validMetadata = MockDataFactory.createMockRepositoryMetadata();
        
        expect(() => {
          TestAssertions.assertValidRepositoryMetadata(validMetadata);
        }).not.toThrow();
      });

      it('should fail for invalid metadata', () => {
        const invalidMetadata = { url: 'test' };
        
        expect(() => {
          TestAssertions.assertValidRepositoryMetadata(invalidMetadata);
        }).toThrow();
      });
    });
  });
}); 