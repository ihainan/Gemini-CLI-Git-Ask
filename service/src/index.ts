import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { ConfigManager } from './config/config-manager';
import { logger, configureLogger } from './utils/logger';
import { createApiRoutes } from './api/routes';
import { errorHandler, notFoundHandler } from './api/middleware/error-handler';
import { RepositoryManager } from './services/repository-manager';
import { createCleanupService, CleanupService } from './services/cleanup-service';

let cleanupService: CleanupService | null = null;

async function bootstrap() {
  try {
    // Load configuration
    const config = ConfigManager.getInstance();
    await config.load();
    
    // Reconfigure logger with loaded configuration
    configureLogger(config.getAll());
    
    // Initialize Repository Manager
    const repositoryManager = new RepositoryManager({
      storagePath: config.get('repository.storage_path'),
      cloneMethod: config.get('repository.clone_method'),
      cloneDepth: config.get('repository.clone_depth'),
      updateThresholdHours: config.get('repository.update_threshold_hours'),
      accessTimeoutHours: config.get('repository.access_timeout_hours'),
      maxConcurrentOperations: config.get('repository.max_concurrent_operations'),
      defaultBranch: config.get('repository.default_branch')
    });
    
    // Initialize Cleanup Service
    cleanupService = createCleanupService(repositoryManager);
    await cleanupService.start();
    
    // Create Express app
    const app = express();
    
    // Security middleware
    app.use(helmet());
    app.use(cors());
    
    // Body parsing middleware
    app.use(express.json({ limit: config.get('security.max_request_size') }));
    app.use(express.urlencoded({ extended: true }));
    
    // Health check endpoint
    app.get('/health', (req, res) => {
      res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        service: 'gemini-cli-git-ask-service'
      });
    });
    
    // Ready check endpoint
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
    
    // Start server
    const port = config.get('server.port');
    const host = config.get('server.host');
    
    app.listen(port, host, () => {
      logger.info(`Server is running on http://${host}:${port}`);
      logger.info('Health check endpoint: /health');
      logger.info('Ready check endpoint: /ready');
    });
    
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received. Shutting down gracefully...');
  await shutdown();
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received. Shutting down gracefully...');
  await shutdown();
});

async function shutdown() {
  try {
    if (cleanupService) {
      logger.info('Stopping cleanup service...');
      await cleanupService.stop();
    }
    logger.info('Shutdown complete');
    process.exit(0);
  } catch (error) {
    logger.error('Error during shutdown:', error);
    process.exit(1);
  }
}

// Start the application
bootstrap().catch((error) => {
  logger.error('Bootstrap failed:', error);
  process.exit(1);
}); 