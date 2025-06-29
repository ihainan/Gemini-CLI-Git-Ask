/**
 * Gemini CLI Factory Utilities
 * Factory functions for creating GeminiExecutor instances from configuration
 */

import { GeminiExecutor } from '../services/gemini-executor';
import { GeminiExecutorConfig, GeminiConfig } from '../types';

/**
 * Create GeminiExecutorConfig from application configuration
 */
export function createGeminiExecutorConfig(geminiConfig: GeminiConfig, cliPath?: string): GeminiExecutorConfig {
  return {
    model: geminiConfig.model,
    apiTimeout: geminiConfig.api_timeout,
    allFilesMode: geminiConfig.all_files_mode,
    autoAllFilesThresholds: {
      maxFiles: geminiConfig.auto_all_files_thresholds.max_files,
      maxSizeMb: geminiConfig.auto_all_files_thresholds.max_size_mb
    },
    basePrompt: geminiConfig.base_prompt,
    cliPath: cliPath || 'gemini',
    maxBuffer: 1024 * 1024 * 10 // 10MB default
  };
}

/**
 * Create GeminiExecutor instance from application configuration
 */
export function createGeminiExecutor(geminiConfig: GeminiConfig, cliPath?: string): GeminiExecutor {
  const executorConfig = createGeminiExecutorConfig(geminiConfig, cliPath);
  return new GeminiExecutor(executorConfig);
} 