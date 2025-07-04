/**
 * Repository-related type definitions
 */

export interface RepositoryMetadata {
  url: string;
  branch: string;
  last_updated: string;
  last_accessed: string;
  commit_hash: string;
  clone_method: 'https' | 'ssh';
}

export interface RepositoryInfo {
  url: string;
  branch: string;
  localPath: string;
  exists: boolean;
  metadata?: RepositoryMetadata | undefined;
}

export interface CloneOptions {
  depth?: number;
  branch?: string;
  force?: boolean;
}

export interface UpdateResult {
  updated: boolean;
  previousHash: string;
  currentHash: string;
  changes: number;
}

export interface RepositoryStats {
  totalRepositories: number;
  diskUsage: number;
  oldestAccess: string;
  newestAccess: string;
}

export enum RepositoryError {
  INVALID_URL = 'INVALID_URL',
  CLONE_FAILED = 'CLONE_FAILED',
  UPDATE_FAILED = 'UPDATE_FAILED',
  NOT_FOUND = 'NOT_FOUND',
  LOCK_FAILED = 'LOCK_FAILED',
  METADATA_ERROR = 'METADATA_ERROR',
  STORAGE_ERROR = 'STORAGE_ERROR'
}

export class RepositoryException extends Error {
  constructor(
    public readonly code: RepositoryError,
    message: string,
    public readonly details?: any
  ) {
    super(message);
    this.name = 'RepositoryException';
  }
}

export interface LockOptions {
  timeout?: number;
  retries?: number;
  retryInterval?: number;
}

export interface RepositoryManagerConfig {
  storagePath: string;
  cloneMethod: 'https' | 'ssh';
  cloneDepth: number;
  updateThresholdHours: number;
  accessTimeoutHours: number;
  maxConcurrentOperations: number;
  defaultBranch: string;
  // Lock configuration
  lockSettings?: {
    retries?: number;
    retryIntervalMs?: number;
    staleTimeoutMs?: number;
  };
} 