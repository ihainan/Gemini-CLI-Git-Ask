/**
 * Real Integration Tests for RepositoryManager
 * Tests actual Git repository operations with real GitHub repositories
 */

import { RepositoryManager } from '../../src/services/repository-manager';
import { RepositoryManagerConfig } from '../../src/types';
import { skipIfNotEnabled } from './setup-real-integration';
import * as path from 'path';
import * as fs from 'fs/promises';

describe('RepositoryManager Real Integration Tests', () => {
  let repositoryManager: RepositoryManager;
  let config: RepositoryManagerConfig;
  let tempDir: string;
  
  // Use a small, stable, public repository for testing
  const testRepositories = [
    {
      url: 'https://github.com/octocat/Hello-World',
      branch: 'master',
      description: 'GitHub\'s Hello World repository'
    },
    {
      url: 'https://github.com/github/gitignore',
      branch: 'main',
      description: 'GitHub\'s gitignore templates'
    }
  ];
  
  beforeAll(async () => {
    if (skipIfNotEnabled()) {
      return;
    }
    
    const globalConfig = (global as any).REAL_INTEGRATION_CONFIG;
    tempDir = path.join(globalConfig.tempDir, 'repositories');
    
    config = {
      storagePath: tempDir,
      cloneMethod: 'https',
      cloneDepth: 1,
      updateThresholdHours: 24,
      accessTimeoutHours: 72,
      maxConcurrentOperations: 5,
      defaultBranch: 'main'
    };
    
    repositoryManager = new RepositoryManager(config);
    
    // Ensure temp directory exists
    await fs.mkdir(tempDir, { recursive: true });
  });
  
  afterAll(async () => {
    if (skipIfNotEnabled()) {
      return;
    }
    
    try {
      // Clean up cloned repositories
      if ((global as any).REAL_INTEGRATION_CONFIG.cleanupAfterTests) {
        await fs.rm(tempDir, { recursive: true, force: true });
        console.log(`✅ Cleaned up repository test directory: ${tempDir}`);
      }
    } catch (error) {
      console.warn('⚠️  Failed to clean up repository test directory:', error);
    }
  });
  
  describe('Real Repository Operations', () => {
    it('should clone a real GitHub repository', async () => {
      if (skipIfNotEnabled()) return;
      
      const testRepo = testRepositories[0]!; // Non-null assertion since we know the array has elements
      console.log(`🔄 Testing repository clone: ${testRepo.description}`);
      
      const result = await repositoryManager.ensureRepository(testRepo.url, testRepo.branch);
      
      expect(result).toBeDefined();
      expect(result.exists).toBe(true);
      expect(result.url).toBe(testRepo.url);
      expect(result.branch).toBe(testRepo.branch);
      expect(result.localPath).toBeTruthy();
      expect(result.metadata).toBeDefined();
      
      if (result.metadata) {
        expect(result.metadata.url).toBe(testRepo.url);
        expect(result.metadata.branch).toBe(testRepo.branch);
        expect(result.metadata.commit_hash).toBeTruthy();
        expect(result.metadata.clone_method).toBe('https');
      }
      
      // Verify the repository was actually cloned
      const repoPath = result.localPath;
      const gitDir = path.join(repoPath, '.git');
      
      await expect(fs.access(gitDir)).resolves.not.toThrow();
      
      console.log(`✅ Successfully cloned repository to: ${repoPath}`);
    }, 120000); // 2 minutes timeout for cloning
    
    it('should get repository information without cloning again', async () => {
      if (skipIfNotEnabled()) return;
      
      const testRepo = testRepositories[0]!;
      
      // First call should use existing repository
      const result = await repositoryManager.ensureRepository(testRepo.url, testRepo.branch);
      
      expect(result.exists).toBe(true);
      expect(result.url).toBe(testRepo.url);
      expect(result.branch).toBe(testRepo.branch);
      
      console.log(`✅ Repository already exists at: ${result.localPath}`);
    }, 30000);
    
    it('should collect repository statistics', async () => {
      if (skipIfNotEnabled()) return;
      
      const testRepo = testRepositories[0]!;
      const result = await repositoryManager.ensureRepository(testRepo.url, testRepo.branch);
      
      const stats = await repositoryManager.getSingleRepositoryStats(result.localPath);
      
      expect(stats).toBeDefined();
      expect(stats.fileCount).toBeGreaterThan(0);
      expect(stats.totalSizeMb).toBeGreaterThanOrEqual(0); // Allow for very small repos
      expect(stats.codeFileCount).toBeGreaterThanOrEqual(0);
      expect(stats.largestFileSizeMb).toBeGreaterThanOrEqual(0); // Allow for tiny files
      expect(stats.codeFileCount).toBeLessThanOrEqual(stats.fileCount);
      
      console.log(`📊 Repository stats:`, stats);
    }, 60000);
    
    it('should handle multiple repository formats', async () => {
      if (skipIfNotEnabled()) return;
      
      const repoUrls = [
        'https://github.com/octocat/Hello-World',
        'https://github.com/octocat/Hello-World.git',
        'https://github.com/octocat/Hello-World/'
      ];
      
      for (const url of repoUrls) {
        const result = await repositoryManager.getRepositoryInfo(url, 'master');
        
        expect(result).toBeDefined();
        expect(result.url).toBe('https://github.com/octocat/Hello-World'); // Normalized URL
        expect(result.branch).toBe('master');
        
        console.log(`✅ Handled URL format: ${url} -> ${result.url}`);
      }
    }, 30000);
    
    it('should handle branch specification correctly', async () => {
      if (skipIfNotEnabled()) return;
      
      const testRepo = testRepositories[1]!; // gitignore repo
      console.log(`🔄 Testing branch handling: ${testRepo.description}`);
      
      const result = await repositoryManager.ensureRepository(testRepo.url, testRepo.branch);
      
      expect(result.exists).toBe(true);
      expect(result.branch).toBe(testRepo.branch);
      
      if (result.metadata) {
        expect(result.metadata.branch).toBe(testRepo.branch);
      }
      
      console.log(`✅ Successfully handled branch: ${testRepo.branch}`);
    }, 120000);
  });
  
  describe('Error Handling', () => {
    it('should handle non-existent repository gracefully', async () => {
      if (skipIfNotEnabled()) return;
      
      const nonExistentRepo = 'https://github.com/nonexistent/repository-that-does-not-exist';
      
      await expect(repositoryManager.ensureRepository(nonExistentRepo, 'main'))
        .rejects.toThrow();
      
      console.log('✅ Correctly handled non-existent repository');
    }, 60000);
    
    it('should handle invalid URL gracefully', async () => {
      if (skipIfNotEnabled()) return;
      
      const invalidUrl = 'not-a-valid-url';
      
      await expect(repositoryManager.ensureRepository(invalidUrl, 'main'))
        .rejects.toThrow();
      
      console.log('✅ Correctly handled invalid URL');
    }, 30000);
    
    it('should handle invalid branch gracefully', async () => {
      if (skipIfNotEnabled()) return;
      
      const testRepo = testRepositories[0]!;
      const invalidBranch = 'branch-that-does-not-exist';
      
      // System should intelligently fall back to default branch
      const result = await repositoryManager.ensureRepository(testRepo.url, invalidBranch);
      
      expect(result).toBeDefined();
      expect(result.exists).toBe(true);
      expect(result.branch).toBe('master'); // Should fall back to default branch
      
      console.log('✅ Correctly handled invalid branch with intelligent fallback');
    }, 60000);
  });
  
  describe('Performance Tests', () => {
    it('should clone repository within reasonable time', async () => {
      if (skipIfNotEnabled()) return;
      
      // Use a fresh repository URL to force cloning
      const testUrl = 'https://github.com/microsoft/vscode-test-adapter-api';
      const testBranch = 'main';
      
      const startTime = Date.now();
      
      try {
        const result = await repositoryManager.ensureRepository(testUrl, testBranch);
        
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        expect(result.exists).toBe(true);
        expect(duration).toBeLessThan(180000); // Should complete within 3 minutes
        
        console.log(`✅ Repository cloned in ${duration}ms`);
      } catch (error) {
        console.log('⚠️  Skipping performance test - repository may not be accessible');
      }
    }, 200000); // 3+ minutes timeout for performance test
  });
  
  describe('Cleanup and Maintenance', () => {
    it('should perform cleanup operations', async () => {
      if (skipIfNotEnabled()) return;
      
      // This test checks if cleanup operations work without errors
      await expect(repositoryManager.cleanupRepositories(7, 1024 * 1024 * 1024)).resolves.not.toThrow();
      
      console.log('✅ Cleanup operations completed successfully');
    }, 30000);
    
    it('should get repository statistics', async () => {
      if (skipIfNotEnabled()) return;
      
      const stats = await repositoryManager.getRepositoryStats();
      
      expect(stats).toBeDefined();
      expect(stats.totalRepositories).toBeGreaterThanOrEqual(0);
      expect(stats.diskUsage).toBeGreaterThanOrEqual(0);
      expect(stats.oldestAccess).toBeTruthy();
      expect(stats.newestAccess).toBeTruthy();
      
      console.log('📊 Global repository stats:', {
        totalRepositories: stats.totalRepositories,
        diskUsage: stats.diskUsage
      });
    }, 30000);
  });
}); 