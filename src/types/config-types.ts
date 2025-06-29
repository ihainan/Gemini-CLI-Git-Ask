/**
 * Configuration Types for Git Repository Q&A Service
 * Defines interfaces for service configuration management
 */

import { GitCloneMethod } from './repository-types';

/**
 * Server configuration
 */
export interface ServerConfig {
  /** Server host address */
  host: string;
  /** Server port number */
  port: number;
  /** Maximum concurrent requests */
  max_concurrent_requests: number;
}

/**
 * Gemini CLI configuration
 */
export interface GeminiConfig {
  /** Gemini model to use */
  model: string;
  /** Temperature for response generation (0.0-1.0) */
  temperature: number;
  /** Top-p for nucleus sampling (0.0-1.0) */
  top_p: number;
  /** Top-k for top-k sampling */
  top_k: number;
  /** Maximum output tokens */
  max_output_tokens: number;
  /** API request timeout in seconds */
  api_timeout: number;
  /** Base prompt for code analysis */
  base_prompt: string;
}

/**
 * Repository management configuration
 */
export interface RepositoryConfig {
  /** Path to store repositories */
  storage_path: string;
  /** Preferred Git clone method */
  clone_method: GitCloneMethod;
  /** Clone depth for shallow clones */
  clone_depth: number;
  /** Repository update threshold in hours */
  update_threshold_hours: number;
  /** Repository access timeout in hours */
  access_timeout_hours: number;
  /** Maximum concurrent repository operations */
  max_concurrent_operations: number;
}

/**
 * Cleanup service configuration
 */
export interface CleanupConfig {
  /** Whether cleanup service is enabled */
  enabled: boolean;
  /** Cleanup interval in hours */
  interval_hours: number;
  /** Repository retention period in days */
  retention_days: number;
  /** Maximum storage limit in GB */
  max_storage_gb: number;
}

/**
 * Logging configuration
 */
export interface LoggingConfig {
  /** Log level (error, warn, info, debug) */
  level: 'error' | 'warn' | 'info' | 'debug';
  /** Log file path */
  file: string;
  /** Maximum log file size in MB */
  max_size_mb: number;
  /** Number of backup log files to keep */
  backup_count: number;
}

/**
 * Security configuration
 */
export interface SecurityConfig {
  /** Enable rate limiting */
  rate_limiting: boolean;
  /** Requests per minute per IP */
  requests_per_minute: number;
  /** Enable CORS */
  cors: boolean;
  /** Allowed CORS origins */
  cors_origins: string[];
  /** Enable request body size limit */
  body_size_limit: string;
}

/**
 * Monitoring configuration
 */
export interface MonitoringConfig {
  /** Enable metrics collection */
  enabled: boolean;
  /** Metrics collection interval in seconds */
  interval_seconds: number;
  /** Enable Prometheus metrics endpoint */
  prometheus: boolean;
  /** Metrics retention period in days */
  retention_days: number;
}

/**
 * Complete service configuration
 */
export interface ServiceConfig {
  /** Server configuration */
  server: ServerConfig;
  /** Gemini CLI configuration */
  gemini: GeminiConfig;
  /** Repository management configuration */
  repository: RepositoryConfig;
  /** Cleanup service configuration */
  cleanup: CleanupConfig;
  /** Logging configuration */
  logging: LoggingConfig;
  /** Security configuration */
  security?: SecurityConfig;
  /** Monitoring configuration */
  monitoring?: MonitoringConfig;
}

/**
 * Environment-specific configuration overrides
 */
export interface EnvironmentConfig {
  /** Environment name */
  environment: 'development' | 'testing' | 'production';
  /** Configuration overrides */
  overrides: Partial<ServiceConfig>;
}

/**
 * Configuration validation result
 */
export interface ConfigValidationResult {
  /** Whether configuration is valid */
  is_valid: boolean;
  /** Validation errors */
  errors: string[];
  /** Validation warnings */
  warnings: string[];
  /** Suggested fixes */
  suggestions: string[];
}

/**
 * Configuration source information
 */
export interface ConfigSource {
  /** Configuration file path */
  file_path: string;
  /** Configuration file last modified time */
  last_modified: Date;
  /** Configuration format */
  format: 'yaml' | 'json';
  /** Whether configuration is from environment variables */
  from_env: boolean;
}

/**
 * Runtime configuration state
 */
export interface RuntimeConfig {
  /** Current service configuration */
  config: ServiceConfig;
  /** Configuration source information */
  source: ConfigSource;
  /** Configuration validation result */
  validation: ConfigValidationResult;
  /** Configuration load timestamp */
  loaded_at: Date;
  /** Whether configuration was loaded successfully */
  loaded_successfully: boolean;
} 