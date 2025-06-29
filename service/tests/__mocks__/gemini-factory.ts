/**
 * Mock implementation of GeminiFactory
 */

import { MockGeminiExecutor } from './gemini-executor';

export class MockGeminiFactory {
  public static createExecutor(config: any): MockGeminiExecutor {
    return new MockGeminiExecutor(config);
  }
}

// Mock the GeminiFactory class
export const GeminiFactory = MockGeminiFactory; 