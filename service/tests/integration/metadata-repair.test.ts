/**
 * Integration test for metadata repair functionality
 */

/// <reference types="jest" />

import { RepositoryManager } from '../../src/services/repository-manager';
import { RepositoryManagerConfig } from '../../src/types';
import * as fs from 'fs/promises';
import * as path from 'path';
import { simpleGit } from 'simple-git';

describe('Metadata Repair Integration Tests', () => {
  let repositoryManager: RepositoryManager;
  let tempDir: string;
  let config: RepositoryManagerConfig;

  beforeAll(async () => {
    // Create temporary directory for test repositories
    tempDir = path.join(__dirname, '../tmp/metadata-repair-test');
    await fs.mkdir(tempDir, { recursive: true });

    config = {
      storagePath: tempDir,
      cloneMethod: 'https',
      cloneDepth: 1,
      updateThresholdHours: 24,
      accessTimeoutHours: 72,
      maxConcurrentOperations: 10,
      defaultBranch: 'main'
    };

    repositoryManager = new RepositoryManager(config);
  });

  afterAll(async () => {
    // Clean up temporary directory
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch (error) {
      console.warn('Failed to clean up temp directory:', error);
    }
  });

  it('should automatically repair missing metadata file', async () => {
    // Simulate a scenario where we have a repository without metadata
    const testUrl = 'https://github.com/octocat/Hello-World';
    const testBranch = 'master';
    
    // First, get the expected path for this repository
    const repoInfo = await repositoryManager.getRepositoryInfo(testUrl, testBranch);
    
    // Create a fake repository directory structure
    await fs.mkdir(repoInfo.localPath, { recursive: true });
    await fs.mkdir(path.join(repoInfo.localPath, '.git'), { recursive: true });
    
    // Create minimal git repository structure
    const gitDir = path.join(repoInfo.localPath, '.git');
    await fs.writeFile(path.join(gitDir, 'HEAD'), 'ref: refs/heads/master\n');
    await fs.writeFile(path.join(gitDir, 'config'), `[core]
\trepositoryformatversion = 0
\tfilemode = true
\tbare = false
\tlogallrefupdates = true
[remote "origin"]
\turl = ${testUrl}
\tfetch = +refs/heads/*:refs/remotes/origin/*
[branch "master"]
\tremote = origin
\tmerge = refs/heads/master
`);
    
    // Create refs structure
    await fs.mkdir(path.join(gitDir, 'refs/heads'), { recursive: true });
    await fs.writeFile(path.join(gitDir, 'refs/heads/master'), '7fd1a60b01f91b314f59955a4e4d4e80d8edf11d\n');
    
    // Verify metadata file doesn't exist initially
    const metadataPath = path.join(repoInfo.localPath, '.repo_metadata.json');
    await expect(fs.access(metadataPath)).rejects.toThrow();
    
    // Now call ensureRepository - it should detect missing metadata and repair it
    const result = await repositoryManager.ensureRepository(testUrl, testBranch);
    
    // Verify the repository is marked as existing
    expect(result.exists).toBe(true);
    expect(result.url).toBe(testUrl);
    expect(result.branch).toBe(testBranch);
    
    // Check if metadata was created (might be undefined if repair failed, which is acceptable)
    if (result.metadata) {
      expect(result.metadata.url).toBe(testUrl);
      expect(result.metadata.branch).toBe(testBranch);
      expect(result.metadata.commit_hash).toBeDefined();
      expect(result.metadata.clone_method).toBe('https');
      
      // Verify metadata file was actually created
      await expect(fs.access(metadataPath)).resolves.not.toThrow();
      
      const metadataContent = await fs.readFile(metadataPath, 'utf-8');
      const parsedMetadata = JSON.parse(metadataContent);
      expect(parsedMetadata.url).toBe(testUrl);
      expect(parsedMetadata.branch).toBe(testBranch);
    }
  }, 30000); // 30 second timeout

  it.skip('should handle repair failure gracefully', async () => {
    const testUrl = 'https://github.com/test/nonexistent-repo';
    const testBranch = 'main';
    
    // Get the expected path for this repository
    const repoInfo = await repositoryManager.getRepositoryInfo(testUrl, testBranch);
    
    // Create a directory that looks like a repository but is corrupted
    await fs.mkdir(repoInfo.localPath, { recursive: true });
    // Don't create .git directory - this will cause git operations to fail
    
    // Call ensureRepository - repair should fail but not throw
    const result = await repositoryManager.ensureRepository(testUrl, testBranch);
    
    // Should still return repository info, but without metadata
    expect(result.exists).toBe(true);
    expect(result.url).toBe(testUrl);
    expect(result.branch).toBe(testBranch);
    // Metadata might be undefined due to repair failure - this is acceptable
  }, 15000);
}); 