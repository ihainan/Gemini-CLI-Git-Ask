/**
 * Lock Types for Git Repository Q&A Service
 * Defines interfaces for concurrency control and lock management
 */

/**
 * Lock operation types
 */
export enum LockType {
  /** Read lock - allows multiple readers */
  READ = 'read',
  /** Write lock - exclusive access */
  WRITE = 'write'
}

/**
 * Lock status enumeration
 */
export enum LockStatus {
  /** Lock is available */
  AVAILABLE = 'available',
  /** Lock is currently held */
  LOCKED = 'locked',
  /** Lock is waiting to be acquired */
  WAITING = 'waiting',
  /** Lock acquisition failed */
  FAILED = 'failed',
  /** Lock has expired */
  EXPIRED = 'expired'
}

/**
 * Lock acquisition options
 */
export interface LockOptions {
  /** Lock type to acquire */
  type: LockType;
  /** Maximum time to wait for lock in milliseconds */
  timeout_ms: number;
  /** Retry interval in milliseconds */
  retry_interval_ms?: number;
  /** Lock holder identifier */
  holder_id?: string;
  /** Additional lock metadata */
  metadata?: Record<string, any>;
}

/**
 * Lock information
 */
export interface LockInfo {
  /** Resource being locked */
  resource: string;
  /** Lock type currently held */
  type: LockType;
  /** Lock status */
  status: LockStatus;
  /** ID of the process/thread holding the lock */
  holder_id: string;
  /** Timestamp when lock was acquired */
  acquired_at: string;
  /** Timestamp when lock expires */
  expires_at: string;
  /** Lock file path */
  lock_file_path: string;
  /** Additional metadata */
  metadata?: Record<string, any>;
}

/**
 * Lock acquisition result
 */
export interface LockResult {
  /** Whether lock was successfully acquired */
  success: boolean;
  /** Lock information if successful */
  lock_info?: LockInfo;
  /** Error message if failed */
  error?: string;
  /** Time taken to acquire lock in milliseconds */
  acquisition_time_ms: number;
  /** Number of retry attempts made */
  retry_attempts: number;
}

/**
 * Lock release result
 */
export interface LockReleaseResult {
  /** Whether lock was successfully released */
  success: boolean;
  /** Error message if failed */
  error?: string;
  /** Time lock was held in milliseconds */
  held_duration_ms: number;
}

/**
 * Lock manager statistics
 */
export interface LockManagerStats {
  /** Total number of active locks */
  active_locks: number;
  /** Number of read locks currently held */
  active_read_locks: number;
  /** Number of write locks currently held */
  active_write_locks: number;
  /** Number of operations waiting for locks */
  waiting_operations: number;
  /** Average lock hold time in milliseconds */
  avg_lock_hold_time_ms: number;
  /** Lock acquisition success rate */
  acquisition_success_rate: number;
  /** Lock timeout rate */
  timeout_rate: number;
  /** Lock contention rate */
  contention_rate: number;
}

/**
 * Lock manager configuration
 */
export interface LockManagerConfig {
  /** Default lock timeout in milliseconds */
  default_timeout_ms: number;
  /** Default retry interval in milliseconds */
  default_retry_interval_ms: number;
  /** Maximum number of retry attempts */
  max_retry_attempts: number;
  /** Lock cleanup interval in milliseconds */
  cleanup_interval_ms: number;
  /** Directory for lock files */
  lock_directory: string;
  /** Enable lock statistics collection */
  enable_stats: boolean;
  /** Lock file prefix */
  lock_file_prefix: string;
}

/**
 * Lock cleanup result
 */
export interface LockCleanupResult {
  /** Number of expired locks cleaned up */
  cleaned_count: number;
  /** Number of orphaned lock files removed */
  orphaned_count: number;
  /** List of cleaned lock resources */
  cleaned_resources: string[];
  /** Cleanup duration in milliseconds */
  cleanup_duration_ms: number;
  /** Any cleanup errors */
  errors: string[];
}

/**
 * Lock queue entry
 */
export interface LockQueueEntry {
  /** Unique request ID */
  request_id: string;
  /** Resource being requested */
  resource: string;
  /** Lock type requested */
  type: LockType;
  /** Request timestamp */
  requested_at: string;
  /** Request timeout timestamp */
  timeout_at: string;
  /** Requester identifier */
  requester_id: string;
  /** Request priority (higher number = higher priority) */
  priority: number;
  /** Request metadata */
  metadata?: Record<string, any>;
} 