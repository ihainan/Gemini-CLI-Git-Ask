/**
 * Integration tests for /api/v1/ask endpoint
 */

// Import setup first to ensure mocks are applied
import '../../setup-integration';

import request from 'supertest';
import express from 'express';
import { MockDataFactory, TestAPIHelper } from '../../helpers/test-utils';
import { createTestApp } from '../../helpers/test-app';
import { ApiErrorCode } from '../../../src/types';

// Import from CommonJS mock
const { setMockExecResult, clearMockExecResults } = require('../../__mocks__/child_process');

describe('POST /api/v1/ask', () => {
  let app: express.Application;
  let apiHelper: TestAPIHelper;

  beforeAll(async () => {
    // Create test app
    app = await createTestApp();
    apiHelper = new TestAPIHelper(app);
  });

  beforeEach(() => {
    jest.clearAllMocks();
    clearMockExecResults();
    
    // Setup default mock responses
    setupDefaultMocks();
  });

  afterEach(() => {
    // Ensure default mocks are restored after each test
    setupDefaultMocks();
  });

  function setupDefaultMocks() {
    // Mock successful Gemini CLI execution
    setMockExecResult('echo "You are a code analysis assistant.\n\nQuestion: What does this code do?" | gemini --model gemini-2.5-flash --all_files', {
      stdout: 'This repository contains a Node.js web application with REST API endpoints.',
      stderr: ''
    });

    // Mock version check - critical for health check tests
    setMockExecResult('gemini --version', {
      stdout: 'gemini version 1.0.0',
      stderr: ''
    });

    // Add more generic patterns to catch variations
    setMockExecResult('echo "You are a code analysis assistant.\n\nQuestion: Describe this repository" | gemini --model gemini-2.5-flash --all_files', {
      stdout: 'This repository contains code analysis functionality.',
      stderr: ''
    });

    setMockExecResult('echo "You are a code analysis assistant.\n\nQuestion: Describe the architecture" | gemini --model gemini-2.5-flash --all_files', {
      stdout: 'This repository has a modular architecture.',
      stderr: ''
    });

    setMockExecResult('echo "You are a code analysis assistant.\n\nQuestion: List the main components" | gemini --model gemini-2.5-flash --all_files', {
      stdout: 'Main components: API routes, services, database.',
      stderr: ''
    });
  }

  describe('successful requests', () => {
    it('should return answer for valid repository question', async () => {
      const mockRequest = MockDataFactory.createMockRequest({
        repository_url: 'https://github.com/test/repo',
        question: 'What does this code do?'
      });

      const response = await apiHelper.askQuestion(mockRequest);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'success');
      expect(response.body).toHaveProperty('answer');
      expect(response.body).toHaveProperty('repository');
      expect(response.body).toHaveProperty('execution_time');
      expect(typeof response.body.answer).toBe('string');
      expect(response.body.answer.length).toBeGreaterThan(0);
    });

    it('should handle different repository URL formats', async () => {
      const testUrls = [
        'https://github.com/owner/repo',
        'https://github.com/owner/repo.git',
        'https://github.com/owner/repo/'
      ];

      for (const url of testUrls) {
        const mockRequest = MockDataFactory.createMockRequest({
          repository_url: url,
          question: 'Describe this repository'
        });

        const response = await apiHelper.askQuestion(mockRequest);
        
        expect(response.status).toBe(200);
        expect(response.body.status).toBe('success');
        expect(response.body).toHaveProperty('answer');
      }
    });

    it('should handle branch specification', async () => {
      const mockRequest = MockDataFactory.createMockRequest({
        repository_url: 'https://github.com/test/repo',
        question: 'What does this code do?',
        branch: 'develop'
      });

      const response = await apiHelper.askQuestion(mockRequest);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.repository.branch).toBe('develop');
    });

    it('should handle timeout specification', async () => {
      const mockRequest = MockDataFactory.createMockRequest({
        repository_url: 'https://github.com/test/repo',
        question: 'What does this code do?',
        timeout: 600
      });

      const response = await apiHelper.askQuestion(mockRequest);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
    });

    it('should return proper response structure', async () => {
      const mockRequest = MockDataFactory.createMockRequest();
      const response = await apiHelper.askQuestion(mockRequest);

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        status: 'success',
        answer: expect.any(String),
        repository: {
          url: expect.any(String),
          branch: expect.any(String),
          commit_hash: expect.any(String)
        },
        execution_time: expect.any(Number)
      });
    });
  });

  describe('validation errors', () => {
    it('should return 400 for missing repository_url', async () => {
      const invalidRequest = {
        question: 'What does this code do?'
        // missing repository_url
      };

      const response = await apiHelper.askQuestion(invalidRequest);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('status', 'error');
      expect(response.body).toHaveProperty('error_code', ApiErrorCode.INVALID_REQUEST);
      expect(response.body).toHaveProperty('details');
      expect(response.body.details).toHaveProperty('validation_errors');
      expect(response.body.details.validation_errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'repository_url',
            message: expect.stringContaining('repository_url is required')
          })
        ])
      );
    });

    it('should return 400 for missing question', async () => {
      const invalidRequest = {
        repository_url: 'https://github.com/test/repo'
        // missing question
      };

      const response = await apiHelper.askQuestion(invalidRequest);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('status', 'error');
      expect(response.body).toHaveProperty('error_code', ApiErrorCode.INVALID_REQUEST);
      expect(response.body).toHaveProperty('details');
      expect(response.body.details).toHaveProperty('validation_errors');
      expect(response.body.details.validation_errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'question',
            message: expect.stringContaining('question is required')
          })
        ])
      );
    });

    it('should return 400 for invalid repository URL', async () => {
      const invalidUrls = [
        'not-a-url',
        'http://example.com',
        '',
        'ftp://example.com/repo',
        'javascript:alert(1)'
      ];

      for (const url of invalidUrls) {
        const invalidRequest = MockDataFactory.createMockRequest({
          repository_url: url,
          question: 'What does this code do?'
        });

        const response = await apiHelper.askQuestion(invalidRequest);
        
        expect(response.status).toBe(400);
        expect(response.body.status).toBe('error');
        expect(response.body.error_code).toBe(ApiErrorCode.INVALID_REQUEST);
      }
    });

    it('should return 400 for empty question', async () => {
      const invalidRequest = MockDataFactory.createMockRequest({
        repository_url: 'https://github.com/test/repo',
        question: ''
      });

      const response = await apiHelper.askQuestion(invalidRequest);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('status', 'error');
      expect(response.body).toHaveProperty('error_code', ApiErrorCode.INVALID_REQUEST);
      expect(response.body).toHaveProperty('details');
      expect(response.body.details).toHaveProperty('validation_errors');
      expect(response.body.details.validation_errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'question',
            message: expect.stringContaining('question is required')
          })
        ])
      );
    });

    it('should return 400 for invalid timeout', async () => {
      const invalidTimeouts = [-1, 0];

      for (const timeout of invalidTimeouts) {
        const invalidRequest = MockDataFactory.createMockRequest({
          repository_url: 'https://github.com/test/repo',
          question: 'What does this code do?',
          timeout: timeout
        });

        const response = await apiHelper.askQuestion(invalidRequest);
        
        expect(response.status).toBe(400);
        expect(response.body.status).toBe('error');
        expect(response.body.error_code).toBe(ApiErrorCode.INVALID_REQUEST);
      }
      
      // Test string timeout
      const stringTimeoutRequest = {
        repository_url: 'https://github.com/test/repo',
        question: 'What does this code do?',
        timeout: 'invalid'
      };
      
      const stringResponse = await apiHelper.askQuestion(stringTimeoutRequest);
      expect(stringResponse.status).toBe(400);
      expect(stringResponse.body.status).toBe('error');
      expect(stringResponse.body.error_code).toBe(ApiErrorCode.INVALID_REQUEST);
    });
  });

  describe('repository errors', () => {
    it('should return 500 for non-existent repository', async () => {
      // Mock repository not found scenario using jest.spyOn
      const { MockRepositoryManager } = require('../../../tests/__mocks__/repository-manager');
      const ensureSpy = jest.spyOn(MockRepositoryManager.prototype, 'ensureRepository')
        .mockRejectedValueOnce(new Error('Repository not found'));

      const mockRequest = MockDataFactory.createMockRequest({
        repository_url: 'https://github.com/nonexistent/repo',
        question: 'What does this code do?'
      });

      const response = await apiHelper.askQuestion(mockRequest);

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('status', 'error');
      
      // Clean up spy
      ensureSpy.mockRestore();
    });

    it('should return 500 for repository clone failures', async () => {
      // Mock clone failure scenario using jest.spyOn
      const { MockRepositoryManager } = require('../../../tests/__mocks__/repository-manager');
      const ensureSpy = jest.spyOn(MockRepositoryManager.prototype, 'ensureRepository')
        .mockRejectedValueOnce(new Error('Failed to clone repository'));

      const mockRequest = MockDataFactory.createMockRequest({
        repository_url: 'https://github.com/test/repo',
        question: 'What does this code do?'
      });

      const response = await apiHelper.askQuestion(mockRequest);

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('status', 'error');
      
      // Clean up spy
      ensureSpy.mockRestore();
    });
  });

  describe('gemini execution errors', () => {
    it('should return 500 for Gemini CLI failures', async () => {
      // Mock Gemini CLI error using jest.spyOn
      const { MockGeminiExecutor } = require('../../../tests/__mocks__/gemini-executor');
      const askSpy = jest.spyOn(MockGeminiExecutor.prototype, 'ask')
        .mockRejectedValueOnce(new Error('Gemini API request failed'));

      const mockRequest = MockDataFactory.createMockRequest({
        repository_url: 'https://github.com/test/repo',
        question: 'What does this code do?'
      });

      const response = await apiHelper.askQuestion(mockRequest);

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('status', 'error');
      expect(response.body).toHaveProperty('error_code');
      
      // Clean up spy
      askSpy.mockRestore();
    });

    it('should return 500 for timeout errors', async () => {
      // Mock timeout scenario using jest.spyOn for automatic cleanup
      const { MockGeminiExecutor } = require('../../../tests/__mocks__/gemini-executor');
      const askSpy = jest.spyOn(MockGeminiExecutor.prototype, 'ask')
        .mockRejectedValueOnce(new Error('Timeout exceeded'));

      const mockRequest = MockDataFactory.createMockRequest({
        repository_url: 'https://github.com/test/repo',
        question: 'What does this code do?',
        timeout: 30  // Use valid timeout value (>= 10)
      });

      const response = await apiHelper.askQuestion(mockRequest);

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('status', 'error');
      
      // Clean up spy
      askSpy.mockRestore();
    });
  });

  describe('concurrent requests', () => {
    it('should handle concurrent requests to same repository', async () => {
      const mockRequest = MockDataFactory.createMockRequest({
        repository_url: 'https://github.com/test/repo',
        question: 'What does this code do?'
      });

      // Simulate multiple concurrent requests
      const promises = Array(3).fill(null).map(() => 
        apiHelper.askQuestion(mockRequest)
      );

      const results = await Promise.all(promises);

      // All requests should succeed
      results.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.status).toBe('success');
      });
    });

    it('should handle concurrent requests to different repositories', async () => {
      const requests = [
        MockDataFactory.createMockRequest({
          repository_url: 'https://github.com/test/repo1',
          question: 'What does this code do?'
        }),
        MockDataFactory.createMockRequest({
          repository_url: 'https://github.com/test/repo2',
          question: 'Describe the architecture'
        }),
        MockDataFactory.createMockRequest({
          repository_url: 'https://github.com/test/repo3',
          question: 'List the main components'
        })
      ];

      const promises = requests.map(req => apiHelper.askQuestion(req));
      const results = await Promise.all(promises);

      // All requests should succeed
      results.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.status).toBe('success');
      });
    });
  });

  describe('edge cases', () => {
    it('should handle very long questions', async () => {
      const longQuestion = 'Please analyze this code and explain '.repeat(50) + 'what it does?';
      const mockRequest = MockDataFactory.createMockRequest({
        repository_url: 'https://github.com/test/repo',
        question: longQuestion
      });

      const response = await apiHelper.askQuestion(mockRequest);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
    });

    it('should handle special characters in question', async () => {
      const specialQuestion = 'What does this code do? 🤔 Can you explain the @#$%^&*() symbols?';
      const mockRequest = MockDataFactory.createMockRequest({
        repository_url: 'https://github.com/test/repo',
        question: specialQuestion
      });

      const response = await apiHelper.askQuestion(mockRequest);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
    });
  });
});

