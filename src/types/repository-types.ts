/**
 * Repository Types for Git Repository Q&A Service
 * Defines interfaces for repository management and Git operations
 */

/**
 * Supported Git clone methods
 */
export type GitCloneMethod = 'https' | 'ssh';

/**
 * Repository status enumeration
 */
export enum RepositoryStatus {
  /** Repository does not exist locally */
  NOT_EXISTS = 'not_exists',
  /** Repository exists and is up to date */
  FRESH = 'fresh',
  /** Repository exists but needs updating */
  STALE = 'stale',
  /** Repository is currently being updated */
  UPDATING = 'updating',
  /** Repository has errors and needs attention */
  ERROR = 'error'
}

/**
 * Repository metadata stored locally
 */
export interface RepositoryMetadata {
  /** Original repository URL */
  url: string;
  /** Branch being tracked */
  branch: string;
  /** Last update timestamp */
  last_updated: string;
  /** Last access timestamp */
  last_accessed: string;
  /** Current commit hash */
  commit_hash: string;
  /** Git clone method used */
  clone_method: GitCloneMethod;
  /** Repository size in MB */
  size_mb?: number;
  /** Number of files in repository */
  file_count?: number;
}

/**
 * Parsed repository URL information
 */
export interface ParsedRepositoryUrl {
  /** Repository host (e.g., 'github.com') */
  host: string;
  /** Repository owner/organization */
  owner: string;
  /** Repository name */
  name: string;
  /** Original URL */
  url: string;
  /** Whether this is an SSH URL */
  is_ssh: boolean;
}

/**
 * Repository directory information
 */
export interface RepositoryDirectory {
  /** Unique directory identifier */
  identifier: string;
  /** Full path to repository directory */
  path: string;
  /** Path to metadata file */
  metadata_path: string;
  /** Path to lock file */
  lock_path: string;
}

/**
 * Git operation result
 */
export interface GitOperationResult {
  /** Whether the operation was successful */
  success: boolean;
  /** Error message if operation failed */
  error?: string;
  /** Git command output */
  output?: string;
  /** Commit hash after operation */
  commit_hash?: string;
  /** Operation duration in milliseconds */
  duration_ms: number;
}

/**
 * Repository clone options
 */
export interface CloneOptions {
  /** Clone depth (default: 1 for shallow clone) */
  depth?: number;
  /** Specific branch to clone */
  branch?: string;
  /** Clone method preference */
  method?: GitCloneMethod;
  /** Clone timeout in seconds */
  timeout?: number;
}

/**
 * Repository update options
 */
export interface UpdateOptions {
  /** Whether to force update even if up to date */
  force?: boolean;
  /** Update timeout in seconds */
  timeout?: number;
  /** Whether to prune remote branches */
  prune?: boolean;
}

/**
 * Repository validation result
 */
export interface RepositoryValidationResult {
  /** Whether the repository is valid */
  is_valid: boolean;
  /** Validation error message if invalid */
  error?: string;
  /** Detected repository information */
  info?: {
    default_branch: string;
    is_private: boolean;
    size_kb: number;
    last_commit: string;
  };
}

/**
 * Repository statistics
 */
export interface RepositoryStats {
  /** Total number of cached repositories */
  total_repositories: number;
  /** Total storage used in MB */
  total_storage_mb: number;
  /** Number of repositories accessed today */
  accessed_today: number;
  /** Number of repositories updated today */
  updated_today: number;
  /** Average repository size in MB */
  avg_repository_size_mb: number;
  /** Oldest repository timestamp */
  oldest_repository: string;
  /** Newest repository timestamp */
  newest_repository: string;
}

/**
 * Repository cleanup criteria
 */
export interface CleanupCriteria {
  /** Maximum age in hours for unused repositories */
  max_age_hours: number;
  /** Maximum total storage in GB */
  max_storage_gb: number;
  /** Keep at least this many most recently accessed repositories */
  keep_recent_count: number;
}

/**
 * Repository cleanup result
 */
export interface CleanupResult {
  /** Number of repositories removed */
  removed_count: number;
  /** Storage space freed in MB */
  freed_space_mb: number;
  /** List of removed repository identifiers */
  removed_repositories: string[];
  /** Cleanup duration in milliseconds */
  duration_ms: number;
  /** Any cleanup errors */
  errors: string[];
} 