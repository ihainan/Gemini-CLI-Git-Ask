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
    temperature: geminiConfig.temperature,
    topP: geminiConfig.top_p,
    topK: geminiConfig.top_k,
    maxOutputTokens: geminiConfig.max_output_tokens,
    apiTimeout: geminiConfig.api_timeout,
    basePrompt: geminiConfig.base_prompt,
    cliPath: cliPath || 'gemini-cli',
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