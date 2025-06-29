/**
 * Unit tests for Type Definitions
 */

import { MockDataFactory, TestAssertions } from '../../helpers/test-utils';
import { 
  RepositoryError, 
  GeminiError, 
  GeminiException,
  GeminiRequest,
  GeminiResponse,
  GeminiExecutorConfig
} from '../../../src/types';

describe('Type Definitions', () => {
  describe('Enums', () => {
    describe('RepositoryError', () => {
      it('should have all required error codes', () => {
        expect(RepositoryError.INVALID_URL).toBe('INVALID_URL');
        expect(RepositoryError.CLONE_FAILED).toBe('CLONE_FAILED');
        expect(RepositoryError.UPDATE_FAILED).toBe('UPDATE_FAILED');
        expect(RepositoryError.NOT_FOUND).toBe('NOT_FOUND');
        expect(RepositoryError.LOCK_FAILED).toBe('LOCK_FAILED');
        expect(RepositoryError.METADATA_ERROR).toBe('METADATA_ERROR');
        expect(RepositoryError.STORAGE_ERROR).toBe('STORAGE_ERROR');
      });
    });

    describe('GeminiError', () => {
      it('should have all required error codes', () => {
        expect(GeminiError.EXECUTION_FAILED).toBe('EXECUTION_FAILED');
        expect(GeminiError.TIMEOUT_EXCEEDED).toBe('TIMEOUT_EXCEEDED');
        expect(GeminiError.INVALID_RESPONSE).toBe('INVALID_RESPONSE');
        expect(GeminiError.CLI_NOT_FOUND).toBe('CLI_NOT_FOUND');
        expect(GeminiError.INVALID_REQUEST).toBe('INVALID_REQUEST');
        expect(GeminiError.API_ERROR).toBe('API_ERROR');
        expect(GeminiError.INTERNAL_ERROR).toBe('INTERNAL_ERROR');
      });

      it('should have unique error codes', () => {
        const errorCodes = Object.values(GeminiError);
        const uniqueCodes = new Set(errorCodes);
        expect(errorCodes.length).toBe(uniqueCodes.size);
      });

      it('should have string values for all error codes', () => {
        Object.values(GeminiError).forEach(code => {
          expect(typeof code).toBe('string');
          expect(code.length).toBeGreaterThan(0);
        });
      });
    });
  });

  describe('MockDataFactory', () => {
    describe('createMockRepositoryMetadata', () => {
      it('should create valid RepositoryMetadata', () => {
        const metadata = MockDataFactory.createMockRepositoryMetadata();
        
        TestAssertions.assertValidRepositoryMetadata(metadata);
        expect(metadata.url).toBe('https://github.com/test/repo');
        expect(metadata.branch).toBe('main');
        expect(metadata.clone_method).toBe('https');
        expect(typeof metadata.commit_hash).toBe('string');
      });

      it('should accept overrides', () => {
        const metadata = MockDataFactory.createMockRepositoryMetadata({
          url: 'https://github.com/custom/repo',
          branch: 'develop',
          clone_method: 'ssh'
        });

        expect(metadata.url).toBe('https://github.com/custom/repo');
        expect(metadata.branch).toBe('develop');
        expect(metadata.clone_method).toBe('ssh');
      });
    });

    describe('createMockGeminiRequest', () => {
      it('should create valid GeminiRequest', () => {
        const request = MockDataFactory.createMockGeminiRequest();
        
        TestAssertions.assertValidGeminiRequest(request);
        expect(request.repositoryPath).toBe('/tmp/test_repo_main_abc123');
        expect(request.question).toBe('What does this code do?');
        expect(request.context).toBe('This is a test repository');
        expect(typeof request.timeout).toBe('number');
      });

      it('should accept overrides', () => {
        const request = MockDataFactory.createMockGeminiRequest({
          repositoryPath: '/custom/path',
          question: 'Custom question?',
          context: 'Custom context',
          timeout: 5000
        });

        expect(request.repositoryPath).toBe('/custom/path');
        expect(request.question).toBe('Custom question?');
        expect(request.context).toBe('Custom context');
        expect(request.timeout).toBe(5000);
      });
    });

    describe('createMockGeminiResponse', () => {
      it('should create valid GeminiResponse', () => {
        const response = MockDataFactory.createMockGeminiResponse();
        
        TestAssertions.assertValidGeminiResponse(response);
        expect(response.answer).toBe('This is a test repository that demonstrates basic functionality.');
        expect(response.model).toBe('gemini-2.5-flash');
        expect(typeof response.execution_time).toBe('number');
        expect(typeof response.tokens_used).toBe('number');
      });

      it('should accept overrides', () => {
        const response = MockDataFactory.createMockGeminiResponse({
          answer: 'Custom answer',
          model: 'custom-model',
          execution_time: 2000,
          tokens_used: 200
        });

        expect(response.answer).toBe('Custom answer');
        expect(response.model).toBe('custom-model');
        expect(response.execution_time).toBe(2000);
        expect(response.tokens_used).toBe(200);
      });
    });

    describe('createMockGeminiExecutorConfig', () => {
      it('should create valid GeminiExecutorConfig', () => {
        const config = MockDataFactory.createMockGeminiExecutorConfig();
        
        expect(config.model).toBe('gemini-2.5-flash');
        expect(config.apiTimeout).toBe(300);
        expect(config.basePrompt).toBe('You are a code analysis assistant.');
        expect(config.cliPath).toBe('gemini');
        expect(config.maxBuffer).toBe(1024 * 1024 * 10);
      });

      it('should accept overrides', () => {
        const config = MockDataFactory.createMockGeminiExecutorConfig({
          model: 'custom-model',
          cliPath: '/custom/cli/path'
        });

        expect(config.model).toBe('custom-model');
        expect(config.cliPath).toBe('/custom/cli/path');
      });
    });

    describe('createMockRepositoryInfo', () => {
      it('should create valid RepositoryInfo', () => {
        const info = MockDataFactory.createMockRepositoryInfo();
        
        TestAssertions.assertValidRepositoryInfo(info);
        expect(info.url).toBe('https://github.com/test/repo');
        expect(info.branch).toBe('main');
        expect(info.exists).toBe(true);
        expect(typeof info.localPath).toBe('string');
      });
    });
  });

  describe('TestAssertions', () => {
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

    describe('assertValidRepositoryInfo', () => {
      it('should pass for valid info', () => {
        const validInfo = MockDataFactory.createMockRepositoryInfo();
        
        expect(() => {
          TestAssertions.assertValidRepositoryInfo(validInfo);
        }).not.toThrow();
      });

      it('should fail for invalid info', () => {
        const invalidInfo = { url: 'test' };
        
        expect(() => {
          TestAssertions.assertValidRepositoryInfo(invalidInfo);
        }).toThrow();
      });
    });

    describe('assertValidGeminiRequest', () => {
      it('should pass for valid Gemini request', () => {
        const validRequest = MockDataFactory.createMockGeminiRequest();
        
        expect(() => {
          TestAssertions.assertValidGeminiRequest(validRequest);
        }).not.toThrow();
      });

      it('should fail for invalid Gemini request', () => {
        const invalidRequest = { repositoryPath: '', question: '' };
        
        expect(() => {
          TestAssertions.assertValidGeminiRequest(invalidRequest);
        }).toThrow();
      });
    });

    describe('assertValidGeminiResponse', () => {
      it('should pass for valid Gemini response', () => {
        const validResponse = MockDataFactory.createMockGeminiResponse();
        
        expect(() => {
          TestAssertions.assertValidGeminiResponse(validResponse);
        }).not.toThrow();
      });

      it('should fail for invalid Gemini response', () => {
        const invalidResponse = { answer: '', model: '', execution_time: 0 };
        
        expect(() => {
          TestAssertions.assertValidGeminiResponse(invalidResponse);
        }).toThrow();
      });
    });

    describe('assertValidGeminiException', () => {
      it('should pass for valid Gemini exception', () => {
        const validException = new GeminiException(
          GeminiError.EXECUTION_FAILED,
          'Test error message'
        );
        
        expect(() => {
          TestAssertions.assertValidGeminiException(validException);
        }).not.toThrow();
      });

      it('should fail for invalid exception', () => {
        const invalidException = new Error('Regular error');
        
        expect(() => {
          TestAssertions.assertValidGeminiException(invalidException);
        }).toThrow();
      });
    });
  });

  describe('GeminiException', () => {
    it('should create exception with required properties', () => {
      const exception = new GeminiException(
        GeminiError.EXECUTION_FAILED,
        'Test error message'
      );

      expect(exception.code).toBe(GeminiError.EXECUTION_FAILED);
      expect(exception.message).toBe('Test error message');
      expect(exception.name).toBe('GeminiException');
      expect(exception).toBeInstanceOf(Error);
      expect(exception).toBeInstanceOf(GeminiException);
    });

    it('should create exception with optional properties', () => {
      const details = { key: 'value' };
      const stderr = 'Error output';
      const exception = new GeminiException(
        GeminiError.API_ERROR,
        'API error',
        details,
        stderr
      );

      expect(exception.details).toEqual(details);
      expect(exception.stderr).toBe(stderr);
    });

    it('should handle all error types', () => {
      Object.values(GeminiError).forEach(errorCode => {
        const exception = new GeminiException(errorCode, 'Test message');
        expect(exception.code).toBe(errorCode);
      });
    });
  });
}); 