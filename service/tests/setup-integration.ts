/**
 * Integration Tests Setup
 * Configures mocks and environment for integration testing
 */

// Mock all dependencies before any imports
jest.mock('../src/services/repository-manager', () => {
  const { MockRepositoryManager } = require('./__mocks__/repository-manager');
  return {
    RepositoryManager: MockRepositoryManager
  };
});

jest.mock('../src/services/gemini-executor', () => {
  const { MockGeminiExecutor } = require('./__mocks__/gemini-executor');
  return {
    GeminiExecutor: MockGeminiExecutor
  };
});

jest.mock('../src/utils/gemini-factory', () => {
  const { MockGeminiFactory } = require('./__mocks__/gemini-factory');
  return {
    GeminiFactory: MockGeminiFactory
  };
});

jest.mock('../src/config/config-manager', () => {
  const { ConfigManager, MockConfigManager } = require('./__mocks__/config-manager');
  return {
    ConfigManager
  };
});

jest.mock('simple-git', () => {
  const mockSimpleGit = require('./__mocks__/simple-git');
  return mockSimpleGit;
});

jest.mock('child_process');

jest.mock('../src/services/cleanup-service', () => {
  const { CleanupService } = require('./__mocks__/cleanup-service');
  return {
    CleanupService
  };
});

// Initialize test environment
beforeAll(async () => {
  // Ensure config is loaded
  const { MockConfigManager } = require('./__mocks__/config-manager');
  const config = MockConfigManager.getInstance();
  await config.load();
  
  console.log('✅ Integration test environment initialized');
});

afterAll(() => {
  console.log('✅ Integration test environment cleaned up');
}); 