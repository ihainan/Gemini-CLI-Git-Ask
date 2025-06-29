/**
 * GeminiExecutor Unit Tests
 */

import { GeminiExecutor } from '../../../src/services/gemini-executor';
import { GeminiExecutorConfig, GeminiError, GeminiException } from '../../../src/types';
import { 
  MockDataFactory, 
  TestAssertions, 
  TestEnvironmentUtils 
} from '../../helpers/test-utils';

import * as fs from 'fs/promises';

// Mock child_process
jest.mock('child_process');

// Mock fs/promises
jest.mock('fs/promises', () => ({
  stat: jest.fn()
}));

describe('GeminiExecutor', () => {
  let executor: GeminiExecutor;
  let mockConfig: GeminiExecutorConfig;

  beforeEach(() => {
    mockConfig = MockDataFactory.createMockGeminiExecutorConfig();
    executor = new GeminiExecutor(mockConfig);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should create instance with valid config', () => {
      expect(executor).toBeInstanceOf(GeminiExecutor);
    });

    it('should use default CLI path if not provided', () => {
      const configWithoutPath = { ...mockConfig };
      delete configWithoutPath.cliPath;
      
      const executorWithoutPath = new GeminiExecutor(configWithoutPath);
      expect(executorWithoutPath).toBeInstanceOf(GeminiExecutor);
    });
  });

  describe('validateRequest', () => {
    it('should throw error for empty question', async () => {
      const request = MockDataFactory.createMockGeminiRequest({ 
        question: '' 
      });

      await expect(executor.ask(request)).rejects.toThrow(GeminiException);
      await expect(executor.ask(request)).rejects.toThrow('Question cannot be empty');
    });

    it('should throw error for missing repository path', async () => {
      const request = MockDataFactory.createMockGeminiRequest({ 
        repositoryPath: '' 
      });

      await expect(executor.ask(request)).rejects.toThrow(GeminiException);
      await expect(executor.ask(request)).rejects.toThrow('Repository path is required');
    });

    it('should throw error for non-existent repository path', async () => {
      const mockStat = jest.mocked(fs.stat);
      mockStat.mockRejectedValue(new Error('ENOENT: no such file or directory'));

      const request = {
        repositoryPath: '/nonexistent/path',
        question: 'What does this code do?'
      };

      await expect(executor.ask(request)).rejects.toThrow(GeminiException);
      await expect(executor.ask(request)).rejects.toThrow('Repository path does not exist');
    });

    it('should throw error for non-directory repository path', async () => {
      const mockStat = jest.mocked(fs.stat);
      mockStat.mockResolvedValue({
        isDirectory: () => false
      } as any);

      const request = {
        repositoryPath: '/path/to/file.txt',
        question: 'What does this code do?'
      };

      await expect(executor.ask(request)).rejects.toThrow(GeminiException);
      await expect(executor.ask(request)).rejects.toThrow('Repository path is not a directory');
    });
  });

  describe('buildPrompt', () => {
    it('should build prompt with base prompt and question', () => {
      const request = {
        repositoryPath: '/path/to/repo',
        question: 'What does this code do?'
      };

      // Access private method for testing
      const buildPrompt = (executor as any).buildPrompt.bind(executor);
      const prompt = buildPrompt(request);

      expect(prompt).toContain(mockConfig.basePrompt);
      expect(prompt).toContain('What does this code do?');
    });

    it('should include additional context when provided', () => {
      const request = {
        repositoryPath: '/path/to/repo',
        question: 'What does this code do?',
        context: 'This is a React application'
      };

      const buildPrompt = (executor as any).buildPrompt.bind(executor);
      const prompt = buildPrompt(request);

      expect(prompt).toContain('This is a React application');
    });
  });

  describe('error handling', () => {
    it('should create proper GeminiException with error details', () => {
      const exception = new GeminiException(
        GeminiError.EXECUTION_FAILED,
        'Test error message',
        { detail: 'test' },
        'stderr output'
      );

      expect(exception.code).toBe(GeminiError.EXECUTION_FAILED);
      expect(exception.message).toBe('Test error message');
      expect(exception.details).toEqual({ detail: 'test' });
      expect(exception.stderr).toBe('stderr output');
      expect(exception.name).toBe('GeminiException');
    });

    it('should handle different error types correctly', () => {
      const errorTypes = [
        GeminiError.EXECUTION_FAILED,
        GeminiError.TIMEOUT_EXCEEDED,
        GeminiError.INVALID_RESPONSE,
        GeminiError.CLI_NOT_FOUND,
        GeminiError.INVALID_REQUEST,
        GeminiError.API_ERROR,
        GeminiError.INTERNAL_ERROR
      ];

      errorTypes.forEach(errorType => {
        const exception = new GeminiException(errorType, 'Test message');
        expect(exception.code).toBe(errorType);
      });
    });
  });

  describe('parseGeminiResponse', () => {
    it('should parse successful response correctly', () => {
      const mockResult = {
        stdout: 'This is the answer from Gemini CLI',
        stderr: '',
        exitCode: 0,
        executionTime: 1000
      };

      const parseResponse = (executor as any).parseGeminiResponse.bind(executor);
      const response = parseResponse(mockResult, Date.now() - 1000);

      expect(response.answer).toBe('This is the answer from Gemini CLI');
      expect(response.model).toBe(mockConfig.model);
      expect(response.execution_time).toBeGreaterThan(0);
    });

    it('should parse JSON response correctly', () => {
      const mockResult = {
        stdout: '{"answer": "JSON response", "tokens_used": 100}',
        stderr: '',
        exitCode: 0,
        executionTime: 1000
      };

      const parseResponse = (executor as any).parseGeminiResponse.bind(executor);
      const response = parseResponse(mockResult, Date.now() - 1000);

      expect(response.answer).toBe('JSON response');
      expect(response.tokens_used).toBe(100);
    });

    it('should throw error for non-zero exit code', () => {
      const mockResult = {
        stdout: '',
        stderr: 'Error message',
        exitCode: 1,
        executionTime: 1000
      };

      const parseResponse = (executor as any).parseGeminiResponse.bind(executor);
      
      expect(() => parseResponse(mockResult, Date.now() - 1000))
        .toThrow(GeminiException);
    });

    it('should throw error for empty response', () => {
      const mockResult = {
        stdout: '',
        stderr: '',
        exitCode: 0,
        executionTime: 1000
      };

      const parseResponse = (executor as any).parseGeminiResponse.bind(executor);
      
      expect(() => parseResponse(mockResult, Date.now() - 1000))
        .toThrow('Gemini CLI returned empty response');
    });
  });

  describe('integration with test utilities', () => {
    it('should work with mock data factory', () => {
      const request = MockDataFactory.createMockGeminiRequest();
      const response = MockDataFactory.createMockGeminiResponse();
      const config = MockDataFactory.createMockGeminiExecutorConfig();

      // Validate using test assertions
      TestAssertions.assertValidGeminiRequest(request);
      TestAssertions.assertValidGeminiResponse(response);

      expect(request.question).toBeTruthy();
      expect(response.answer).toBeTruthy();
      expect(config.model).toBeTruthy();
    });

    it('should validate Gemini exceptions properly', () => {
      const exception = new GeminiException(
        GeminiError.EXECUTION_FAILED,
        'Test execution failed'
      );

      TestAssertions.assertValidGeminiException(exception);
      expect(exception.code).toBe(GeminiError.EXECUTION_FAILED);
    });

    it('should use mock exec results for CLI commands', async () => {
      // Mock the executeCommand method directly
      const mockExecuteCommand = jest.spyOn(executor as any, 'executeCommand');
      mockExecuteCommand.mockResolvedValue({
        stdout: 'gemini-cli version 2.0.0',
        stderr: '',
        exitCode: 0,
        executionTime: 100
      });

      const version = await executor.getVersion();
      expect(version).toBe('gemini-cli version 2.0.0');
      
      mockExecuteCommand.mockRestore();
    });

    it('should handle mock error scenarios', async () => {
      // Mock the executeCommand method to throw an error
      const mockExecuteCommand = jest.spyOn(executor as any, 'executeCommand');
      mockExecuteCommand.mockRejectedValue(new Error('ENOENT'));

      await expect(executor.getVersion()).rejects.toThrow(GeminiException);
      
      mockExecuteCommand.mockRestore();
    });
  });

  describe('checkAvailability', () => {
    it('should return true when CLI is available', async () => {
      // Mock the executeCommand method directly
      const mockExecuteCommand = jest.spyOn(executor as any, 'executeCommand');
      mockExecuteCommand.mockResolvedValue({
        stdout: 'gemini-cli version 1.0.0',
        stderr: '',
        exitCode: 0,
        executionTime: 100
      });

      const isAvailable = await executor.checkAvailability();
      expect(isAvailable).toBe(true);
      
      mockExecuteCommand.mockRestore();
    });

    it('should return false when CLI is not available', async () => {
      // Mock the executeCommand method to throw an error
      const mockExecuteCommand = jest.spyOn(executor as any, 'executeCommand');
      mockExecuteCommand.mockRejectedValue(new Error('ENOENT'));

      const isAvailable = await executor.checkAvailability();
      expect(isAvailable).toBe(false);
      
      mockExecuteCommand.mockRestore();
    });
  });
}); 