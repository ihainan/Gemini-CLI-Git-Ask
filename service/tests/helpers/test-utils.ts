/**
 * Test Utilities
 * Common helper functions for testing
 */

import { Express } from 'express';
import request from 'supertest';

/**
 * Test API request helper
 */
export class TestAPIHelper {
  constructor(private app: Express) {}

  /**
   * Make POST request to /api/v1/ask endpoint
   */
  async askQuestion(payload: {
    repository_url: string;
    question: string;
    branch?: string;
    timeout?: number;
  }) {
    return request(this.app)
      .post('/api/v1/ask')
      .send(payload)
      .set('Content-Type', 'application/json');
  }

  /**
   * Make GET request to health endpoint
   */
  async checkHealth() {
    return request(this.app).get('/health');
  }

  /**
   * Make GET request to ready endpoint
   */
  async checkReady() {
    return request(this.app).get('/ready');
  }
}

/**
 * Mock data factory
 */
export class MockDataFactory {
  /**
   * Create mock repository request
   */
  static createMockRequest(overrides?: Partial<{
    repository_url: string;
    question: string;
    branch: string;
    timeout: number;
  }>) {
    return {
      repository_url: 'https://github.com/test/repo',
      question: 'What does this code do?',
      branch: 'main',
      timeout: 300,
      ...overrides
    };
  }

  /**
   * Create mock success response
   */
  static createMockSuccessResponse(overrides?: Partial<{
    answer: string;
    repository: {
      url: string;
      branch: string;
      commit_hash: string;
    };
    execution_time: number;
  }>) {
    return {
      status: 'success',
      answer: 'This is a test repository.',
      repository: {
        url: 'https://github.com/test/repo',
        branch: 'main',
        commit_hash: 'abc123def456'
      },
      execution_time: 1.5,
      ...overrides
    };
  }

  /**
   * Create mock error response
   */
  static createMockErrorResponse(overrides?: Partial<{
    error_code: string;
    message: string;
    details?: any;
  }>) {
    return {
      status: 'error',
      error_code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
      ...overrides
    };
  }
}

/**
 * Test environment utilities
 */
export class TestEnvironmentUtils {
  /**
   * Create temporary directory for test repositories
   */
  static createTempRepoDir(): string {
    const tempDir = `/tmp/test-repos-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    return tempDir;
  }

  /**
   * Clean up test environment
   */
  static async cleanup(paths: string[]): Promise<void> {
    const fs = await import('fs/promises');
    for (const path of paths) {
      try {
        await fs.rm(path, { recursive: true, force: true });
      } catch (error) {
        console.warn(`Failed to clean up path: ${path}`, error);
      }
    }
  }

  /**
   * Wait for a condition to be true
   */
  static async waitFor(
    condition: () => boolean | Promise<boolean>,
    timeout: number = 5000,
    interval: number = 100
  ): Promise<void> {
    const startTime = Date.now();
    while (Date.now() - startTime < timeout) {
      const result = await condition();
      if (result) {
        return;
      }
      await new Promise(resolve => setTimeout(resolve, interval));
    }
    throw new Error(`Condition not met within ${timeout}ms`);
  }
}

/**
 * Mock filesystem operations for testing
 */
export class MockFileSystem {
  private static mockFiles: Map<string, string> = new Map();

  static mockFile(path: string, content: string): void {
    this.mockFiles.set(path, content);
  }

  static getMockFile(path: string): string | undefined {
    return this.mockFiles.get(path);
  }

  static clearMocks(): void {
    this.mockFiles.clear();
  }

  static hasMockFile(path: string): boolean {
    return this.mockFiles.has(path);
  }
} 