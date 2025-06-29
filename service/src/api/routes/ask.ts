/**
 * Ask API Route Handler
 * Main endpoint for repository code Q&A
 */

import { Request, Response, NextFunction } from 'express';
import { AskRequest, AskSuccessResponse, ApiException, ApiErrorCode } from '../../types';
import { RepositoryManager } from '../../services/repository-manager';
import { GeminiExecutor } from '../../services/gemini-executor';
import { logger } from '../../utils/logger';
import { ConfigManager } from '../../config/config-manager';

export class AskController {
  private repositoryManager: RepositoryManager;
  private geminiExecutor: GeminiExecutor;

  constructor() {
    const config = ConfigManager.getInstance();
    
    // Initialize Repository Manager
    this.repositoryManager = new RepositoryManager({
      storagePath: config.get('repository.storage_path'),
      cloneMethod: config.get('repository.clone_method'),
      cloneDepth: config.get('repository.clone_depth'),
      updateThresholdHours: config.get('repository.update_threshold_hours'),
      accessTimeoutHours: config.get('repository.access_timeout_hours'),
      maxConcurrentOperations: config.get('repository.max_concurrent_operations'),
      defaultBranch: 'main'
    });

    // Initialize Gemini Executor
    this.geminiExecutor = new GeminiExecutor({
      model: config.get('gemini.model'),
      apiTimeout: config.get('gemini.api_timeout'),
      allFilesMode: config.get('gemini.all_files_mode'),
      autoAllFilesThresholds: {
        maxFiles: config.get('gemini.auto_all_files_thresholds.max_files'),
        maxSizeMb: config.get('gemini.auto_all_files_thresholds.max_size_mb')
      },
      basePrompt: config.get('gemini.base_prompt')
    });
  }

  /**
   * Handle the main ask request
   */
  async handleAskRequest(req: Request, res: Response, next: NextFunction): Promise<void> {
    const startTime = Date.now();
    
    try {
      const askRequest: AskRequest = req.body;
      
      logger.info(`Processing ask request for repository: ${askRequest.repository_url}`);
      
      // Step 1: Ensure repository is available locally
      const repositoryInfo = await this.repositoryManager.ensureRepository(
        askRequest.repository_url,
        askRequest.branch
      );
      
      if (!repositoryInfo.exists || !repositoryInfo.metadata) {
        throw new ApiException(
          ApiErrorCode.REPOSITORY_NOT_FOUND,
          'Failed to prepare repository for analysis',
          { repository_url: askRequest.repository_url },
          500
        );
      }
      
      logger.info(`Repository prepared successfully: ${repositoryInfo.localPath}`);
      
      // Step 2: Get repository statistics for intelligent --all_files decision
      let repositoryStats;
      try {
        repositoryStats = await this.repositoryManager.getSingleRepositoryStats(repositoryInfo.localPath);
        logger.info(`Repository stats: ${repositoryStats.fileCount} files, ${repositoryStats.totalSizeMb}MB, ${repositoryStats.codeFileCount} code files`);
      } catch (error) {
        logger.warn(`Failed to get repository stats: ${error instanceof Error ? error.message : 'Unknown error'}`);
        // Continue without stats, GeminiExecutor will handle the missing stats
      }
      
      // Step 3: Execute Gemini CLI to answer the question
      const geminiRequest = {
        repositoryPath: repositoryInfo.localPath,
        question: askRequest.question,
        ...(repositoryStats && { repositoryStats }),
        ...(askRequest.timeout && { timeout: askRequest.timeout })
      };
      
      const geminiResponse = await this.geminiExecutor.ask(geminiRequest);
      
      const totalExecutionTime = Date.now() - startTime;
      
      // Step 3: Prepare and send success response
      const response: AskSuccessResponse = {
        status: 'success',
        answer: geminiResponse.answer,
        repository: {
          url: repositoryInfo.metadata.url,
          branch: repositoryInfo.metadata.branch,
          commit_hash: repositoryInfo.metadata.commit_hash
        },
        execution_time: totalExecutionTime
      };
      
      logger.info(`Ask request completed successfully in ${totalExecutionTime}ms`);
      res.json(response);
      
    } catch (error) {
      // Log error with context
      const executionTime = Date.now() - startTime;
      logger.error(`Ask request failed after ${executionTime}ms:`, {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        request: req.body
      });
      
      // Pass error to error handler middleware
      next(error);
    }
  }

  /**
   * Get repository statistics
   */
  async handleStatsRequest(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      logger.info('Processing repository stats request');
      
      const stats = await this.repositoryManager.getRepositoryStats();
      
      res.json({
        status: 'success',
        data: stats
      });
      
    } catch (error) {
      logger.error('Repository stats request failed:', error);
      next(error);
    }
  }

  /**
   * Health check for Gemini CLI
   */
  async handleGeminiHealthCheck(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      logger.debug('Checking Gemini CLI health');
      
      const isAvailable = await this.geminiExecutor.checkAvailability();
      
      if (!isAvailable) {
        throw new ApiException(
          ApiErrorCode.GEMINI_EXECUTION_FAILED,
          'Gemini CLI is not available',
          undefined,
          503
        );
      }
      
      const version = await this.geminiExecutor.getVersion();
      
      res.json({
        status: 'success',
        gemini_cli: {
          available: true,
          version: version
        }
      });
      
    } catch (error) {
      logger.error('Gemini CLI health check failed:', error);
      next(error);
    }
  }
}

// Lazy initialization of controller
let askController: AskController | null = null;

function getController(): AskController {
  if (!askController) {
    askController = new AskController();
  }
  return askController;
}

// Export route handlers with lazy initialization
export const handleAskRequest = (req: Request, res: Response, next: NextFunction) => 
  getController().handleAskRequest(req, res, next);

export const handleStatsRequest = (req: Request, res: Response, next: NextFunction) => 
  getController().handleStatsRequest(req, res, next);

export const handleGeminiHealthCheck = (req: Request, res: Response, next: NextFunction) => 
  getController().handleGeminiHealthCheck(req, res, next); 