import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { ConfigManager } from './config/config-manager';
import { logger, configureLogger } from './utils/logger';
import { createApiRoutes } from './api/routes';
import { errorHandler, notFoundHandler } from './api/middleware/error-handler';

async function bootstrap() {
  try {
    // Load configuration
    const config = ConfigManager.getInstance();
    await config.load();
    
    // Reconfigure logger with loaded configuration
    configureLogger(config.getAll());
    
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
process.on('SIGTERM', () => {
  logger.info('SIGTERM received. Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received. Shutting down gracefully...');
  process.exit(0);
});

// Start the application
bootstrap().catch((error) => {
  logger.error('Bootstrap failed:', error);
  process.exit(1);
}); 