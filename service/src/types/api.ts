/**
 * API-related type definitions
 */

export interface AskRequest {
  repository_url: string;
  question: string;
  branch?: string;
  timeout?: number;
}

export interface AskSuccessResponse {
  status: 'success';
  answer: string;
  repository: {
    url: string;
    branch: string;
    commit_hash: string;
  };
  execution_time: number;
}

export interface AskErrorResponse {
  status: 'error';
  error_code: string;
  message: string;
  details?: any;
}

export type AskResponse = AskSuccessResponse | AskErrorResponse;

export enum ApiErrorCode {
  INVALID_REQUEST = 'INVALID_REQUEST',
  REPOSITORY_NOT_FOUND = 'REPOSITORY_NOT_FOUND',
  REPOSITORY_CLONE_FAILED = 'REPOSITORY_CLONE_FAILED',
  LOCK_TIMEOUT = 'LOCK_TIMEOUT',
  GEMINI_EXECUTION_FAILED = 'GEMINI_EXECUTION_FAILED',
  TIMEOUT_EXCEEDED = 'TIMEOUT_EXCEEDED',
  STORAGE_FULL = 'STORAGE_FULL',
  INTERNAL_ERROR = 'INTERNAL_ERROR'
}

export class ApiException extends Error {
  constructor(
    public readonly code: ApiErrorCode,
    message: string,
    public readonly details?: any,
    public readonly statusCode: number = 500
  ) {
    super(message);
    this.name = 'ApiException';
  }
}

export interface ValidationError {
  field: string;
  message: string;
  value?: any;
} 