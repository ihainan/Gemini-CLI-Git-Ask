/**
 * Mock implementation of CleanupService
 */

class MockCleanupService {
  constructor(repositoryManager, config) {
    this.config = config || {
      enabled: true,
      intervalHours: 24,
      retentionDays: 7,
      maxStorageGb: 50,
      cleanupOnStartup: false
    };
  }

  static getInstance() {
    if (!MockCleanupService.instance) {
      MockCleanupService.instance = new MockCleanupService();
    }
    return MockCleanupService.instance;
  }

  getStatus() {
    return {
      enabled: true,
      scheduled: true,
      running: false,
      nextRun: new Date('2024-01-01T12:00:00Z').toISOString()
    };
  }

  async triggerCleanup() {
    // Mock manual cleanup trigger
    return Promise.resolve();
  }

  async start() {
    // Mock service start
    return Promise.resolve();
  }

  async stop() {
    // Mock service stop
    return Promise.resolve();
  }
}

// CommonJS exports
module.exports = {
  MockCleanupService,
  CleanupService: MockCleanupService
}; 