/**
 * Real Integration Tests for Full API
 * Tests the complete service with real GitHub repositories and Gemini CLI
 */

import request from 'supertest';
import express from 'express';
import { skipIfNotEnabled } from './setup-real-integration';
import { RepositoryManager } from '../../src/services/repository-manager';
import { GeminiExecutor } from '../../src/services/gemini-executor';
import { ConfigManager } from '../../src/config/config-manager';
import { logger } from '../../src/utils/logger';
import * as path from 'path';

describe('Full API Real Integration Tests', () => {
  let app: express.Application;
  let tempDir: string;
  
  beforeAll(async () => {
    if (skipIfNotEnabled()) {
      return;
    }
    
    const globalConfig = (global as any).REAL_INTEGRATION_CONFIG;
    tempDir = globalConfig.tempDir;
    
    // Create Express app with real services (no mocks)
    app = express();
    app.use(express.json());
    
    // Initialize real configuration
    const configManager = ConfigManager.getInstance();
    await configManager.load();
    const config = configManager.getAll();
    
    // Create test-specific configuration values
    const testStoragePath = path.join(tempDir, 'repositories');
    const testGeminiModel = globalConfig.geminiModel;
    const testApiTimeout = globalConfig.testTimeout / 1000; // Convert to seconds
    
    // Initialize real services
    const repositoryManager = new RepositoryManager({
      storagePath: testStoragePath,
      cloneMethod: config.repository.clone_method as 'https' | 'ssh',
      cloneDepth: config.repository.clone_depth,
      updateThresholdHours: config.repository.update_threshold_hours,
      accessTimeoutHours: config.repository.access_timeout_hours,
      maxConcurrentOperations: config.repository.max_concurrent_operations,
      defaultBranch: 'main'
    });
    
    const geminiExecutor = new GeminiExecutor({
      model: testGeminiModel,
      apiTimeout: testApiTimeout * 1000, // Convert back to ms
      allFilesMode: config.gemini.all_files_mode,
      autoAllFilesThresholds: {
        maxFiles: config.gemini.auto_all_files_thresholds.max_files,
        maxSizeMb: config.gemini.auto_all_files_thresholds.max_size_mb
      },
      basePrompt: config.gemini.base_prompt
    });
    
    // Create simple API endpoint for testing
    app.post('/api/v1/ask', async (req, res) => {
      try {
        const { repository_url, question, branch = 'main', timeout = 60000 } = req.body;
        
        if (!repository_url || !question) {
          return res.status(400).json({
            status: 'error',
            error_code: 'INVALID_REQUEST',
            message: 'repository_url and question are required'
          });
        }
        
        logger.info(`Processing real API request for ${repository_url}`);
        
        const startTime = Date.now();
        
        // Ensure repository is available
        const repoInfo = await repositoryManager.ensureRepository(repository_url, branch);
        
        // Get repository statistics
        const repoStats = await repositoryManager.getSingleRepositoryStats(repoInfo.localPath);
        
        // Execute Gemini CLI
        const geminiResult = await geminiExecutor.ask({
          repositoryPath: repoInfo.localPath,
          question,
          repositoryStats: repoStats
        });
        
        const executionTime = Date.now() - startTime;
        
        return res.json({
          status: 'success',
          answer: geminiResult.answer,
          repository: {
            url: repoInfo.url,
            branch: repoInfo.branch,
            commit_hash: repoInfo.metadata?.commit_hash || 'unknown'
          },
          execution_time: executionTime
        });
        
      } catch (error) {
        logger.error('API request failed:', error);
        
        return res.status(500).json({
          status: 'error',
          error_code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });
    
    // Health check endpoint
    app.get('/health', (req, res) => {
      res.json({ status: 'healthy', timestamp: new Date().toISOString() });
    });
    
    console.log('✅ Real API integration test environment initialized');
  });
  
  describe('End-to-End API Tests', () => {
    it('should process a real repository question successfully', async () => {
      if (skipIfNotEnabled()) return;
      
      const testRequest = {
        repository_url: 'https://github.com/octocat/Hello-World',
        question: 'What is this repository about? Please provide a brief summary.',
        branch: 'master'
      };
      
      console.log(`🔄 Processing real API request: ${testRequest.repository_url}`);
      
      const response = await request(app)
        .post('/api/v1/ask')
        .send(testRequest)
        .expect(200);
      
      expect(response.body).toHaveProperty('status', 'success');
      expect(response.body).toHaveProperty('answer');
      expect(response.body).toHaveProperty('repository');
      expect(response.body).toHaveProperty('execution_time');
      
      expect(response.body.answer).toBeTruthy();
      expect(response.body.answer.length).toBeGreaterThan(10);
      expect(response.body.repository.url).toBe(testRequest.repository_url);
      expect(response.body.repository.branch).toBe(testRequest.branch);
      expect(response.body.execution_time).toBeGreaterThan(0);
      
      console.log(`✅ API request successful:`);
      console.log(`   - Answer length: ${response.body.answer.length} characters`);
      console.log(`   - Execution time: ${response.body.execution_time}ms`);
      console.log(`   - Repository: ${response.body.repository.url}@${response.body.repository.branch}`);
      console.log(`   - Answer preview: ${response.body.answer.substring(0, 100)}...`);
      
    }, 300000); // 5 minutes timeout for full integration
    
    it('should handle different types of questions', async () => {
      if (skipIfNotEnabled()) return;
      
      const testQuestions = [
        'What programming language is primarily used in this repository?',
        'Are there any README files in this repository?',
        'What is the main purpose of this codebase?'
      ];
      
      for (const question of testQuestions) {
        console.log(`🔄 Testing question: ${question}`);
        
        const response = await request(app)
          .post('/api/v1/ask')
          .send({
            repository_url: 'https://github.com/octocat/Hello-World',
            question,
            branch: 'master'
          })
          .expect(200);
        
        expect(response.body.status).toBe('success');
        expect(response.body.answer).toBeTruthy();
        
        console.log(`   ✅ Answer received (${response.body.answer.length} chars)`);
      }
    }, 600000); // 10 minutes for multiple questions
    
    it('should handle repository with different branch', async () => {
      if (skipIfNotEnabled()) return;
      
      const testRequest = {
        repository_url: 'https://github.com/github/gitignore',
        question: 'What types of gitignore templates are available in this repository?',
        branch: 'main'
      };
      
      console.log(`🔄 Testing different branch: ${testRequest.branch}`);
      
      const response = await request(app)
        .post('/api/v1/ask')
        .send(testRequest)
        .expect(200);
      
      expect(response.body.status).toBe('success');
      expect(response.body.repository.branch).toBe('main');
      expect(response.body.answer).toBeTruthy();
      
      console.log(`✅ Branch handling successful: ${response.body.repository.branch}`);
      
    }, 300000);
    
    it('should handle validation errors correctly', async () => {
      if (skipIfNotEnabled()) return;
      
      // Test missing repository_url
      await request(app)
        .post('/api/v1/ask')
        .send({ question: 'What is this?' })
        .expect(400);
      
      // Test missing question
      await request(app)
        .post('/api/v1/ask')
        .send({ repository_url: 'https://github.com/octocat/Hello-World' })
        .expect(400);
      
      console.log('✅ Validation errors handled correctly');
    }, 30000);
    
    it('should handle non-existent repository', async () => {
      if (skipIfNotEnabled()) return;
      
      const response = await request(app)
        .post('/api/v1/ask')
        .send({
          repository_url: 'https://github.com/nonexistent/repo-that-does-not-exist',
          question: 'What is this?'
        })
        .expect(500);
      
      expect(response.body.status).toBe('error');
      expect(response.body.error_code).toBeTruthy();
      
      console.log('✅ Non-existent repository handled correctly');
    }, 120000);
  });
  
  describe('Performance and Load Tests', () => {
    it('should handle concurrent requests', async () => {
      if (skipIfNotEnabled()) return;
      
      const concurrentRequests = 3; // Keep it reasonable for real API calls
      const testRequest = {
        repository_url: 'https://github.com/octocat/Hello-World',
        question: 'What is the main file in this repository?',
        branch: 'master'
      };
      
      console.log(`🔄 Testing ${concurrentRequests} concurrent requests`);
      
      const promises = Array(concurrentRequests)
        .fill(null)
        .map(() => request(app).post('/api/v1/ask').send(testRequest));
      
      const responses = await Promise.all(promises);
      
      responses.forEach((response, index) => {
        expect(response.status).toBe(200);
        expect(response.body.status).toBe('success');
        console.log(`   ✅ Request ${index + 1}: ${response.body.execution_time}ms`);
      });
      
      console.log('✅ Concurrent requests handled successfully');
    }, 600000); // 10 minutes for concurrent requests
    
    it('should complete requests within reasonable time', async () => {
      if (skipIfNotEnabled()) return;
      
      const startTime = Date.now();
      
      const response = await request(app)
        .post('/api/v1/ask')
        .send({
          repository_url: 'https://github.com/octocat/Hello-World',
          question: 'How many files are in this repository?',
          branch: 'master'
        })
        .expect(200);
      
      const totalTime = Date.now() - startTime;
      
      expect(response.body.status).toBe('success');
      expect(totalTime).toBeLessThan(120000); // Should complete within 2 minutes
      
      console.log(`✅ Performance test: ${totalTime}ms total, ${response.body.execution_time}ms execution`);
    }, 180000); // 3 minutes timeout
  });
  
  describe('Health and Monitoring', () => {
    it('should respond to health checks', async () => {
      if (skipIfNotEnabled()) return;
      
      const response = await request(app)
        .get('/health')
        .expect(200);
      
      expect(response.body).toHaveProperty('status', 'healthy');
      expect(response.body).toHaveProperty('timestamp');
      
      console.log('✅ Health check successful');
    }, 10000);
  });
}); 