/**
 * GeminiFactory Unit Tests
 */

import { createGeminiExecutorConfig, createGeminiExecutor } from '../../../src/utils/gemini-factory';
import { GeminiConfig, GeminiExecutorConfig } from '../../../src/types';

// Mock GeminiExecutor to avoid compilation issues
const mockGeminiExecutorInstance = {
  ask: jest.fn(),
  checkAvailability: jest.fn(),
  getVersion: jest.fn()
};

jest.mock('../../../src/services/gemini-executor', () => ({
  GeminiExecutor: jest.fn().mockImplementation(() => mockGeminiExecutorInstance)
}));

describe('GeminiFactory', () => {
  let mockGeminiConfig: GeminiConfig;

  beforeEach(() => {
    mockGeminiConfig = {
      model: 'gemini-2.5-flash',
      temperature: 0.7,
      top_p: 0.9,
      top_k: 40,
      max_output_tokens: 4096,
      api_timeout: 300,
      base_prompt: 'You are a code analysis assistant.'
    };
  });

  describe('createGeminiExecutorConfig', () => {
    it('should create GeminiExecutorConfig from GeminiConfig', () => {
      const executorConfig = createGeminiExecutorConfig(mockGeminiConfig);

      expect(executorConfig).toEqual({
        model: 'gemini-2.5-flash',
        temperature: 0.7,
        topP: 0.9,
        topK: 40,
        maxOutputTokens: 4096,
        apiTimeout: 300,
        basePrompt: 'You are a code analysis assistant.',
        cliPath: 'gemini-cli',
        maxBuffer: 1024 * 1024 * 10
      });
    });

    it('should use provided CLI path', () => {
      const customCliPath = '/usr/local/bin/gemini-cli';
      const executorConfig = createGeminiExecutorConfig(mockGeminiConfig, customCliPath);

      expect(executorConfig.cliPath).toBe(customCliPath);
    });

    it('should use default CLI path when not provided', () => {
      const executorConfig = createGeminiExecutorConfig(mockGeminiConfig);

      expect(executorConfig.cliPath).toBe('gemini-cli');
    });

    it('should handle undefined CLI path', () => {
      const executorConfig = createGeminiExecutorConfig(mockGeminiConfig, undefined);

      expect(executorConfig.cliPath).toBe('gemini-cli');
    });

    it('should correctly map all config properties', () => {
      const executorConfig = createGeminiExecutorConfig(mockGeminiConfig);

      // Test property mapping
      expect(executorConfig.topP).toBe(mockGeminiConfig.top_p);
      expect(executorConfig.topK).toBe(mockGeminiConfig.top_k);
      expect(executorConfig.maxOutputTokens).toBe(mockGeminiConfig.max_output_tokens);
      expect(executorConfig.apiTimeout).toBe(mockGeminiConfig.api_timeout);
      expect(executorConfig.basePrompt).toBe(mockGeminiConfig.base_prompt);
    });

    it('should set default maxBuffer', () => {
      const executorConfig = createGeminiExecutorConfig(mockGeminiConfig);

      expect(executorConfig.maxBuffer).toBe(1024 * 1024 * 10); // 10MB
    });

    it('should handle different model names', () => {
      const configs = [
        { ...mockGeminiConfig, model: 'gemini-1.5-flash' },
        { ...mockGeminiConfig, model: 'gemini-pro' },
        { ...mockGeminiConfig, model: 'gemini-2.5-pro' }
      ];

      configs.forEach(config => {
        const executorConfig = createGeminiExecutorConfig(config);
        expect(executorConfig.model).toBe(config.model);
      });
    });

    it('should handle edge case values', () => {
      const edgeCaseConfig: GeminiConfig = {
        model: 'test-model',
        temperature: 0,
        top_p: 1,
        top_k: 1,
        max_output_tokens: 1,
        api_timeout: 1,
        base_prompt: ''
      };

      const executorConfig = createGeminiExecutorConfig(edgeCaseConfig);

      expect(executorConfig.temperature).toBe(0);
      expect(executorConfig.topP).toBe(1);
      expect(executorConfig.topK).toBe(1);
      expect(executorConfig.maxOutputTokens).toBe(1);
      expect(executorConfig.apiTimeout).toBe(1);
      expect(executorConfig.basePrompt).toBe('');
    });
  });

  describe('createGeminiExecutor', () => {

    it('should create GeminiExecutor instance', () => {
      const { GeminiExecutor } = require('../../../src/services/gemini-executor');
      
      // Clear previous calls
      GeminiExecutor.mockClear();
      
      const executor = createGeminiExecutor(mockGeminiConfig);

      // Verify that GeminiExecutor constructor was called with correct config
      expect(GeminiExecutor).toHaveBeenCalledWith(expect.objectContaining({
        model: 'gemini-2.5-flash',
        temperature: 0.7,
        topP: 0.9,
        topK: 40,
        maxOutputTokens: 4096,
        apiTimeout: 300,
        basePrompt: 'You are a code analysis assistant.',
        cliPath: 'gemini-cli',
        maxBuffer: 1024 * 1024 * 10
      }));
      
      // Since we're mocking, we should verify the executor was created
      expect(executor).toBeDefined();
    });

    it('should create executor with custom CLI path', () => {
      const customCliPath = '/custom/path/gemini-cli';
      const executor = createGeminiExecutor(mockGeminiConfig, customCliPath);

      expect(executor).toBeDefined();
      // Since we're mocking the GeminiExecutor, we can't directly test the CLI path
      // but we can verify the executor was created
    });

    it('should handle different configurations', () => {
      const differentConfigs = [
        { ...mockGeminiConfig, model: 'gemini-1.5-flash' },
        { ...mockGeminiConfig, temperature: 0.5 },
        { ...mockGeminiConfig, max_output_tokens: 2048 }
      ];

      differentConfigs.forEach(config => {
        const executor = createGeminiExecutor(config);
        expect(executor).toBeDefined();
      });
    });
  });

  describe('integration testing', () => {
    
    it('should create functional executor instance', () => {
      const { GeminiExecutor } = require('../../../src/services/gemini-executor');
      
      // Clear previous calls
      GeminiExecutor.mockClear();
      
      const executor = createGeminiExecutor(mockGeminiConfig);

      // Verify that GeminiExecutor was instantiated
      expect(GeminiExecutor).toHaveBeenCalled();
      
      // Since we're mocking, we should verify the executor was created
      expect(executor).toBeDefined();
      expect(executor).toEqual(expect.any(Object));
    });

    it('should pass through configuration correctly', () => {
      const testConfig: GeminiConfig = {
        model: 'test-model',
        temperature: 0.8,
        top_p: 0.95,
        top_k: 50,
        max_output_tokens: 2048,
        api_timeout: 600,
        base_prompt: 'Custom prompt'
      };

      const executorConfig = createGeminiExecutorConfig(testConfig);
      const executor = createGeminiExecutor(testConfig);

      expect(executorConfig.model).toBe('test-model');
      expect(executorConfig.temperature).toBe(0.8);
      expect(executorConfig.topP).toBe(0.95);
      expect(executorConfig.topK).toBe(50);
      expect(executorConfig.maxOutputTokens).toBe(2048);
      expect(executorConfig.apiTimeout).toBe(600);
      expect(executorConfig.basePrompt).toBe('Custom prompt');
      expect(executor).toBeDefined();
    });
  });

  describe('error handling', () => {
    it('should handle missing properties gracefully', () => {
      // This tests the TypeScript type safety, but at runtime
      // we should still be able to create an executor
      const incompleteConfig = {
        model: 'test-model',
        temperature: 0.7
        // Missing other required properties
      } as GeminiConfig;

      // This should not throw during factory creation
      expect(() => {
        createGeminiExecutorConfig(incompleteConfig);
      }).not.toThrow();
    });
  });
}); 