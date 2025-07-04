/**
 * Mock implementation of GeminiFactory
 */

const { MockGeminiExecutor } = require('./gemini-executor');

class MockGeminiFactory {
  static createExecutor(config) {
    return new MockGeminiExecutor(config);
  }
}

// CommonJS exports
module.exports = {
  MockGeminiFactory,
  GeminiFactory: MockGeminiFactory
}; 