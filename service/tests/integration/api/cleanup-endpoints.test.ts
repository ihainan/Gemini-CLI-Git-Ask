/**
 * Integration tests for cleanup endpoints
 */

// Import setup first to ensure mocks are applied
import '../../setup-integration';

import request from 'supertest';
import express from 'express';
import { createTestApp } from '../../helpers/test-app';

describe('Cleanup Endpoints', () => {
  let app: express.Application;

  beforeAll(async () => {
    // Create test app with proper mocks
    app = await createTestApp();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/v1/cleanup/status', () => {
    it('should return cleanup service status', async () => {
      const response = await request(app)
        .get('/api/v1/cleanup/status')
        .expect(200);

      expect(response.body).toEqual({
        status: 'success',
        cleanup_service: {
          enabled: true,
          scheduled: expect.any(Boolean),
          running: false,
          nextRun: expect.any(String)
        }
      });
    });

    it('should handle status request errors', async () => {
      // Mock cleanup service to throw error
      const mockCleanupService = require('../../__mocks__/cleanup-service');
      const originalGetStatus = mockCleanupService.CleanupService.prototype.getStatus;
      
      // Temporarily override getStatus to throw error
      mockCleanupService.CleanupService.prototype.getStatus = jest.fn().mockImplementation(() => {
        throw new Error('Status check failed');
      });

      const response = await request(app)
        .get('/api/v1/cleanup/status')
        .expect(500);

      expect(response.body.status).toBe('error');
      expect(response.body.message).toContain('Internal server error');

      // Restore original implementation
      mockCleanupService.CleanupService.prototype.getStatus = originalGetStatus;
    });
  });

  describe('POST /api/v1/cleanup/trigger', () => {
    it('should trigger manual cleanup successfully', async () => {
      const response = await request(app)
        .post('/api/v1/cleanup/trigger')
        .expect(200);

      expect(response.body).toEqual({
        status: 'success',
        message: 'Cleanup triggered successfully'
      });
    });

    it('should handle cleanup trigger errors', async () => {
      // Mock cleanup service to throw error
      const mockCleanupService = require('../../__mocks__/cleanup-service');
      const originalTriggerCleanup = mockCleanupService.CleanupService.prototype.triggerCleanup;
      
      // Temporarily override triggerCleanup to throw error
      mockCleanupService.CleanupService.prototype.triggerCleanup = jest.fn().mockRejectedValue(
        new Error('Cleanup is already running')
      );

      const response = await request(app)
        .post('/api/v1/cleanup/trigger')
        .expect(500);

      expect(response.body.status).toBe('error');
      expect(response.body.message).toContain('Internal server error');

      // Restore original implementation
      mockCleanupService.CleanupService.prototype.triggerCleanup = originalTriggerCleanup;
    });

    it('should handle concurrent cleanup requests', async () => {
      // Mock cleanup service to simulate concurrent cleanup
      const mockCleanupService = require('../../__mocks__/cleanup-service');
      const originalTriggerCleanup = mockCleanupService.CleanupService.prototype.triggerCleanup;
      
      // Override triggerCleanup to throw concurrency error
      mockCleanupService.CleanupService.prototype.triggerCleanup = jest.fn().mockRejectedValue(
        new Error('Cleanup is already running')
      );

      const response = await request(app)
        .post('/api/v1/cleanup/trigger')
        .expect(500);

      expect(response.body.status).toBe('error');
      expect(response.body.message).toContain('Internal server error');

      // Restore original implementation
      mockCleanupService.CleanupService.prototype.triggerCleanup = originalTriggerCleanup;
    });
  });

  describe('cleanup service initialization', () => {
    it('should initialize cleanup service correctly', () => {
      // Verify the test app is properly initialized
      expect(app).toBeDefined();
      
      // Verify cleanup service mock is properly loaded
      const mockCleanupService = require('../../__mocks__/cleanup-service');
      expect(mockCleanupService.CleanupService).toBeDefined();
    });

    it('should use correct configuration', () => {
      // Verify that config manager is accessible
      const { ConfigManager } = require('../../__mocks__/config-manager');
      expect(ConfigManager).toBeDefined();
      
      // Create instance and verify it works
      const configInstance = ConfigManager.getInstance();
      expect(configInstance).toBeDefined();
      expect(typeof configInstance.get).toBe('function');
      
      // Test some config values
      expect(configInstance.get('cleanup.enabled')).toBe(true);
      expect(configInstance.get('cleanup.interval_hours')).toBe(24);
    });
  });
}); 