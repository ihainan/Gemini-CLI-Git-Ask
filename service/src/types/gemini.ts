/**
 * Gemini CLI-related type definitions
 */

export interface GeminiConfig {
  model: string;
  api_timeout: number;
  all_files_mode: 'always' | 'never' | 'auto';
  auto_all_files_thresholds: {
    max_files: number;
    max_size_mb: number;
  };
  base_prompt: string;
}

export interface GeminiRequest {
  repositoryPath: string;
  question: string;
  context?: string;
  timeout?: number;
  repositoryStats?: SingleRepositoryStats;
}

export interface GeminiResponse {
  answer: string;
  model: string;
  execution_time: number;
  tokens_used?: number;
}

export interface GeminiExecutionOptions {
  cwd?: string;
  timeout?: number;
  maxBuffer?: number;
  env?: Record<string, string>;
}

export enum GeminiError {
  EXECUTION_FAILED = 'EXECUTION_FAILED',
  TIMEOUT_EXCEEDED = 'TIMEOUT_EXCEEDED',
  INVALID_RESPONSE = 'INVALID_RESPONSE',
  CLI_NOT_FOUND = 'CLI_NOT_FOUND',
  INVALID_REQUEST = 'INVALID_REQUEST',
  API_ERROR = 'API_ERROR',
  INTERNAL_ERROR = 'INTERNAL_ERROR'
}

export class GeminiException extends Error {
  constructor(
    public readonly code: GeminiError,
    message: string,
    public readonly details?: any,
    public readonly stderr?: string
  ) {
    super(message);
    this.name = 'GeminiException';
  }
}

export interface GeminiCliResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  executionTime: number;
}

export interface GeminiExecutorConfig {
  model: string;
  apiTimeout: number;
  allFilesMode: 'always' | 'never' | 'auto';
  autoAllFilesThresholds: {
    maxFiles: number;
    maxSizeMb: number;
  };
  basePrompt: string;
  cliPath?: string;
  maxBuffer?: number;
}

export interface SingleRepositoryStats {
  fileCount: number;
  totalSizeMb: number;
  codeFileCount: number;
  largestFileSizeMb: number;
} 