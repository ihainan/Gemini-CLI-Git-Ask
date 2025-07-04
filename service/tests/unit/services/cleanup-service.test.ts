/**
 * Unit tests for CleanupService
 */

/// <reference types="jest" />

import { CleanupService, CleanupServiceConfig } from '../../../src/services/cleanup-service';
import { RepositoryManager } from '../../../src/services/repository-manager';
import { MockDataFactory } from '../../helpers/test-utils';

// Mock node-cron
jest.mock('node-cron', () => ({
  schedule: jest.fn(),
  ScheduledTask: jest.fn()
}));

// Mock repository manager
jest.mock('../../../src/services/repository-manager', () => ({
  RepositoryManager: jest.fn()
}));

describe('CleanupService', () => {
  let cleanupService: CleanupService;
  let mockRepositoryManager: jest.Mocked<RepositoryManager>;
  let mockConfig: CleanupServiceConfig;
  const mockCron = require('node-cron');
  const MockRepositoryManager = require('../../../src/services/repository-manager').RepositoryManager;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Create mock repository manager instance
    mockRepositoryManager = {
      cleanupRepositories: jest.fn().mockResolvedValue(undefined)
    } as any;

    MockRepositoryManager.mockImplementation(() => mockRepositoryManager);

    mockConfig = {
      enabled: true,
      intervalHours: 24,
      retentionDays: 7,
      maxStorageGb: 50,
      cleanupOnStartup: false
    };

    cleanupService = new CleanupService(mockRepositoryManager, mockConfig);
  });

  describe('constructor', () => {
    it('should create CleanupService instance', () => {
      expect(cleanupService).toBeInstanceOf(CleanupService);
    });

    it('should initialize with configuration', () => {
      expect(cleanupService).toBeDefined();
    });
  });

  describe('start', () => {
    it('should start cleanup service when enabled', async () => {
      const mockCronJob = {
        stop: jest.fn()
      };
      mockCron.schedule.mockReturnValue(mockCronJob);

      await cleanupService.start();

      expect(mockCron.schedule).toHaveBeenCalledWith(
        '0 */24 * * *',
        expect.any(Function),
        {
          scheduled: true,
          timezone: 'UTC'
        }
      );
    });

    it('should not start cleanup service when disabled', async () => {
      const disabledConfig = { ...mockConfig, enabled: false };
      const disabledService = new CleanupService(mockRepositoryManager, disabledConfig);

      await disabledService.start();

      expect(mockCron.schedule).not.toHaveBeenCalled();
    });

    it('should run cleanup on startup when configured', async () => {
      const startupConfig = { ...mockConfig, cleanupOnStartup: true };
      const startupService = new CleanupService(mockRepositoryManager, startupConfig);

      await startupService.start();

      expect(mockRepositoryManager.cleanupRepositories).toHaveBeenCalledWith(
        7,
        53687091200 // 50GB in bytes
      );
    });

    it('should handle startup cleanup failure gracefully', async () => {
      const startupConfig = { ...mockConfig, cleanupOnStartup: true };
      const startupService = new CleanupService(mockRepositoryManager, startupConfig);

      mockRepositoryManager.cleanupRepositories.mockRejectedValue(new Error('Cleanup failed'));

      await expect(startupService.start()).resolves.not.toThrow();
    });
  });

  describe('stop', () => {
    it('should stop the cron job', async () => {
      const mockCronJob = {
        stop: jest.fn()
      };
      mockCron.schedule.mockReturnValue(mockCronJob);

      await cleanupService.start();
      await cleanupService.stop();

      expect(mockCronJob.stop).toHaveBeenCalled();
    });

    it('should handle stop when no job is running', async () => {
      await expect(cleanupService.stop()).resolves.not.toThrow();
    });
  });

  describe('getStatus', () => {
    it('should return service status when enabled', () => {
      const status = cleanupService.getStatus();

      expect(status.enabled).toBe(true);
      expect(status.scheduled).toBe(false);
      expect(status.running).toBe(false);
    });

    it('should return status with next run time when scheduled', async () => {
      const mockCronJob = {
        stop: jest.fn()
      };
      mockCron.schedule.mockReturnValue(mockCronJob);

      await cleanupService.start();
      const status = cleanupService.getStatus();

      expect(status.enabled).toBe(true);
      expect(status.scheduled).toBe(true);
      expect(status.running).toBe(false);
      expect(status.nextRun).toBeInstanceOf(Date);
    });

    it('should return disabled status when service is disabled', () => {
      const disabledConfig = { ...mockConfig, enabled: false };
      const disabledService = new CleanupService(mockRepositoryManager, disabledConfig);

      const status = disabledService.getStatus();

      expect(status.enabled).toBe(false);
      expect(status.scheduled).toBe(false);
      expect(status.running).toBe(false);
    });
  });

  describe('triggerCleanup', () => {
    it('should trigger manual cleanup', async () => {
      await cleanupService.triggerCleanup();

      expect(mockRepositoryManager.cleanupRepositories).toHaveBeenCalledWith(
        7,
        53687091200 // 50GB in bytes
      );
    });

    it('should prevent concurrent cleanup runs', async () => {
      // Make the first cleanup hang
      let resolveCleanup: () => void;
      const cleanupPromise = new Promise<void>((resolve) => {
        resolveCleanup = resolve;
      });
      mockRepositoryManager.cleanupRepositories.mockReturnValue(cleanupPromise);

      // Start first cleanup
      const firstCleanup = cleanupService.triggerCleanup();

      // Try to start second cleanup - should throw
      await expect(cleanupService.triggerCleanup()).rejects.toThrow('Cleanup is already running');

      // Complete first cleanup
      resolveCleanup!();
      await firstCleanup;
    });

    it('should handle cleanup failures', async () => {
      const error = new Error('Cleanup failed');
      mockRepositoryManager.cleanupRepositories.mockRejectedValue(error);

      await expect(cleanupService.triggerCleanup()).rejects.toThrow('Cleanup failed');
    });
  });

  describe('scheduled cleanup', () => {
    it('should execute cleanup on schedule', async () => {
      const mockCronJob = {
        stop: jest.fn()
      };
      let scheduledCallback: (() => Promise<void>) | undefined;
      mockCron.schedule.mockImplementation((expression: any, callback: any, options: any) => {
        scheduledCallback = callback;
        return mockCronJob;
      });

      await cleanupService.start();

      // Trigger the scheduled callback
      expect(scheduledCallback).toBeDefined();
      if (scheduledCallback) {
        await scheduledCallback();
      }

      expect(mockRepositoryManager.cleanupRepositories).toHaveBeenCalledWith(
        7,
        53687091200 // 50GB in bytes
      );
    });

    it('should handle scheduled cleanup failures gracefully', async () => {
      const mockCronJob = {
        stop: jest.fn()
      };
      let scheduledCallback: (() => Promise<void>) | undefined;
      mockCron.schedule.mockImplementation((expression: any, callback: any, options: any) => {
        scheduledCallback = callback;
        return mockCronJob;
      });

      mockRepositoryManager.cleanupRepositories.mockRejectedValue(new Error('Cleanup failed'));

      await cleanupService.start();

      // Trigger the scheduled callback - should not throw
      expect(scheduledCallback).toBeDefined();
      if (scheduledCallback) {
        await expect(scheduledCallback()).resolves.not.toThrow();
      }
    });
  });

  describe('cron expression generation', () => {
    it('should generate correct cron expression for different intervals', async () => {
      const testCases = [
        { hours: 1, expected: '0 */1 * * *' },
        { hours: 6, expected: '0 */6 * * *' },
        { hours: 12, expected: '0 */12 * * *' },
        { hours: 24, expected: '0 */24 * * *' }
      ];

      for (const testCase of testCases) {
        const testConfig = { ...mockConfig, intervalHours: testCase.hours };
        const testService = new CleanupService(mockRepositoryManager, testConfig);

        const mockCronJob = {
          stop: jest.fn()
        };
        mockCron.schedule.mockReturnValue(mockCronJob);

        await testService.start();

        expect(mockCron.schedule).toHaveBeenCalledWith(
          testCase.expected,
          expect.any(Function),
          {
            scheduled: true,
            timezone: 'UTC'
          }
        );

        mockCron.schedule.mockClear();
      }
    });
  });

  describe('error handling', () => {
    it('should handle repository manager errors', async () => {
      const error = new Error('Repository manager error');
      mockRepositoryManager.cleanupRepositories.mockRejectedValue(error);

      await expect(cleanupService.triggerCleanup()).rejects.toThrow('Repository manager error');
    });
  });
}); 