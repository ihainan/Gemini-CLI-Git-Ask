/**
 * Mock implementation of CleanupService
 */

export class MockCleanupService {
  private static instance: MockCleanupService;
  private config: any;

  constructor(repositoryManager?: any, config?: any) {
    this.config = config || {
      enabled: true,
      intervalHours: 24,
      retentionDays: 7,
      maxStorageGb: 50,
      cleanupOnStartup: false
    };
  }

  public static getInstance(): MockCleanupService {
    if (!MockCleanupService.instance) {
      MockCleanupService.instance = new MockCleanupService();
    }
    return MockCleanupService.instance;
  }

  public getStatus(): any {
    return {
      enabled: true,
      scheduled: true,
      running: false,
      nextRun: new Date('2024-01-01T12:00:00Z').toISOString()
    };
  }

  public async triggerCleanup(): Promise<void> {
    // Mock manual cleanup trigger
    return Promise.resolve();
  }

  public async start(): Promise<void> {
    // Mock service start
    return Promise.resolve();
  }

  public async stop(): Promise<void> {
    // Mock service stop
    return Promise.resolve();
  }
}

// Export the MockCleanupService as CleanupService
export const CleanupService = MockCleanupService; 