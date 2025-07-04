/**
 * Mock implementation of GeminiExecutor
 */

class MockGeminiExecutor {
  constructor(config) {
    // Mock constructor - accept config but ignore it
  }

  async ask(request) {
    // Simple mock that succeeds by default
    // Individual tests can override this using jest.spyOn if they need failure scenarios
    return Promise.resolve({
      answer: 'This repository contains a Node.js web application with REST API endpoints.',
      model: 'gemini-2.5-flash',
      execution_time: 1500,
      tokens_used: 150
    });
  }

  async checkAvailability() {
    // Simple mock that returns true by default
    // Individual tests can override this using jest.spyOn if they need false scenarios
    return Promise.resolve(true);
  }

  async getVersion() {
    // Mock version check
    return 'gemini version 1.0.0';
  }

  async checkHealth() {
    // Mock health check response
    return {
      available: true,
      version: 'gemini version 1.0.0',
      status: 'healthy'
    };
  }

  async getSingleRepositoryStats(repositoryPath) {
    // Mock repository stats
    return {
      fileCount: 25,
      totalSizeMb: 2.5,
      codeFileCount: 15
    };
  }
}

// CommonJS exports
module.exports = {
  MockGeminiExecutor,
  GeminiExecutor: MockGeminiExecutor
};
 