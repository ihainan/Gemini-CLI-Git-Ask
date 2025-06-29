/**
 * API Types for Git Repository Q&A Service
 * Defines request/response interfaces for the REST API
 */

/**
 * Request interface for the /api/v1/ask endpoint
 */
export interface AskRequest {
  /** Git repository URL (HTTPS or SSH) */
  repository_url: string;
  /** Question to ask about the repository */
  question: string;
  /** Optional branch name (defaults to repository's default branch) */
  branch?: string;
  /** Optional timeout in seconds */
  timeout?: number;
}

/**
 * Repository information included in responses
 */
export interface RepositoryInfo {
  /** Original repository URL */
  url: string;
  /** Branch that was analyzed */
  branch: string;
  /** Current commit hash */
  commit_hash: string;
}

/**
 * Successful response from the /api/v1/ask endpoint
 */
export interface AskSuccessResponse {
  /** Response status */
  status: 'success';
  /** Answer from Gemini CLI */
  answer: string;
  /** Repository information */
  repository: RepositoryInfo;
  /** Execution time in seconds */
  execution_time: number;
}

/**
 * Error response from the /api/v1/ask endpoint
 */
export interface AskErrorResponse {
  /** Response status */
  status: 'error';
  /** Error code for programmatic handling */
  error_code: string;
  /** Human-readable error message */
  message: string;
  /** Optional additional error details */
  details?: Record<string, any>;
}

/**
 * Union type for all possible API responses
 */
export type AskResponse = AskSuccessResponse | AskErrorResponse;

/**
 * Health check response
 */
export interface HealthResponse {
  /** Service health status */
  status: 'healthy' | 'unhealthy';
  /** Timestamp of the health check */
  timestamp: string;
  /** Service version */
  version: string;
  /** Optional additional health information */
  details?: Record<string, any>;
}

/**
 * Readiness check response
 */
export interface ReadyResponse {
  /** Service readiness status */
  status: 'ready' | 'not-ready';
  /** Timestamp of the readiness check */
  timestamp: string;
  /** Optional readiness details */
  details?: Record<string, any>;
}

/**
 * Metrics response structure
 */
export interface MetricsResponse {
  /** Request metrics */
  requests: {
    total: number;
    success: number;
    error: number;
    rate_per_minute: number;
    avg_response_time_ms: number;
  };
  /** Repository metrics */
  repositories: {
    total_cached: number;
    cache_hit_ratio: number;
    storage_usage_mb: number;
  };
  /** Gemini CLI metrics */
  gemini: {
    executions: number;
    avg_execution_time_ms: number;
    success_rate: number;
  };
  /** System metrics */
  system: {
    uptime_seconds: number;
    active_locks: number;
    memory_usage_mb: number;
  };
} 