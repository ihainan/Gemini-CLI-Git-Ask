/**
 * Mock implementation of GeminiExecutor
 */

export class MockGeminiExecutor {
  constructor(config: any) {
    // Mock constructor - accept config but ignore it
  }

  public async ask(request: any): Promise<any> {
    // Simple mock that succeeds by default
    // Individual tests can override this using jest.spyOn if they need failure scenarios
    return Promise.resolve({
      answer: 'This repository contains a Node.js web application with REST API endpoints.',
      model: 'gemini-2.5-flash',
      execution_time: 1500,
      tokens_used: 150
    });
  }

  public async checkAvailability(): Promise<boolean> {
    // Simple mock that returns true by default
    // Individual tests can override this using jest.spyOn if they need false scenarios
    return Promise.resolve(true);
  }

  public async getVersion(): Promise<string> {
    // Mock version check
    return 'gemini version 1.0.0';
  }

  public async checkHealth(): Promise<any> {
    // Mock health check response
    return {
      available: true,
      version: 'gemini version 1.0.0',
      status: 'healthy'
    };
  }

  public async getSingleRepositoryStats(repositoryPath: string): Promise<any> {
    // Mock repository stats
    return {
      fileCount: 25,
      totalSizeMb: 2.5,
      codeFileCount: 15
    };
  }
}

// Mock the GeminiExecutor class
export const GeminiExecutor = MockGeminiExecutor;
 