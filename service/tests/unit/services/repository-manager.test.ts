/**
 * Unit tests for RepositoryManager service
 */

/// <reference types="jest" />

import { RepositoryManager } from '../../../src/services/repository-manager';
import { RepositoryManagerConfig, RepositoryError, RepositoryException } from '../../../src/types';
import { MockDataFactory, TestEnvironmentUtils, TestAssertions } from '../../helpers/test-utils';
import * as path from 'path';

// Mock simple-git
jest.mock('simple-git', () => ({
  simpleGit: jest.fn(),
  CleanOptions: {
    FORCE: 'f',
    RECURSIVE: 'd'
  }
}));

// Mock fs/promises
jest.mock('fs/promises', () => ({
  mkdir: jest.fn(),
  access: jest.fn(),
  writeFile: jest.fn(),
  readFile: jest.fn(),
  rm: jest.fn(),
  stat: jest.fn(),
  readdir: jest.fn()
}));

// Mock proper-lockfile
jest.mock('proper-lockfile', () => ({
  lock: jest.fn(),
  unlock: jest.fn(),
  check: jest.fn()
}));

describe('RepositoryManager', () => {
  let repositoryManager: RepositoryManager;
  let mockConfig: RepositoryManagerConfig;
  const mockFs = require('fs/promises');
  const mockLockfile = require('proper-lockfile');
  const { simpleGit: mockSimpleGit } = require('simple-git');

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockConfig = {
      storagePath: './test-repositories',
      cloneMethod: 'https',
      cloneDepth: 1,
      updateThresholdHours: 24,
      accessTimeoutHours: 72,
      maxConcurrentOperations: 10,
      defaultBranch: 'main'
    };

    repositoryManager = new RepositoryManager(mockConfig);
  });

  describe('constructor', () => {
    it('should create RepositoryManager instance', () => {
      expect(repositoryManager).toBeInstanceOf(RepositoryManager);
    });

    it('should initialize with configuration', () => {
      expect(repositoryManager).toBeDefined();
      expect(mockFs.mkdir).toHaveBeenCalledWith('./test-repositories', { recursive: true });
    });
  });

  describe('getRepositoryInfo', () => {
    it('should return repository info for new repository', async () => {
      mockFs.access.mockRejectedValue(new Error('ENOENT'));

      const result = await repositoryManager.getRepositoryInfo('https://github.com/test/repo');

      expect(result).toEqual({
        url: 'https://github.com/test/repo',
        branch: 'main',
        localPath: expect.stringContaining('test_repo_main_'),
        exists: false,
        metadata: undefined
      });
    });

    it('should return repository info for existing repository', async () => {
      const mockMetadata = {
        url: 'https://github.com/test/repo',
        branch: 'main',
        last_updated: new Date().toISOString(),
        last_accessed: new Date().toISOString(),
        commit_hash: 'abc123',
        clone_method: 'https' as const
      };

      mockFs.access.mockResolvedValue(undefined);
      mockFs.readFile.mockResolvedValue(JSON.stringify(mockMetadata));

      const result = await repositoryManager.getRepositoryInfo('https://github.com/test/repo');

      expect(result).toEqual({
        url: 'https://github.com/test/repo',
        branch: 'main',
        localPath: expect.stringContaining('test_repo_main_'),
        exists: true,
        metadata: mockMetadata
      });
    });

    it('should handle invalid URL', async () => {
      await expect(repositoryManager.getRepositoryInfo('invalid-url'))
        .rejects.toThrow(RepositoryException);
    });
  });

  describe('cloneRepository', () => {
    it('should clone repository successfully', async () => {
      const mockGitInstance = {
        clone: jest.fn().mockResolvedValue(undefined),
        log: jest.fn().mockResolvedValue({
          latest: { hash: 'abc123def456' }
        })
      };
      const mockRepoGit = jest.fn().mockReturnValue(mockGitInstance);
      
      mockSimpleGit.mockReturnValue({
        clone: mockGitInstance.clone
      });
             mockSimpleGit.mockImplementation((path?: string) => {
         if (path) return mockGitInstance;
         return { clone: mockGitInstance.clone };
       });

      mockFs.access.mockRejectedValue(new Error('ENOENT'));
      mockFs.writeFile.mockResolvedValue(undefined);
      mockLockfile.lock.mockResolvedValue(jest.fn().mockResolvedValue(undefined));

      const result = await repositoryManager.cloneRepository('https://github.com/test/repo');

      expect(result.exists).toBe(true);
      expect(result.metadata).toBeDefined();
      expect(result.metadata?.commit_hash).toBe('abc123def456');
      expect(mockGitInstance.clone).toHaveBeenCalled();
      expect(mockFs.writeFile).toHaveBeenCalled();
    });

    it('should handle existing repository when force is false', async () => {
      mockFs.access.mockResolvedValue(undefined);
      mockFs.readFile.mockResolvedValue(JSON.stringify({
        url: 'https://github.com/test/repo',
        branch: 'main',
        last_updated: new Date().toISOString(),
        last_accessed: new Date().toISOString(),
        commit_hash: 'abc123',
        clone_method: 'https'
      }));

      const result = await repositoryManager.cloneRepository('https://github.com/test/repo');

      expect(result.exists).toBe(true);
      expect(mockSimpleGit).not.toHaveBeenCalled();
    });

    it('should handle clone failures', async () => {
      const mockGitInstance = {
        clone: jest.fn().mockRejectedValue(new Error('Clone failed'))
      };
      mockSimpleGit.mockReturnValue(mockGitInstance);
      mockFs.access.mockRejectedValue(new Error('ENOENT'));
      mockLockfile.lock.mockResolvedValue(jest.fn().mockResolvedValue(undefined));

      await expect(repositoryManager.cloneRepository('https://github.com/test/repo'))
        .rejects.toThrow(RepositoryException);
    });
  });

  describe('updateRepository', () => {
    const mockLocalPath = '/test/path/test_repo_main_abc123';

    it('should update repository when stale', async () => {
      const oldDate = new Date();
      oldDate.setHours(oldDate.getHours() - 25); // 25 hours ago

      const mockMetadata = {
        url: 'https://github.com/test/repo',
        branch: 'main',
        last_updated: oldDate.toISOString(),
        last_accessed: new Date().toISOString(),
        commit_hash: 'oldcommit123',
        clone_method: 'https' as const
      };

      const mockGitInstance = {
        clean: jest.fn().mockResolvedValue(undefined),
        fetch: jest.fn().mockResolvedValue(undefined),
        pull: jest.fn().mockResolvedValue({ summary: { changes: 5 } }),
        log: jest.fn().mockResolvedValue({
          latest: { hash: 'newcommit456' }
        })
      };

      mockFs.access.mockResolvedValue(undefined);
      mockFs.readFile.mockResolvedValue(JSON.stringify(mockMetadata));
      mockFs.writeFile.mockResolvedValue(undefined);
      mockSimpleGit.mockReturnValue(mockGitInstance);
      mockLockfile.lock.mockResolvedValue(jest.fn().mockResolvedValue(undefined));

      const result = await repositoryManager.updateRepository(mockLocalPath);

      expect(result.updated).toBe(true);
      expect(result.previousHash).toBe('oldcommit123');
      expect(result.currentHash).toBe('newcommit456');
      expect(result.changes).toBe(5);
      expect(mockGitInstance.fetch).toHaveBeenCalled();
      expect(mockGitInstance.pull).toHaveBeenCalled();
    });

    it('should skip update when fresh', async () => {
      const recentDate = new Date();
      recentDate.setHours(recentDate.getHours() - 1); // 1 hour ago

      const mockMetadata = {
        url: 'https://github.com/test/repo',
        branch: 'main',
        last_updated: recentDate.toISOString(),
        last_accessed: new Date().toISOString(),
        commit_hash: 'abc123',
        clone_method: 'https' as const
      };

      mockFs.access.mockResolvedValue(undefined);
      mockFs.readFile.mockResolvedValue(JSON.stringify(mockMetadata));
      mockLockfile.lock.mockResolvedValue(jest.fn().mockResolvedValue(undefined));

      const result = await repositoryManager.updateRepository(mockLocalPath);

      expect(result.updated).toBe(false);
      expect(result.previousHash).toBe('abc123');
      expect(result.currentHash).toBe('abc123');
      expect(result.changes).toBe(0);
    });

    it('should handle repository not found', async () => {
      mockFs.access.mockRejectedValue(new Error('ENOENT'));

      await expect(repositoryManager.updateRepository(mockLocalPath))
        .rejects.toThrow(RepositoryException);
    });
  });

  describe('ensureRepository', () => {
    it('should clone repository if it does not exist', async () => {
      const mockGitInstance = {
        clone: jest.fn().mockResolvedValue(undefined),
        log: jest.fn().mockResolvedValue({
          latest: { hash: 'abc123def456' }
        })
      };
      
      mockSimpleGit.mockReturnValue({
        clone: mockGitInstance.clone
      });
             mockSimpleGit.mockImplementation((path?: string) => {
         if (path) return mockGitInstance;
         return { clone: mockGitInstance.clone };
       });

      mockFs.access.mockRejectedValue(new Error('ENOENT'));
      mockFs.writeFile.mockResolvedValue(undefined);
      mockLockfile.lock.mockResolvedValue(jest.fn().mockResolvedValue(undefined));

      const result = await repositoryManager.ensureRepository('https://github.com/test/repo');

      expect(result.exists).toBe(true);
      expect(mockGitInstance.clone).toHaveBeenCalled();
    });

    it('should update access time for existing repository', async () => {
      const mockMetadata = {
        url: 'https://github.com/test/repo',
        branch: 'main',
        last_updated: new Date().toISOString(),
        last_accessed: new Date().toISOString(),
        commit_hash: 'abc123',
        clone_method: 'https' as const
      };

      mockFs.access.mockResolvedValue(undefined);
      mockFs.readFile.mockResolvedValue(JSON.stringify(mockMetadata));
      mockFs.writeFile.mockResolvedValue(undefined);

      const result = await repositoryManager.ensureRepository('https://github.com/test/repo');

      expect(result.exists).toBe(true);
      expect(mockFs.writeFile).toHaveBeenCalled(); // For updating access time
    });

    it('should continue gracefully when metadata is missing', async () => {
      // Mock repository exists but metadata file is missing
      mockFs.access.mockResolvedValue(undefined);
      mockFs.readFile.mockRejectedValue(new Error('ENOENT: no such file'));

      const result = await repositoryManager.ensureRepository('https://github.com/test/repo');

      expect(result.exists).toBe(true);
      // Should return repository info even without metadata
      expect(result.url).toBe('https://github.com/test/repo');
      expect(result.branch).toBe('main');
      expect(result.localPath).toContain('test_repo_main_');
    });
  });

  describe('getRepositoryStats', () => {
    it('should return repository statistics', async () => {
      const mockDirents = [
        { name: 'repo1', isDirectory: () => true },
        { name: 'repo2', isDirectory: () => true },
        { name: 'file.txt', isDirectory: () => false }
      ];

      const mockMetadata1 = {
        url: 'https://github.com/test/repo1',
        branch: 'main',
        last_updated: '2024-01-01T00:00:00Z',
        last_accessed: '2024-01-01T00:00:00Z',
        commit_hash: 'abc123',
        clone_method: 'https' as const
      };

      const mockMetadata2 = {
        url: 'https://github.com/test/repo2',
        branch: 'main',
        last_updated: '2024-01-02T00:00:00Z',
        last_accessed: '2024-01-02T00:00:00Z',
        commit_hash: 'def456',
        clone_method: 'https' as const
      };

      mockFs.readdir.mockResolvedValue(mockDirents);
      mockFs.stat.mockResolvedValue({ size: 1024 });
      mockFs.readFile
        .mockResolvedValueOnce(JSON.stringify(mockMetadata1))
        .mockResolvedValueOnce(JSON.stringify(mockMetadata2));

      // Mock readdir for calculating directory size  
      mockFs.readdir.mockImplementation((dir: string, options?: any) => {
        if (typeof dir === 'string' && (dir.includes('repo1') || dir.includes('repo2'))) {
          return Promise.resolve([]);
        }
        return Promise.resolve(mockDirents);
      });

      const result = await repositoryManager.getRepositoryStats();

      expect(result.totalRepositories).toBe(2);
      expect(result.diskUsage).toBeGreaterThanOrEqual(0);
      expect(result.oldestAccess).toBe('2024-01-01T00:00:00.000Z');
      expect(result.newestAccess).toBe('2024-01-02T00:00:00.000Z');
    });
  });

  describe('getSingleRepositoryStats', () => {
    it('should get repository statistics successfully', async () => {      
      // Mock directory structure
      const mockDirents = [
        { name: 'file1.ts', isDirectory: () => false, isFile: () => true },
        { name: 'file2.js', isDirectory: () => false, isFile: () => true },
        { name: 'README.md', isDirectory: () => false, isFile: () => true },
        { name: 'package.json', isDirectory: () => false, isFile: () => true },
        { name: 'src', isDirectory: () => true, isFile: () => false },
        { name: 'node_modules', isDirectory: () => true, isFile: () => false }
      ];
      
      const mockSrcDirents = [
        { name: 'index.ts', isDirectory: () => false, isFile: () => true },
        { name: 'utils.js', isDirectory: () => false, isFile: () => true }
      ];
      
      // Mock repository existence check
      mockFs.access.mockResolvedValue(undefined);
      
      // Mock readdir calls
      mockFs.readdir.mockImplementation((path: string, options?: any) => {
        if (path.includes('/src')) {
          return Promise.resolve(mockSrcDirents);
        }
        return Promise.resolve(mockDirents);
      });
      
      // Mock file stats (1KB per file)
      mockFs.stat.mockResolvedValue({ size: 1024, isDirectory: () => false, isFile: () => true });
      
      const repoPath = '/tmp/test_repo_main_abc123';
      const stats = await repositoryManager.getSingleRepositoryStats(repoPath);
      
      // Use test assertion helper
      TestAssertions.assertValidSingleRepositoryStats(stats);
      expect(stats.fileCount).toBeGreaterThan(0);
      expect(stats.codeFileCount).toBeGreaterThan(0);
      expect(stats.totalSizeMb).toBeGreaterThan(0);
    });

    it('should throw error for non-existent repository', async () => {
      const nonExistentPath = '/nonexistent/path';
      mockFs.access.mockRejectedValue(new Error('ENOENT'));
      
      await expect(repositoryManager.getSingleRepositoryStats(nonExistentPath))
        .rejects.toThrow('Repository not found');
    });

    it('should handle empty repository', async () => {
      const emptyPath = '/tmp/empty_repo';
      mockFs.access.mockResolvedValue(undefined);
      mockFs.readdir.mockResolvedValue([]);
      
      const stats = await repositoryManager.getSingleRepositoryStats(emptyPath);
      
      expect(stats.fileCount).toBe(0);
      expect(stats.codeFileCount).toBe(0);
      expect(stats.totalSizeMb).toBe(0);
      expect(stats.largestFileSizeMb).toBe(0);
    });
  });

  describe('cleanupRepositories', () => {
    it('should clean up old repositories', async () => {
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 10);

      const mockDirents = [
        { name: 'old_repo', isDirectory: () => true },
        { name: 'new_repo', isDirectory: () => true }
      ];

      const oldMetadata = {
        url: 'https://github.com/test/old-repo',
        branch: 'main',
        last_updated: oldDate.toISOString(),
        last_accessed: oldDate.toISOString(),
        commit_hash: 'abc123',
        clone_method: 'https' as const
      };

      const newMetadata = {
        url: 'https://github.com/test/new-repo',
        branch: 'main',
        last_updated: new Date().toISOString(),
        last_accessed: new Date().toISOString(),
        commit_hash: 'def456',
        clone_method: 'https' as const
      };

      mockFs.readdir.mockImplementation((dir: string, options?: any) => {
        if (typeof dir === 'string' && (dir.includes('old_repo') || dir.includes('new_repo'))) {
          return Promise.resolve([]);
        }
        return Promise.resolve(mockDirents);
      });
      
      mockFs.readFile
        .mockResolvedValueOnce(JSON.stringify(oldMetadata))
        .mockResolvedValueOnce(JSON.stringify(newMetadata));
      mockFs.rm.mockResolvedValue(undefined);

      await repositoryManager.cleanupRepositories(7); // 7 days retention

      expect(mockFs.rm).toHaveBeenCalledWith(
        expect.stringContaining('old_repo'),
        { recursive: true, force: true }
      );
    });
  });

  describe('error handling', () => {
    it('should handle invalid repository URLs', async () => {
      await expect(repositoryManager.getRepositoryInfo(''))
        .rejects.toThrow(RepositoryException);

      await expect(repositoryManager.getRepositoryInfo('invalid-url'))
        .rejects.toThrow(RepositoryException);
    });

    it('should handle metadata errors', async () => {
      mockFs.access.mockResolvedValue(undefined);
      mockFs.readFile.mockRejectedValue(new Error('Permission denied'));

      const result = await repositoryManager.getRepositoryInfo('https://github.com/test/repo');

      expect(result.metadata).toBeUndefined();
    });

    it('should handle lock failures', async () => {
      mockLockfile.lock.mockRejectedValue(new Error('Lock timeout'));
      mockFs.access.mockRejectedValue(new Error('ENOENT'));

      await expect(repositoryManager.cloneRepository('https://github.com/test/repo'))
        .rejects.toThrow(RepositoryException);
    });
  });
}); 