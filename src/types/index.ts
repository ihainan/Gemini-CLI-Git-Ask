/**
 * Type Definitions Index
 * Centralized export for all type definitions in the Git Repository Q&A Service
 */

// Export all types from each module
export * from './api-types';
export * from './repository-types';
export * from './config-types';
export * from './error-types';
export * from './lock-types';

// Re-export commonly used types with specific imports for convenience
import type {
  AskRequest,
  AskResponse,
  AskSuccessResponse,
  AskErrorResponse,
  RepositoryInfo
} from './api-types';

import type {
  RepositoryMetadata,
  GitCloneMethod,
  GitOperationResult
} from './repository-types';

import type {
  ServiceConfig,
  ServerConfig,
  GeminiConfig,
  RepositoryConfig
} from './config-types';

import type {
  BaseError,
  ServiceErrorType
} from './error-types';

import type {
  LockOptions,
  LockResult
} from './lock-types';

// Re-export the imported types
export type {
  // Core API interfaces
  AskRequest,
  AskResponse,
  AskSuccessResponse,
  AskErrorResponse,
  RepositoryInfo,
  
  // Repository management
  RepositoryMetadata,
  GitCloneMethod,
  GitOperationResult,
  
  // Configuration
  ServiceConfig,
  ServerConfig,
  GeminiConfig,
  RepositoryConfig,
  
  // Error handling
  BaseError,
  ServiceErrorType,
  
  // Lock management
  LockOptions,
  LockResult
};

// Create type aliases for convenience
export type {
  GitCloneMethod as CloneMethod
} from './repository-types'; 