describe('GET /api/v1/stats', () => {
  let app: express.Application;
  let apiHelper: TestAPIHelper;

  beforeAll(async () => {
    app = await createTestApp();
    apiHelper = new TestAPIHelper(app);
  });

  it('should return repository statistics', async () => {
    const response = await apiHelper.getStats();

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('status', 'success');
    expect(response.body).toHaveProperty('data');
  });
});

describe('GET /api/v1/gemini/health', () => {
  let app: express.Application;
  let apiHelper: TestAPIHelper;

  beforeAll(async () => {
    app = await createTestApp();
    apiHelper = new TestAPIHelper(app);
  });

  beforeEach(() => {
    // Setup default mock for version check
    setMockExecResult('gemini --version', {
      stdout: 'gemini version 1.0.0',
      stderr: ''
    });
  });

  it('should return Gemini CLI health status', async () => {
    const response = await apiHelper.checkGeminiHealth();

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('status', 'success');
    expect(response.body).toHaveProperty('gemini_cli');
    expect(response.body.gemini_cli).toHaveProperty('available', true);
    expect(response.body.gemini_cli).toHaveProperty('version');
  });

  it('should return 503 when Gemini CLI is not available', async () => {
    // Mock Gemini CLI unavailable using jest.spyOn
    const { MockGeminiExecutor } = require('../../../tests/__mocks__/gemini-executor');
    const availabilitySpy = jest.spyOn(MockGeminiExecutor.prototype, 'checkAvailability')
      .mockResolvedValueOnce(false);

    const response = await apiHelper.checkGeminiHealth();

    expect(response.status).toBe(503);
    expect(response.body).toHaveProperty('status', 'error');
    expect(response.body).toHaveProperty('error_code', ApiErrorCode.GEMINI_EXECUTION_FAILED);
    
    // Clean up spy
    availabilitySpy.mockRestore();
  });
});

describe('Health endpoints', () => {
  let app: express.Application;
  let apiHelper: TestAPIHelper;

  beforeAll(async () => {
    app = await createTestApp();
    apiHelper = new TestAPIHelper(app);
  });

  it('should return health status', async () => {
    const response = await apiHelper.checkHealth();

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('status', 'ok');
    expect(response.body).toHaveProperty('timestamp');
    expect(response.body).toHaveProperty('service', 'gemini-cli-git-ask-service');
  });

  it('should return ready status', async () => {
    const response = await apiHelper.checkReady();

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('status', 'ready');
    expect(response.body).toHaveProperty('timestamp');
  });
}); 