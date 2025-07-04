/**
 * Real Integration Tests for Gemini CLI
 * Tests actual Gemini CLI functionality with real API calls
 */

import { GeminiExecutor } from '../../src/services/gemini-executor';
import { GeminiExecutorConfig } from '../../src/types';
import { skipIfNotEnabled } from './setup-real-integration';

describe('Gemini CLI Real Integration Tests', () => {
  let geminiExecutor: GeminiExecutor;
  let config: GeminiExecutorConfig;
  
  beforeAll(async () => {
    if (skipIfNotEnabled()) {
      return;
    }
    
    const globalConfig = (global as any).REAL_INTEGRATION_CONFIG;
    
    config = {
      model: globalConfig.geminiModel,
      apiTimeout: globalConfig.testTimeout,
      allFilesMode: 'never', // Start with conservative mode
      autoAllFilesThresholds: {
        maxFiles: 50,
        maxSizeMb: 5
      },
      basePrompt: 'You are a helpful code analysis assistant.'
    };
    
    geminiExecutor = new GeminiExecutor(config);
  });
  
  describe('Basic Gemini CLI functionality', () => {
    it('should check if Gemini CLI is available', async () => {
      if (skipIfNotEnabled()) return;
      
      const isAvailable = await geminiExecutor.checkAvailability();
      expect(isAvailable).toBe(true);
    }, 30000);
    
    it('should get Gemini CLI version', async () => {
      if (skipIfNotEnabled()) return;
      
      const version = await geminiExecutor.getVersion();
      expect(version).toMatch(/^\d+\.\d+\.\d+$/); // Expect version format like "0.1.9"
      expect(version.length).toBeGreaterThan(0);
    }, 10000);
    
    it('should perform health check', async () => {
      if (skipIfNotEnabled()) return;
      
      const isAvailable = await geminiExecutor.checkAvailability();
      const version = await geminiExecutor.getVersion();
      
      expect(isAvailable).toBe(true);
      expect(version).toBeTruthy();
      expect(version).toMatch(/^\d+\.\d+\.\d+$/); // Expect version format like "0.1.9"
    }, 30000);
  });
  
  describe('Real AI Query Processing', () => {
    it('should process a simple question', async () => {
      if (skipIfNotEnabled()) return;
      
      const testQuestion = 'What is the capital of France?';
      const tempDir = (global as any).REAL_INTEGRATION_CONFIG.tempDir;
      
      const result = await geminiExecutor.ask({
        question: testQuestion,
        repositoryPath: tempDir // Use temp directory as repository path
      });
      
      expect(result).toHaveProperty('answer');
      expect(result.answer).toMatch(/Paris/i);
      expect(result).toHaveProperty('execution_time');
      expect(result.execution_time).toBeGreaterThan(0);
      expect(result).toHaveProperty('model', config.model);
    }, 60000);
    
    it('should handle code analysis questions', async () => {
      if (skipIfNotEnabled()) return;
      
      const testQuestion = 'Explain this JavaScript code: function add(a, b) { return a + b; }';
      const tempDir = (global as any).REAL_INTEGRATION_CONFIG.tempDir;
      
      const result = await geminiExecutor.ask({
        question: testQuestion,
        repositoryPath: tempDir
      });
      
      expect(result).toHaveProperty('answer');
      expect(result.answer.toLowerCase()).toMatch(/function|add|parameter|return/);
      expect(result).toHaveProperty('execution_time');
      expect(result.execution_time).toBeGreaterThan(0);
    }, 60000);
    
    it('should handle timeout gracefully', async () => {
      if (skipIfNotEnabled()) return;
      
      // Create a config with very short timeout
      const shortTimeoutConfig = {
        ...config,
        apiTimeout: 1 // 1ms - should definitely timeout
      };
      
      const shortTimeoutExecutor = new GeminiExecutor(shortTimeoutConfig);
      
      const tempDir = (global as any).REAL_INTEGRATION_CONFIG.tempDir;
      
      await expect(shortTimeoutExecutor.ask({
        question: 'This should timeout because the timeout is too short',
        repositoryPath: tempDir
      })).rejects.toThrow(/timeout|timed out|SIGTERM|killed/i);
    }, 10000);
  });
  
  describe('Error Handling', () => {
    it('should handle invalid API key gracefully', async () => {
      if (skipIfNotEnabled()) return;
      
      // This test depends on the API key being invalid
      // We'll skip it if we can't control the environment
      console.log('⚠️ Skipping invalid API key test - requires controlled environment');
    });
    
    it('should handle invalid model gracefully', async () => {
      if (skipIfNotEnabled()) return;
      
      const invalidModelConfig = {
        ...config,
        model: 'invalid-model-name-that-does-not-exist'
      };
      
      const invalidModelExecutor = new GeminiExecutor(invalidModelConfig);
      
      const tempDir = (global as any).REAL_INTEGRATION_CONFIG.tempDir;
      
      await expect(invalidModelExecutor.ask({
        question: 'This should fail',
        repositoryPath: tempDir
      })).rejects.toThrow();
    }, 30000);
  });
  
  describe('Performance Tests', () => {
    it('should complete simple queries within reasonable time', async () => {
      if (skipIfNotEnabled()) return;
      
      const startTime = Date.now();
      
      const tempDir = (global as any).REAL_INTEGRATION_CONFIG.tempDir;
      
      const result = await geminiExecutor.ask({
        question: 'Hello, how are you?',
        repositoryPath: tempDir
      });
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      expect(result).toHaveProperty('answer');
      expect(duration).toBeLessThan(30000); // Should complete within 30 seconds
      
      console.log(`✅ Query completed in ${duration}ms`);
    }, 60000);
  });
}); 