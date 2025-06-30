/**
 * Gemini CLI Executor Service
 * Handles execution of Gemini CLI for code analysis and question answering
 */

import { spawn, exec, ChildProcess } from 'child_process';
import * as path from 'path';
import * as fs from 'fs/promises';
import { promisify } from 'util';
import { logger } from '../utils/logger';
import {
  GeminiRequest,
  GeminiResponse,
  GeminiExecutionOptions,
  GeminiError,
  GeminiException,
  GeminiCliResult,
  GeminiExecutorConfig
} from '../types';

const execAsync = promisify(exec);

export class GeminiExecutor {
  private readonly config: GeminiExecutorConfig;
  private readonly cliPath: string;
  private readonly maxBuffer: number;

  constructor(config: GeminiExecutorConfig) {
    this.config = config;
    this.cliPath = config.cliPath || 'gemini';
    this.maxBuffer = config.maxBuffer || 1024 * 1024 * 10; // 10MB default
  }

  /**
   * Execute Gemini CLI with a question about a repository
   */
  async ask(request: GeminiRequest): Promise<GeminiResponse> {
    logger.info(`Executing Gemini CLI request for repository: ${request.repositoryPath}`);
    
    // Validate request
    await this.validateRequest(request);
    
    const startTime = Date.now();
    
    try {
      // Prepare the prompt
      const prompt = this.buildPrompt(request);
      
      // Execute Gemini CLI
      const result = await this.executeGeminiCli(prompt, request);
      
      // Parse response
      const response = this.parseGeminiResponse(result, startTime);
      
      logger.info(`Gemini CLI execution completed successfully in ${response.execution_time}ms`);
      return response;
      
    } catch (error) {
      const executionTime = Date.now() - startTime;
      logger.error(`Gemini CLI execution failed after ${executionTime}ms:`, error);
      
      if (error instanceof GeminiException) {
        throw error;
      }
      
      throw new GeminiException(
        GeminiError.EXECUTION_FAILED,
        `Gemini CLI execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { request, executionTime, error }
      );
    }
  }

  /**
   * Check if Gemini CLI is available and working
   */
  async checkAvailability(): Promise<boolean> {
    try {
      logger.debug('Checking Gemini CLI availability');
      
      const result = await this.executeCommand([this.cliPath, '--version'], {
        timeout: 10000,
        maxBuffer: 1024 * 100 // 100KB for version check
      });
      
      const isAvailable = result.exitCode === 0 && result.stdout.trim().length > 0;
      logger.debug(`Gemini CLI availability check: ${isAvailable ? 'available' : 'not available'}`);
      
      return isAvailable;
      
    } catch (error) {
      logger.warn('Gemini CLI availability check failed:', error);
      return false;
    }
  }

  /**
   * Get Gemini CLI version information
   */
  async getVersion(): Promise<string> {
    try {
      const result = await this.executeCommand([this.cliPath, '--version'], {
        timeout: 10000,
        maxBuffer: 1024 * 100
      });
      
      if (result.exitCode !== 0) {
        throw new GeminiException(
          GeminiError.CLI_NOT_FOUND,
          'Failed to get Gemini CLI version',
          { stderr: result.stderr }
        );
      }
      
      return result.stdout.trim();
      
    } catch (error) {
      if (error instanceof GeminiException) {
        throw error;
      }
      
      throw new GeminiException(
        GeminiError.CLI_NOT_FOUND,
        `Failed to get Gemini CLI version: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { error }
      );
    }
  }

  /**
   * Validate the Gemini request
   */
  private async validateRequest(request: GeminiRequest): Promise<void> {
    if (!request.question || request.question.trim().length === 0) {
      throw new GeminiException(
        GeminiError.INVALID_REQUEST,
        'Question cannot be empty'
      );
    }

    if (!request.repositoryPath) {
      throw new GeminiException(
        GeminiError.INVALID_REQUEST,
        'Repository path is required'
      );
    }

    // Check if repository path exists
    try {
      const stats = await fs.stat(request.repositoryPath);
      if (!stats.isDirectory()) {
        throw new GeminiException(
          GeminiError.INVALID_REQUEST,
          `Repository path is not a directory: ${request.repositoryPath}`
        );
      }
    } catch (error) {
      if (error instanceof GeminiException) {
        throw error;
      }
      
      throw new GeminiException(
        GeminiError.INVALID_REQUEST,
        `Repository path does not exist: ${request.repositoryPath}`,
        { error }
      );
    }
  }

  /**
   * Build the prompt for Gemini CLI
   */
  private buildPrompt(request: GeminiRequest): string {
    let prompt = this.config.basePrompt;
    
    if (request.context) {
      prompt += `\n\nAdditional context: ${request.context}`;
    }
    
    prompt += `\n\nQuestion: ${request.question}`;
    
    return prompt;
  }

