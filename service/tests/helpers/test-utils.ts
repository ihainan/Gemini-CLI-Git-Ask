/**
 * Test Utilities
 * Common helper functions for testing
 */

import { Express } from 'express';
import request from 'supertest';
import {
  RepositoryInfo,
  RepositoryMetadata,
  RepositoryError
} from '../../src/types';

/**
 * Test API request helper
 */
export class TestAPIHelper {
  constructor(private app: Express) {}

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

  /**
   * Make GET request to metrics endpoint
   */
  async getMetrics() {
    return request(this.app).get('/metrics');
  }
}

/**
 * Mock data factory with type safety
 */
export class MockDataFactory {
  /**
   * Create mock API request (placeholder for future implementation)
   */
  static createMockRequest(overrides?: any): any {
    return {
      repository_url: 'https://github.com/test/repo',
      question: 'What does this code do?',
      branch: 'main',
      timeout: 300,
      ...overrides
    };
  }

  /**
   * Create mock successful response (placeholder for future implementation)
   */
  static createMockSuccessResponse(overrides?: any): any {
    return {
      status: 'success',
      answer: 'This is a test repository.',
      repository: {
        url: 'https://github.com/test/repo',
        branch: 'main'
      },
      execution_time: 1.5,
      ...overrides
    };
  }

  /**
   * Create mock error response (placeholder for future implementation)
   */
  static createMockErrorResponse(overrides?: any): any {
    return {
      status: 'error',
      error_code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
      ...overrides
    };
  }

  /**
   * Create mock repository metadata
   */
  static createMockRepositoryMetadata(overrides?: Partial<RepositoryMetadata>): RepositoryMetadata {
    return {
      url: 'https://github.com/test/repo',
      branch: 'main',
      last_updated: new Date().toISOString(),
      last_accessed: new Date().toISOString(),
      commit_hash: 'abc123def456',
      clone_method: 'https',
      ...overrides
    };
  }

  /**
   * Create mock repository info
   */
  static createMockRepositoryInfo(overrides?: Partial<RepositoryInfo>): RepositoryInfo {
    return {
      url: 'https://github.com/test/repo',
      branch: 'main',
      localPath: '/tmp/test_repo_main_abc123',
      exists: true,
      metadata: MockDataFactory.createMockRepositoryMetadata(),
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

  /**
   * Generate unique test ID
   */
  static generateTestId(): string {
    return `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Create mock configuration for testing
   */
  static createMockConfig() {
    return {
      server: {
        host: 'localhost',
        port: 8080,
        max_concurrent_requests: 100
      },
      gemini: {
        model: 'gemini-1.5-flash-latest',
        temperature: 0.7,
        top_p: 0.9,
        top_k: 40,
        max_output_tokens: 4096,
        api_timeout: 300,
        base_prompt: 'You are a helpful assistant'
      },
      repository: {
        storage_path: './test-repositories',
        clone_method: 'https',
        clone_depth: 1,
        update_threshold_hours: 24,
        access_timeout_hours: 72,
        max_concurrent_operations: 10,
        default_branch: 'main'
      },
      cleanup: {
        enabled: false, // Disable for testing
        interval_hours: 24,
        retention_days: 7,
        max_storage_gb: 50
      },
      logging: {
        level: 'error' as const, // Reduce noise during testing
        file: './test-logs/service.log',
        max_size_mb: 100,
        backup_count: 5
      }
    };
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

  static mockJsonFile(path: string, data: any): void {
    this.mockFiles.set(path, JSON.stringify(data, null, 2));
  }

  static getMockJsonFile<T>(path: string): T | undefined {
    const content = this.mockFiles.get(path);
    return content ? JSON.parse(content) : undefined;
  }
}

/**
 * Test assertion helpers
 */
export class TestAssertions {
  /**
   * Assert that response matches success response structure (placeholder)
   */
  static assertSuccessResponse(response: any): void {
    expect(response).toHaveProperty('status', 'success');
    expect(response).toHaveProperty('answer');
    expect(response).toHaveProperty('execution_time');
    expect(typeof response.answer).toBe('string');
    expect(typeof response.execution_time).toBe('number');
  }

  /**
   * Assert that response matches error response structure (placeholder)
   */
  static assertErrorResponse(response: any): void {
    expect(response).toHaveProperty('status', 'error');
    expect(response).toHaveProperty('error_code');
    expect(response).toHaveProperty('message');
    expect(typeof response.error_code).toBe('string');
    expect(typeof response.message).toBe('string');
  }

  /**
   * Assert that repository metadata is valid
   */
  static assertValidRepositoryMetadata(metadata: any): asserts metadata is RepositoryMetadata {
    expect(metadata).toHaveProperty('url');
    expect(metadata).toHaveProperty('branch');
    expect(metadata).toHaveProperty('last_updated');
    expect(metadata).toHaveProperty('last_accessed');
    expect(metadata).toHaveProperty('commit_hash');
    expect(metadata).toHaveProperty('clone_method');
    expect(['https', 'ssh']).toContain(metadata.clone_method);
  }

  /**
   * Assert that repository info is valid
   */
  static assertValidRepositoryInfo(info: any): asserts info is RepositoryInfo {
    expect(info).toHaveProperty('url');
    expect(info).toHaveProperty('branch');
    expect(info).toHaveProperty('localPath');
    expect(info).toHaveProperty('exists');
    expect(typeof info.exists).toBe('boolean');
  }
} 