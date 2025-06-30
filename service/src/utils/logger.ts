import winston from 'winston';
import path from 'path';
import fs from 'fs';

// Create initial logger with basic configuration
let logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'gemini-cli-git-ask-service' },
  transports: [
    // Console transport for development and Docker
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ],
});

// Function to reconfigure logger with config file settings
export function configureLogger(config: any) {
  try {
    const logLevel = config.logging?.level?.toLowerCase() || process.env.LOG_LEVEL || 'info';
    const logFile = config.logging?.file || './logs/service.log';
    const maxSize = (config.logging?.max_size_mb || 100) * 1024 * 1024;
    const maxFiles = config.logging?.backup_count || 5;
    const consoleOutput = config.logging?.console_output !== false;

    // Clear existing transports
    logger.clear();

    // Add console transport if enabled
    if (consoleOutput) {
      logger.add(new winston.transports.Console({
        level: logLevel,
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
          winston.format.printf(({ timestamp, level, message, ...meta }) => {
            const metaStr = Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : '';
            return `${timestamp} [${level}] ${message}${metaStr}`;
          })
        )
      }));
    }

    // Add file transports if logs directory exists or can be created
    const logsDir = path.dirname(logFile);
    try {
      if (!fs.existsSync(logsDir)) {
        fs.mkdirSync(logsDir, { recursive: true });
      }

      // Error log file
      logger.add(new winston.transports.File({
        filename: path.join(logsDir, 'error.log'),
        level: 'error',
        maxsize: maxSize,
        maxFiles: maxFiles,
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.json()
        )
      }));

      // General log file
      logger.add(new winston.transports.File({
        filename: logFile,
        level: logLevel,
        maxsize: maxSize,
        maxFiles: maxFiles,
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.json()
        )
      }));
    } catch (error) {
      // File logging failed, continue with console only
      logger.warn('Failed to setup file logging:', error);
    }

    // Update logger level
    logger.level = logLevel;
    
    logger.info(`Logger configured with level: ${logLevel}`);
  } catch (error) {
    logger.error('Failed to configure logger:', error);
  }
}

export { logger }; 