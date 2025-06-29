/**
 * Error handling middleware
 */

import { Request, Response, NextFunction } from 'express';
import { ApiException, ApiErrorCode, RepositoryException, RepositoryError, GeminiException, GeminiError } from '../../types';
import { logger } from '../../utils/logger';

export interface ErrorResponse {
  status: 'error';
  error_code: string;
  message: string;
  details?: any;
}

export function errorHandler(
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Log the error for debugging
  logger.error('API Error:', {
    error: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    body: req.body
  });

  let statusCode = 500;
  let errorCode = ApiErrorCode.INTERNAL_ERROR;
  let message = 'Internal server error';
  let details: any = undefined;

  // Handle known error types
  if (error instanceof ApiException) {
    statusCode = error.statusCode;
    errorCode = error.code;
    message = error.message;
    details = error.details;
  } else if (error instanceof RepositoryException) {
    // Map repository errors to API errors
    switch (error.code) {
      case RepositoryError.INVALID_URL:
        statusCode = 400;
        errorCode = ApiErrorCode.INVALID_REQUEST;
        message = 'Invalid repository URL';
        break;
      case RepositoryError.NOT_FOUND:
        statusCode = 404;
        errorCode = ApiErrorCode.REPOSITORY_NOT_FOUND;
        message = 'Repository not found or inaccessible';
        break;
      case RepositoryError.CLONE_FAILED:
        statusCode = 422;
        errorCode = ApiErrorCode.REPOSITORY_CLONE_FAILED;
        message = 'Failed to clone repository';
        break;
      case RepositoryError.LOCK_FAILED:
        statusCode = 423;
        errorCode = ApiErrorCode.LOCK_TIMEOUT;
        message = 'Repository is locked by another operation';
        break;
      case RepositoryError.STORAGE_ERROR:
        statusCode = 507;
        errorCode = ApiErrorCode.STORAGE_FULL;
        message = 'Insufficient storage space';
        break;
      default:
        statusCode = 500;
        errorCode = ApiErrorCode.INTERNAL_ERROR;
        message = 'Repository operation failed';
    }
    details = error.details;
  } else if (error instanceof GeminiException) {
    // Map Gemini errors to API errors
    switch (error.code) {
      case GeminiError.INVALID_REQUEST:
        statusCode = 400;
        errorCode = ApiErrorCode.INVALID_REQUEST;
        message = 'Invalid request to Gemini CLI';
        break;
      case GeminiError.TIMEOUT_EXCEEDED:
        statusCode = 408;
        errorCode = ApiErrorCode.TIMEOUT_EXCEEDED;
        message = 'Gemini CLI execution timeout';
        break;
      case GeminiError.CLI_NOT_FOUND:
      case GeminiError.EXECUTION_FAILED:
      case GeminiError.API_ERROR:
        statusCode = 502;
        errorCode = ApiErrorCode.GEMINI_EXECUTION_FAILED;
        message = 'Gemini CLI execution failed';
        break;
      default:
        statusCode = 500;
        errorCode = ApiErrorCode.INTERNAL_ERROR;
        message = 'Gemini CLI operation failed';
    }
    details = {
      stderr: error.stderr,
      ...error.details
    };
  } else if (error.name === 'SyntaxError' && error.message.includes('JSON')) {
    // Handle JSON parsing errors
    statusCode = 400;
    errorCode = ApiErrorCode.INVALID_REQUEST;
    message = 'Invalid JSON in request body';
  } else if (error.name === 'ValidationError') {
    // Handle validation errors
    statusCode = 400;
    errorCode = ApiErrorCode.INVALID_REQUEST;
    message = 'Request validation failed';
    details = error.message;
  }

  const response: ErrorResponse = {
    status: 'error',
    error_code: errorCode,
    message,
    ...(details && { details })
  };

  res.status(statusCode).json(response);
}

export function notFoundHandler(req: Request, res: Response): void {
  const response: ErrorResponse = {
    status: 'error',
    error_code: 'NOT_FOUND',
    message: `Route ${req.method} ${req.path} not found`
  };

  res.status(404).json(response);
} 