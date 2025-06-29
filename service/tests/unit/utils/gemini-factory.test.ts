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
      api_timeout: 300,
      all_files_mode: 'auto',
      auto_all_files_thresholds: {
        max_files: 200,
        max_size_mb: 10
      },
      base_prompt: 'You are a code analysis assistant.'
    };
  });

  describe('createGeminiExecutorConfig', () => {
    it('should create GeminiExecutorConfig from GeminiConfig', () => {
      const executorConfig = createGeminiExecutorConfig(mockGeminiConfig);

      expect(executorConfig).toEqual({
        model: 'gemini-2.5-flash',
        apiTimeout: 300,
        allFilesMode: 'auto',
        autoAllFilesThresholds: {
          maxFiles: 200,
          maxSizeMb: 10
        },
        basePrompt: 'You are a code analysis assistant.',
        cliPath: 'gemini',
        maxBuffer: 1024 * 1024 * 10
      });
    });

    it('should use provided CLI path', () => {
      const customCliPath = '/usr/local/bin/gemini';
      const executorConfig = createGeminiExecutorConfig(mockGeminiConfig, customCliPath);

      expect(executorConfig.cliPath).toBe(customCliPath);
    });

    it('should use default CLI path when not provided', () => {
      const executorConfig = createGeminiExecutorConfig(mockGeminiConfig);

      expect(executorConfig.cliPath).toBe('gemini');
    });

    it('should set default maxBuffer', () => {
      const executorConfig = createGeminiExecutorConfig(mockGeminiConfig);

      expect(executorConfig.maxBuffer).toBe(1024 * 1024 * 10); // 10MB
    });

    it('should handle different model names', () => {
      const configs = [
        { ...mockGeminiConfig, model: 'gemini-1.5-flash' },
        { ...mockGeminiConfig, model: 'gemini-pro' }
      ];

      configs.forEach(config => {
        const executorConfig = createGeminiExecutorConfig(config);
        expect(executorConfig.model).toBe(config.model);
      });
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
        apiTimeout: 300,
        allFilesMode: 'auto',
        autoAllFilesThresholds: {
          maxFiles: 200,
          maxSizeMb: 10
        },
        basePrompt: 'You are a code analysis assistant.',
        cliPath: 'gemini',
        maxBuffer: 1024 * 1024 * 10
      }));
      
      expect(executor).toBeDefined();
    });

    it('should create executor with custom CLI path', () => {
      const customCliPath = '/custom/path/gemini';
      const executor = createGeminiExecutor(mockGeminiConfig, customCliPath);

      expect(executor).toBeDefined();
    });
  });
}); 