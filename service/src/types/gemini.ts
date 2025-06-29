/**
 * Gemini CLI-related type definitions
 */

export interface GeminiConfig {
  model: string;
  temperature: number;
  top_p: number;
  top_k: number;
  max_output_tokens: number;
  api_timeout: number;
  base_prompt: string;
}

export interface GeminiRequest {
  repositoryPath: string;
  question: string;
  context?: string;
  timeout?: number;
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
  temperature: number;
  topP: number;
  topK: number;
  maxOutputTokens: number;
  apiTimeout: number;
  basePrompt: string;
  cliPath?: string;
  maxBuffer?: number;
} 