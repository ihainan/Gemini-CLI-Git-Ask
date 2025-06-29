import winston from 'winston';
import path from 'path';

// Create logger instance
export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'gemini-cli-git-ask-service' },
  transports: [
    // Console transport for development
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ],
});

// Add file transport if logs directory exists
const logsDir = path.join(process.cwd(), 'logs');
try {
  logger.add(new winston.transports.File({
    filename: path.join(logsDir, 'error.log'),
    level: 'error',
    maxsize: 100 * 1024 * 1024, // 100MB
    maxFiles: 5
  }));
  
  logger.add(new winston.transports.File({
    filename: path.join(logsDir, 'service.log'),
    maxsize: 100 * 1024 * 1024, // 100MB
    maxFiles: 5
  }));
} catch (error) {
  // Logs directory might not exist yet, that's ok
} 