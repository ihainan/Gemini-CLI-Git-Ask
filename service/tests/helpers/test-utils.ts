/**
 * Test Utilities
 * Common helper functions for testing
 */

import { Express } from 'express';
import request from 'supertest';
import {
  RepositoryInfo,
  RepositoryMetadata,
  RepositoryError,
  GeminiRequest,
  GeminiResponse,
  GeminiExecutorConfig,
  GeminiError,
  GeminiException,
  SingleRepositoryStats
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

  /**
   * Create mock Gemini request
   */
  static createMockGeminiRequest(overrides?: Partial<GeminiRequest>): GeminiRequest {
    return {
      repositoryPath: '/tmp/test_repo_main_abc123',
      question: 'What does this code do?',
      context: 'This is a test repository',
      timeout: 300000,
      ...overrides
    };
  }

  /**
   * Create mock Gemini response
   */
  static createMockGeminiResponse(overrides?: Partial<GeminiResponse>): GeminiResponse {
    return {
      answer: 'This is a test repository that demonstrates basic functionality.',
      model: 'gemini-2.5-flash',
      execution_time: 1500,
      tokens_used: 100,
      ...overrides
    };
  }

  /**
   * Create mock Gemini executor config
   */
  static createMockGeminiExecutorConfig(overrides?: Partial<GeminiExecutorConfig>): GeminiExecutorConfig {
    return {
      model: 'gemini-2.5-flash',
      apiTimeout: 300,
      allFilesMode: 'auto',
      autoAllFilesThresholds: {
        maxFiles: 200,
        maxSizeMb: 10
      },
      basePrompt: 'You are a code analysis assistant.',
      cliPath: 'gemini',
      maxBuffer: 1024 * 1024 * 10,
      ...overrides
    };
  }

  /**
   * Create mock SingleRepositoryStats for testing
   */
  static createMockSingleRepositoryStats(overrides?: Partial<SingleRepositoryStats>): SingleRepositoryStats {
    return {
      fileCount: 25,
      totalSizeMb: 2.5,
      codeFileCount: 18,
      largestFileSizeMb: 0.5,
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
        api_timeout: 300,
        all_files_mode: 'auto',
        auto_all_files_thresholds: {
          max_files: 200,
          max_size_mb: 10
        },
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

  /**
   * Assert that Gemini request is valid
   */
  static assertValidGeminiRequest(request: any): asserts request is GeminiRequest {
    expect(request).toHaveProperty('repositoryPath');
    expect(request).toHaveProperty('question');
    expect(typeof request.repositoryPath).toBe('string');
    expect(typeof request.question).toBe('string');
    expect(request.repositoryPath.length).toBeGreaterThan(0);
    expect(request.question.length).toBeGreaterThan(0);
    
    if (request.context !== undefined) {
      expect(typeof request.context).toBe('string');
    }
    if (request.timeout !== undefined) {
      expect(typeof request.timeout).toBe('number');
      expect(request.timeout).toBeGreaterThan(0);
    }
  }

  /**
   * Assert that Gemini response is valid
   */
  static assertValidGeminiResponse(response: any): asserts response is GeminiResponse {
    expect(response).toHaveProperty('answer');
    expect(response).toHaveProperty('model');
    expect(response).toHaveProperty('execution_time');
    expect(typeof response.answer).toBe('string');
    expect(typeof response.model).toBe('string');
    expect(typeof response.execution_time).toBe('number');
    expect(response.answer.length).toBeGreaterThan(0);
    expect(response.execution_time).toBeGreaterThan(0);
    
    if (response.tokens_used !== undefined) {
      expect(typeof response.tokens_used).toBe('number');
      expect(response.tokens_used).toBeGreaterThan(0);
    }
  }

  /**
   * Assert that Gemini exception is properly formed
   */
  static assertValidGeminiException(exception: any): asserts exception is GeminiException {
    expect(exception).toBeInstanceOf(GeminiException);
    expect(exception).toHaveProperty('code');
    expect(exception).toHaveProperty('message');
    expect(exception).toHaveProperty('name', 'GeminiException');
    expect(Object.values(GeminiError)).toContain(exception.code);
    expect(typeof exception.message).toBe('string');
  }

  /**
   * Assert that SingleRepositoryStats is valid
   */
  static assertValidSingleRepositoryStats(stats: any): asserts stats is SingleRepositoryStats {
    expect(stats).toHaveProperty('fileCount');
    expect(stats).toHaveProperty('totalSizeMb');
    expect(stats).toHaveProperty('codeFileCount');
    expect(stats).toHaveProperty('largestFileSizeMb');
    expect(typeof stats.fileCount).toBe('number');
    expect(typeof stats.totalSizeMb).toBe('number');
    expect(typeof stats.codeFileCount).toBe('number');
    expect(typeof stats.largestFileSizeMb).toBe('number');
    expect(stats.fileCount).toBeGreaterThanOrEqual(0);
    expect(stats.totalSizeMb).toBeGreaterThanOrEqual(0);
    expect(stats.codeFileCount).toBeGreaterThanOrEqual(0);
    expect(stats.largestFileSizeMb).toBeGreaterThanOrEqual(0);
    expect(stats.codeFileCount).toBeLessThanOrEqual(stats.fileCount);
  }
} 