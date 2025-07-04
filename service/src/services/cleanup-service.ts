/**
 * Cleanup Service
 * Manages scheduled repository cleanup tasks
 */

import * as cron from 'node-cron';
import { logger } from '../utils/logger';
import { RepositoryManager } from './repository-manager';
import { ConfigManager } from '../config/config-manager';

export interface CleanupServiceConfig {
  enabled: boolean;
  intervalHours: number;
  retentionDays: number;
  maxStorageGb: number;
  cleanupOnStartup: boolean;
}

export class CleanupService {
  private repositoryManager: RepositoryManager;
  private config: CleanupServiceConfig;
  private cronJob: cron.ScheduledTask | null = null;
  private isRunning = false;

  constructor(repositoryManager: RepositoryManager, config: CleanupServiceConfig) {
    this.repositoryManager = repositoryManager;
    this.config = config;
  }

  /**
   * Start the cleanup service
   */
  async start(): Promise<void> {
    if (!this.config.enabled) {
      logger.info('Cleanup service is disabled');
      return;
    }

    logger.info('Starting cleanup service', {
      intervalHours: this.config.intervalHours,
      retentionDays: this.config.retentionDays,
      maxStorageGb: this.config.maxStorageGb,
      cleanupOnStartup: this.config.cleanupOnStartup
    });

    // Run cleanup on startup if configured
    if (this.config.cleanupOnStartup) {
      logger.info('Running cleanup on startup');
      try {
        await this.performCleanup();
      } catch (error) {
        logger.error('Startup cleanup failed:', error);
      }
    }

    // Schedule periodic cleanup
    this.scheduleCleanup();
  }

  /**
   * Stop the cleanup service
   */
  async stop(): Promise<void> {
    if (this.cronJob) {
      logger.info('Stopping cleanup service');
      this.cronJob.stop();
      this.cronJob = null;
    }
  }

  /**
   * Get cleanup service status
   */
  getStatus(): {
    enabled: boolean;
    scheduled: boolean;
    running: boolean;
    nextRun?: Date;
  } {
    const result: {
      enabled: boolean;
      scheduled: boolean;
      running: boolean;
      nextRun?: Date;
    } = {
      enabled: this.config.enabled,
      scheduled: this.cronJob !== null,
      running: this.isRunning
    };

    const nextRun = this.cronJob ? this.getNextRunTime() : undefined;
    if (nextRun) {
      result.nextRun = nextRun;
    }

    return result;
  }

  /**
   * Manually trigger cleanup
   */
  async triggerCleanup(): Promise<void> {
    if (this.isRunning) {
      throw new Error('Cleanup is already running');
    }

    this.isRunning = true;
    const startTime = Date.now();

    try {
      logger.info('Starting manual repository cleanup');
      
      const maxStorageBytes = this.config.maxStorageGb * 1024 * 1024 * 1024;
      
      await this.repositoryManager.cleanupRepositories(
        this.config.retentionDays,
        maxStorageBytes
      );
      
      const duration = Date.now() - startTime;
      logger.info(`Manual repository cleanup completed successfully in ${duration}ms`);
      
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error(`Manual repository cleanup failed after ${duration}ms:`, error);
      
      // For manual triggers, rethrow the error so the caller knows it failed
      throw error;
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Schedule periodic cleanup using cron
   */
  private scheduleCleanup(): void {
    const cronExpression = `0 */${this.config.intervalHours} * * *`;
    
    logger.info(`Scheduling cleanup with cron expression: ${cronExpression}`);
    
    this.cronJob = cron.schedule(cronExpression, async () => {
      await this.performCleanup();
    }, {
      scheduled: true,
      timezone: 'UTC'
    });
  }

  /**
   * Perform the actual cleanup
   */
  private async performCleanup(): Promise<void> {
    if (this.isRunning) {
      logger.warn('Cleanup is already running, skipping');
      return;
    }

    this.isRunning = true;
    const startTime = Date.now();

    try {
      logger.info('Starting scheduled repository cleanup');
      
      const maxStorageBytes = this.config.maxStorageGb * 1024 * 1024 * 1024;
      
      await this.repositoryManager.cleanupRepositories(
        this.config.retentionDays,
        maxStorageBytes
      );
      
      const duration = Date.now() - startTime;
      logger.info(`Repository cleanup completed successfully in ${duration}ms`);
      
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error(`Repository cleanup failed after ${duration}ms:`, error);
      
      // Don't rethrow - we don't want to crash the service
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Get the next scheduled run time
   */
  private getNextRunTime(): Date | undefined {
    if (!this.cronJob) return undefined;

    // Calculate next run time based on cron expression
    const now = new Date();
    const nextHour = new Date(now);
    nextHour.setHours(now.getHours() + this.config.intervalHours);
    nextHour.setMinutes(0, 0, 0);

    return nextHour;
  }
}

/**
 * Create cleanup service instance from configuration
 */
export function createCleanupService(repositoryManager: RepositoryManager): CleanupService {
  const config = ConfigManager.getInstance();
  
  const cleanupConfig: CleanupServiceConfig = {
    enabled: config.get('cleanup.enabled'),
    intervalHours: config.get('cleanup.interval_hours'),
    retentionDays: config.get('cleanup.retention_days'),
    maxStorageGb: config.get('cleanup.max_storage_gb'),
    cleanupOnStartup: config.get('cleanup.cleanup_on_startup')
  };

  return new CleanupService(repositoryManager, cleanupConfig);
} 