  /**
   * Determine whether to use --all_files flag based on configuration and repository stats
   */
  private shouldUseAllFiles(request: GeminiRequest): boolean {
    const mode = this.config.allFilesMode;
    
    switch (mode) {
      case 'always':
        return true;
      
      case 'never':
        return false;
      
      case 'auto':
        if (!request.repositoryStats) {
          // If no stats available, default to false for safety
          logger.warn('Repository stats not available for auto mode, defaulting to not using --all_files');
          return false;
        }
        
        const { fileCount, totalSizeMb } = request.repositoryStats;
        const thresholds = this.config.autoAllFilesThresholds;
        
        // Use --all_files if repository is small enough
        const withinFileLimit = fileCount <= thresholds.maxFiles;
        const withinSizeLimit = totalSizeMb <= thresholds.maxSizeMb;
        
        const shouldUse = withinFileLimit && withinSizeLimit;
        
        logger.info(`Auto mode decision: files=${fileCount}/${thresholds.maxFiles}, size=${totalSizeMb}MB/${thresholds.maxSizeMb}MB, use_all_files=${shouldUse}`);
        
        return shouldUse;
      
      default:
        logger.warn(`Unknown all_files_mode: ${mode}, defaulting to false`);
        return false;
    }
  }

  /**
   * Execute Gemini CLI with the prepared prompt
   */
  private async executeGeminiCli(prompt: string, request: GeminiRequest): Promise<GeminiCliResult> {
    // Escape the prompt for shell execution
    const escapedPrompt = prompt.replace(/"/g, '\\"').replace(/\$/g, '\\$').replace(/`/g, '\\`');
    
    // Build gemini command arguments based on actual CLI options
    const geminiArgs = [
      '--model', this.config.model
    ];

    // Decide whether to use --all_files based on configuration
    const shouldUseAllFiles = this.shouldUseAllFiles(request);
    if (shouldUseAllFiles) {
      geminiArgs.push('--all_files');
    }

    // Add debug flag for more verbose output
    // geminiArgs.push('--debug');

    // Build the complete shell command using pipe
    const shellCommand = `echo "${escapedPrompt}" | ${this.cliPath} ${geminiArgs.join(' ')}`;

    const requestTimeoutSeconds = request.timeout || this.config.apiTimeout;
    const timeoutMilliseconds = requestTimeoutSeconds * 1000;
    
    const options: GeminiExecutionOptions = {
      cwd: request.repositoryPath,
      timeout: timeoutMilliseconds,
      maxBuffer: this.maxBuffer
    };

    logger.debug(`Executing Gemini CLI command: ${shellCommand}`);
    logger.debug(`Working directory: ${request.repositoryPath}`);
    logger.info(`Timeout configuration: request=${request.timeout || 'not provided'}s, config=${this.config.apiTimeout}s, final=${requestTimeoutSeconds}s (${timeoutMilliseconds}ms)`);
    logger.info(`Using --all_files: ${shouldUseAllFiles} (mode: ${this.config.allFilesMode})`);
    
    return await this.executeShellCommand(shellCommand, options);
  }

  /**
   * Execute a shell command using child_process exec
   */
  private async executeShellCommand(
    command: string,
    options: GeminiExecutionOptions = {}
  ): Promise<GeminiCliResult> {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      const timeout = options.timeout || 300000; // 5 minutes default
      
      logger.debug(`Executing shell command: ${command}`);
      
      const execOptions = {
        cwd: options.cwd,
        env: { ...process.env, ...options.env },
        timeout,
        maxBuffer: options.maxBuffer || this.maxBuffer
      };
      
      exec(command, execOptions, (error: any, stdout: any, stderr: any) => {
        const executionTime = Date.now() - startTime;
        
        if (error) {
          logger.error(`Shell command failed after ${executionTime}ms:`, {
            command,
            error: error.message,
            stderr
          });
          
          if (error.message.includes('ENOENT') || error.message.includes('command not found')) {
            reject(new GeminiException(
              GeminiError.CLI_NOT_FOUND,
              `Gemini CLI not found: ${this.cliPath}`,
              { command, error, executionTime, stderr }
            ));
          } else if (error.message.includes('timeout')) {
            reject(new GeminiException(
              GeminiError.TIMEOUT_EXCEEDED,
              `Command execution timed out after ${timeout}ms`,
              { command, executionTime, timeout, stderr }
            ));
          } else {
            reject(new GeminiException(
              GeminiError.EXECUTION_FAILED,
              `Command execution failed: ${error.message}`,
              { command, error, executionTime, stderr }
            ));
          }
          return;
        }
        
        logger.debug(`Shell command completed successfully in ${executionTime}ms`);
        
        resolve({
          stdout: stdout || '',
          stderr: stderr || '',
          exitCode: 0,
          executionTime
        });
      });
    });
  }

  /**
   * Execute a command using child_process
   */
  private async executeCommand(
    args: string[], 
    options: GeminiExecutionOptions = {}
  ): Promise<GeminiCliResult> {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      const timeout = options.timeout || 300000; // 5 minutes default
      
      let stdout = '';
      let stderr = '';
      let timeoutId: NodeJS.Timeout;
      let isResolved = false;
      
      if (!args || args.length === 0) {
        reject(new GeminiException(
          GeminiError.INVALID_REQUEST,
          'Command arguments cannot be empty'
        ));
        return;
      }
      
      const [command, ...commandArgs] = args;
      
      // TypeScript type guard: ensure command is defined
      if (!command) {
        reject(new GeminiException(
          GeminiError.INVALID_REQUEST,
          'Command cannot be empty'
        ));
        return;
      }
      
      logger.debug(`Executing command: ${command} ${commandArgs.join(' ')}`);
      
      const child: ChildProcess = spawn(command, commandArgs, {
        cwd: options.cwd,
        env: { ...process.env, ...options.env },
        stdio: ['pipe', 'pipe', 'pipe'],
        shell: false
      });

      // Set up timeout
      timeoutId = setTimeout(() => {
        if (!isResolved) {
          isResolved = true;
          try {
            child.kill('SIGTERM');
          } catch (killError) {
            logger.warn('Failed to kill process:', killError);
          }
          
          // Force kill after 5 seconds if still running
          setTimeout(() => {
            if (child.pid && !child.killed) {
              try {
                child.kill('SIGKILL');
              } catch (killError) {
                logger.warn('Failed to force kill process:', killError);
              }
            }
          }, 5000);
          
          const executionTime = Date.now() - startTime;
          reject(new GeminiException(
            GeminiError.TIMEOUT_EXCEEDED,
            `Command execution timed out after ${timeout}ms`,
            { command: args.join(' '), executionTime, timeout }
          ));
        }
      }, timeout);

      // Handle stdout
      if (child.stdout) {
        child.stdout.on('data', (data: Buffer) => {
          stdout += data.toString();
          
          // Check buffer size to prevent memory issues
          if (stdout.length > (options.maxBuffer || this.maxBuffer)) {
            if (!isResolved) {
              isResolved = true;
              clearTimeout(timeoutId);
              child.kill('SIGTERM');
              
              reject(new GeminiException(
                GeminiError.EXECUTION_FAILED,
                'Output buffer overflow - response too large',
                { bufferSize: stdout.length, maxBuffer: options.maxBuffer || this.maxBuffer }
              ));
            }
          }
        });
      }

      // Handle stderr
      if (child.stderr) {
        child.stderr.on('data', (data: Buffer) => {
          stderr += data.toString();
        });
      }

      // Handle process completion
      child.on('close', (code: number | null) => {
        if (!isResolved) {
          isResolved = true;
          clearTimeout(timeoutId);
          
          const executionTime = Date.now() - startTime;
          const exitCode = code || 0;
          
          logger.debug(`Command completed with exit code ${exitCode} in ${executionTime}ms`);
          
          resolve({
            stdout,
            stderr,
            exitCode,
            executionTime
          });
        }
      });

      // Handle process errors
      child.on('error', (error: Error) => {
        if (!isResolved) {
          isResolved = true;
          clearTimeout(timeoutId);
          
          const executionTime = Date.now() - startTime;
          
          if (error.message.includes('ENOENT')) {
            reject(new GeminiException(
              GeminiError.CLI_NOT_FOUND,
              `Gemini CLI not found: ${command}`,
              { command: args.join(' '), error, executionTime }
            ));
          } else {
            reject(new GeminiException(
              GeminiError.EXECUTION_FAILED,
              `Command execution failed: ${error.message}`,
              { command: args.join(' '), error, executionTime }
            ));
          }
        }
      });
    });
  }

  /**
   * Parse the response from Gemini CLI
   */
  private parseGeminiResponse(result: GeminiCliResult, startTime: number): GeminiResponse {
    const executionTime = Date.now() - startTime;
    
    if (result.exitCode !== 0) {
      logger.error(`Gemini CLI failed with exit code ${result.exitCode}:`, result.stderr);
      
      throw new GeminiException(
        GeminiError.API_ERROR,
        `Gemini CLI returned error code ${result.exitCode}`,
        { 
          exitCode: result.exitCode,
          stderr: result.stderr,
          stdout: result.stdout 
        },
        result.stderr
      );
    }

    if (!result.stdout || result.stdout.trim().length === 0) {
      throw new GeminiException(
        GeminiError.INVALID_RESPONSE,
        'Gemini CLI returned empty response',
        { result }
      );
    }

    try {
      // Try to parse as JSON first (if Gemini CLI returns structured data)
      let response: any;
      const trimmedOutput = result.stdout.trim();
      
      if (trimmedOutput.startsWith('{') && trimmedOutput.endsWith('}')) {
        try {
          response = JSON.parse(trimmedOutput);
          
          return {
            answer: response.answer || response.response || trimmedOutput,
            model: this.config.model,
            execution_time: executionTime,
            tokens_used: response.tokens_used || response.token_count
          };
          
        } catch (parseError) {
          // If JSON parsing fails, treat as plain text
          logger.debug('Failed to parse Gemini response as JSON, treating as plain text');
        }
      }
      
      // Handle plain text response
      return {
        answer: trimmedOutput,
        model: this.config.model,
        execution_time: executionTime
      };
      
    } catch (error) {
      throw new GeminiException(
        GeminiError.INVALID_RESPONSE,
        `Failed to parse Gemini CLI response: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { result, error }
      );
    }
  }
} 