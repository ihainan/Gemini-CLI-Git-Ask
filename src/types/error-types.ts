/**
 * Error Types for Git Repository Q&A Service
 * Defines error codes, categories, and interfaces for error handling
 */

/**
 * Error codes as defined in the service specification
 */
export enum ErrorCode {
  // Validation Errors
  INVALID_REQUEST = 'INVALID_REQUEST',
  INVALID_REPOSITORY_URL = 'INVALID_REPOSITORY_URL', 
  INVALID_PARAMETERS = 'INVALID_PARAMETERS',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',
  
  // Repository Errors
  REPOSITORY_NOT_FOUND = 'REPOSITORY_NOT_FOUND',
  REPOSITORY_CLONE_FAILED = 'REPOSITORY_CLONE_FAILED',
  REPOSITORY_UPDATE_FAILED = 'REPOSITORY_UPDATE_FAILED',
  REPOSITORY_ACCESS_DENIED = 'REPOSITORY_ACCESS_DENIED',
  REPOSITORY_TOO_LARGE = 'REPOSITORY_TOO_LARGE',
  
  // Lock Errors
  LOCK_TIMEOUT = 'LOCK_TIMEOUT',
  LOCK_ACQUISITION_FAILED = 'LOCK_ACQUISITION_FAILED',
  CONCURRENT_OPERATION_LIMIT = 'CONCURRENT_OPERATION_LIMIT',
  
  // Gemini Errors
  GEMINI_EXECUTION_FAILED = 'GEMINI_EXECUTION_FAILED',
  GEMINI_API_ERROR = 'GEMINI_API_ERROR',
  GEMINI_QUOTA_EXCEEDED = 'GEMINI_QUOTA_EXCEEDED',
  GEMINI_MODEL_NOT_AVAILABLE = 'GEMINI_MODEL_NOT_AVAILABLE',
  
  // System Errors
  TIMEOUT_EXCEEDED = 'TIMEOUT_EXCEEDED',
  STORAGE_FULL = 'STORAGE_FULL',
  INSUFFICIENT_RESOURCES = 'INSUFFICIENT_RESOURCES',
  NETWORK_ERROR = 'NETWORK_ERROR',
  FILE_SYSTEM_ERROR = 'FILE_SYSTEM_ERROR',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  
  // Configuration Errors
  CONFIG_LOAD_FAILED = 'CONFIG_LOAD_FAILED',
  CONFIG_VALIDATION_FAILED = 'CONFIG_VALIDATION_FAILED',
  INVALID_CONFIG_FORMAT = 'INVALID_CONFIG_FORMAT',
  
  // Service Errors
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  SERVICE_OVERLOADED = 'SERVICE_OVERLOADED',
  MAINTENANCE_MODE = 'MAINTENANCE_MODE'
}

/**
 * Error categories for grouping related errors
 */
export enum ErrorCategory {
  VALIDATION = 'validation',
  REPOSITORY = 'repository', 
  CONCURRENCY = 'concurrency',
  GEMINI = 'gemini',
  SYSTEM = 'system',
  CONFIGURATION = 'configuration',
  SERVICE = 'service'
}

/**
 * Error severity levels
 */
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

/**
 * Base error interface
 */
export interface BaseError {
  /** Error code for programmatic handling */
  code: ErrorCode;
  /** Error category */
  category: ErrorCategory;
  /** Human-readable error message */
  message: string;
  /** Error severity level */
  severity: ErrorSeverity;
  /** Timestamp when error occurred */
  timestamp: string;
  /** Additional error context */
  context?: Record<string, any>;
}

/**
 * Validation error details
 */
export interface ValidationError extends BaseError {
  category: ErrorCategory.VALIDATION;
  /** Field that failed validation */
  field?: string;
  /** Expected value or format */
  expected?: string;
  /** Actual received value */
  received?: string;
  /** Validation rule that was violated */
  rule?: string;
}

/**
 * Repository error details
 */
export interface RepositoryError extends BaseError {
  category: ErrorCategory.REPOSITORY;
  /** Repository URL that caused the error */
  repository_url?: string;
  /** Git operation that failed */
  git_operation?: string;
  /** Git error output */
  git_error?: string;
  /** Repository branch */
  branch?: string;
}

/**
 * Concurrency error details
 */
export interface ConcurrencyError extends BaseError {
  category: ErrorCategory.CONCURRENCY;
  /** Resource that was locked */
  resource?: string;
  /** Lock timeout duration */
  timeout_duration?: number;
  /** Number of waiting operations */
  queue_length?: number;
}

/**
 * Gemini CLI error details
 */
export interface GeminiError extends BaseError {
  category: ErrorCategory.GEMINI;
  /** Gemini CLI command that failed */
  command?: string;
  /** Gemini CLI exit code */
  exit_code?: number;
  /** Gemini CLI stderr output */
  stderr?: string;
  /** API error details if applicable */
  api_error?: Record<string, any>;
}

/**
 * System error details
 */
export interface SystemError extends BaseError {
  category: ErrorCategory.SYSTEM;
  /** System resource affected */
  resource?: string;
  /** Available vs required resource amounts */
  resource_info?: {
    available: number;
    required: number;
    unit: string;
  };
  /** System error code */
  system_code?: number;
}

/**
 * Configuration error details
 */
export interface ConfigurationError extends BaseError {
  category: ErrorCategory.CONFIGURATION;
  /** Configuration file path */
  config_file?: string;
  /** Configuration section that failed */
  config_section?: string;
  /** Configuration validation errors */
  validation_errors?: string[];
}

/**
 * Service error details
 */
export interface ServiceError extends BaseError {
  category: ErrorCategory.SERVICE;
  /** Service component that failed */
  component?: string;
  /** Service health status */
  health_status?: string;
  /** Recommended action */
  recommended_action?: string;
}

/**
 * Union type for all specific error types
 */
export type ServiceErrorType = 
  | ValidationError
  | RepositoryError
  | ConcurrencyError
  | GeminiError
  | SystemError
  | ConfigurationError
  | ServiceError;

/**
 * Error response details for API responses
 */
export interface ErrorDetails {
  /** Unique error ID for tracking */
  error_id: string;
  /** Error trace ID for correlation */
  trace_id?: string;
  /** Stack trace (only in development) */
  stack_trace?: string;
  /** Related errors */
  related_errors?: BaseError[];
  /** Error metadata */
  metadata?: Record<string, any>;
}

/**
 * Error statistics for monitoring
 */
export interface ErrorStats {
  /** Total error count */
  total_errors: number;
  /** Errors by category */
  by_category: Record<ErrorCategory, number>;
  /** Errors by code */
  by_code: Record<ErrorCode, number>;
  /** Errors by severity */
  by_severity: Record<ErrorSeverity, number>;
  /** Error rate per minute */
  error_rate: number;
  /** Most frequent errors */
  top_errors: Array<{
    code: ErrorCode;
    count: number;
    percentage: number;
  }>;
}

/**
 * Error handler configuration
 */
export interface ErrorHandlerConfig {
  /** Whether to include stack traces in responses */
  include_stack_trace: boolean;
  /** Whether to log errors automatically */
  auto_log: boolean;
  /** Error reporting endpoints */
  reporting_endpoints?: string[];
  /** Error notification thresholds */
  notification_thresholds?: Record<ErrorSeverity, number>;
} 