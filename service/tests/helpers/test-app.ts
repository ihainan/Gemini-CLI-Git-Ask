/**
 * Test Application Factory
 * Creates Express app instances for integration testing
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createApiRoutes } from '../../src/api/routes';
import { errorHandler, notFoundHandler } from '../../src/api/middleware/error-handler';

/**
 * Create Express app for testing
 */
export async function createTestApp(): Promise<express.Application> {
  // Create Express app
  const app = express();
  
  // Security middleware
  app.use(helmet());
  app.use(cors());
  
  // Body parsing middleware
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));
  
  // Health check endpoints
  app.get('/health', (req, res) => {
    res.json({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      service: 'gemini-cli-git-ask-service'
    });
  });
  
  app.get('/ready', (req, res) => {
    res.json({ 
      status: 'ready',
      timestamp: new Date().toISOString()
    });
  });

  // API routes
  app.use('/api', createApiRoutes());

  // Error handling middleware (must be last)
  app.use(notFoundHandler);
  app.use(errorHandler);
  
  return app;
}

/**
 * Create test app with custom configuration
 * Note: Configuration overrides would need to be applied via environment variables
 * or mocking ConfigManager for specific test scenarios
 */
export async function createTestAppWithConfig(configOverrides: any = {}): Promise<express.Application> {
  // For now, just create the test app with default configuration
  // In the future, we could implement configuration override mechanism
  return createTestApp();
} 