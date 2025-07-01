/**
 * Repository Manager Service
 * Handles Git repository cloning, caching, and management
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import * as crypto from 'crypto';
import { simpleGit, SimpleGit, CleanOptions } from 'simple-git';
import * as lockfile from 'proper-lockfile';
import { logger } from '../utils/logger';
import {
  RepositoryMetadata,
  RepositoryInfo,
  CloneOptions,
  UpdateResult,
  RepositoryStats,
  RepositoryError,
  RepositoryException,
  LockOptions,
  RepositoryManagerConfig
} from '../types';

export class RepositoryManager {
  private readonly config: RepositoryManagerConfig;
  private readonly lockDir: string;
  private readonly metadataFileName = '.repo_metadata.json';

  constructor(config: RepositoryManagerConfig) {
    this.config = config;
    this.lockDir = path.join(path.dirname(config.storagePath), 'repository_locks');
    this.ensureDirectories();
  }

  /**
   * Get repository information including path and existence status
   */
  async getRepositoryInfo(url: string, branch?: string): Promise<RepositoryInfo> {
    const normalizedUrl = this.normalizeUrl(url);
    const resolvedBranch = branch || this.config.defaultBranch;
    const localPath = this.generateRepositoryPath(normalizedUrl, resolvedBranch);
    const exists = await this.checkRepositoryExists(localPath);
    
    let metadata: RepositoryMetadata | undefined;
    if (exists) {
      try {
        metadata = await this.getRepositoryMetadata(localPath);
      } catch (error) {
        logger.warn(`Failed to read metadata for ${localPath}:`, error);
      }
    }

    return {
      url: normalizedUrl,
      branch: resolvedBranch,
      localPath,
      exists,
      metadata
    };
  }

  /**
   * Clone a repository to local storage
   */
  async cloneRepository(url: string, branch?: string, options?: CloneOptions): Promise<RepositoryInfo> {
    const repoInfo = await this.getRepositoryInfo(url, branch);
    
    if (repoInfo.exists && !options?.force) {
      logger.info(`Repository already exists: ${repoInfo.localPath}`);
      return repoInfo;
    }

    const lockPath = this.getLockPath(repoInfo.localPath);
    const release = await this.acquireLock(lockPath, { timeout: 60000 });

    try {
      // Remove existing directory if force is true
      if (options?.force && repoInfo.exists) {
        await fs.rm(repoInfo.localPath, { recursive: true, force: true });
      }

      logger.info(`Cloning repository ${url} to ${repoInfo.localPath}`);
      
      const git = simpleGit();
      let actualBranch = repoInfo.branch;
      let cloneOptions: string[];

      try {
        // First try to clone with the specified branch
        cloneOptions = [
          `--depth=${options?.depth || this.config.cloneDepth}`,
          `--branch=${actualBranch}`
        ];
        await git.clone(url, repoInfo.localPath, cloneOptions);
      } catch (branchError) {
        logger.warn(`Branch ${actualBranch} not found, trying to detect default branch`);
        
        // If specific branch fails, try to get the default branch
        try {
          const defaultBranch = await this.getDefaultBranch(url);
          actualBranch = defaultBranch;
          
          // Regenerate path with correct branch
          const newLocalPath = this.generateRepositoryPath(repoInfo.url, actualBranch);
          
          logger.info(`Using default branch: ${actualBranch}, new path: ${newLocalPath}`);
          
          cloneOptions = [
            `--depth=${options?.depth || this.config.cloneDepth}`,
            `--branch=${actualBranch}`
          ];
          await git.clone(url, newLocalPath, cloneOptions);
          
          // Update repoInfo with new path and branch
          repoInfo.localPath = newLocalPath;
          repoInfo.branch = actualBranch;
        } catch (defaultBranchError) {
          logger.warn(`Failed to detect default branch, trying clone without branch specification`);
          
          // Last resort: clone without specifying branch
          cloneOptions = [`--depth=${options?.depth || this.config.cloneDepth}`];
          await git.clone(url, repoInfo.localPath, cloneOptions);
          
                     // Get the actual branch name after clone
           const repoGit = simpleGit(repoInfo.localPath);
           const status = await repoGit.status();
           actualBranch = status.current ? status.current : 'master'; // fallback to master if current is undefined
           repoInfo.branch = actualBranch;
        }
      }
      
      // Get initial commit hash
      const repoGit = simpleGit(repoInfo.localPath);
      const log = await repoGit.log(['-n', '1']);
      const commitHash = log.latest?.hash || 'unknown';

      // Save metadata
      const metadata: RepositoryMetadata = {
        url: repoInfo.url,
        branch: actualBranch,
        last_updated: new Date().toISOString(),
        last_accessed: new Date().toISOString(),
        commit_hash: commitHash,
        clone_method: this.config.cloneMethod
      };

      await this.saveRepositoryMetadata(repoInfo.localPath, metadata);
      
      logger.info(`Successfully cloned repository: ${url} (branch: ${actualBranch})`);
      return { ...repoInfo, exists: true, metadata };

    } catch (error) {
      logger.error(`Failed to clone repository ${url}:`, error);
      throw new RepositoryException(
        RepositoryError.CLONE_FAILED,
        `Failed to clone repository: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { url, branch: repoInfo.branch, error }
      );
    } finally {
      await release();
    }
  }

  /**
   * Update an existing repository
   */
  async updateRepository(localPath: string): Promise<UpdateResult> {
    if (!await this.checkRepositoryExists(localPath)) {
      throw new RepositoryException(
        RepositoryError.NOT_FOUND,
        `Repository not found: ${localPath}`
      );
    }

    const lockPath = this.getLockPath(localPath);
    const release = await this.acquireLock(lockPath, { timeout: 30000 });

    try {
      const metadata = await this.getRepositoryMetadata(localPath);
      const previousHash = metadata.commit_hash;

      // Check if update is needed
      const lastUpdated = new Date(metadata.last_updated);
      const now = new Date();
      const hoursSinceUpdate = (now.getTime() - lastUpdated.getTime()) / (1000 * 60 * 60);

      if (hoursSinceUpdate < this.config.updateThresholdHours) {
        logger.debug(`Repository ${localPath} updated recently, skipping update`);
        return {
          updated: false,
          previousHash,
          currentHash: previousHash,
          changes: 0
        };
      }

      logger.info(`Updating repository: ${localPath}`);
      
      const git = simpleGit(localPath);
      
      // Clean working directory
      await git.clean(CleanOptions.FORCE + CleanOptions.RECURSIVE);
      
      // Fetch and pull
      await git.fetch();
      const pullResult = await git.pull('origin', metadata.branch);
      
      // Get new commit hash
      const log = await git.log(['-n', '1']);
      const currentHash = log.latest?.hash || metadata.commit_hash;
      
      // Update metadata
      const updatedMetadata: RepositoryMetadata = {
        ...metadata,
        last_updated: now.toISOString(),
        last_accessed: now.toISOString(),
        commit_hash: currentHash
      };

      await this.saveRepositoryMetadata(localPath, updatedMetadata);
      
      const updated = currentHash !== previousHash;
      const changes = pullResult?.summary?.changes || 0;
      
      logger.info(`Repository update completed: ${localPath}, updated: ${updated}, changes: ${changes}`);
      
      return {
        updated,
        previousHash,
        currentHash,
        changes
      };

    } catch (error) {
      logger.error(`Failed to update repository ${localPath}:`, error);
      throw new RepositoryException(
        RepositoryError.UPDATE_FAILED,
        `Failed to update repository: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { localPath, error }
      );
    } finally {
      await release();
    }
  }

  /**
   * Ensure a repository is available and up-to-date
   */
  async ensureRepository(url: string, branch?: string): Promise<RepositoryInfo> {
    const repoInfo = await this.getRepositoryInfo(url, branch);
    
    if (!repoInfo.exists) {
      return await this.cloneRepository(url, branch);
    }

    // Auto-repair missing metadata file
    if (!repoInfo.metadata) {
      logger.warn(`Repository exists but metadata is missing: ${repoInfo.localPath}. Attempting to repair...`);
      try {
        const repairedMetadata = await this.repairRepositoryMetadata(repoInfo.localPath, repoInfo.url, repoInfo.branch);
        repoInfo.metadata = repairedMetadata;
        logger.info(`Successfully repaired metadata for repository: ${repoInfo.localPath}`);
      } catch (error) {
        logger.error(`Failed to repair repository metadata: ${error instanceof Error ? error.message : 'Unknown error'}`);
        // Continue without metadata instead of throwing error
        logger.warn(`Continuing without metadata for repository: ${repoInfo.localPath}`);
      }
    }

    // Update access time if metadata is available
    if (repoInfo.metadata) {
      await this.updateAccessTime(repoInfo.localPath);
      
      // Check if update is needed
      const lastUpdated = new Date(repoInfo.metadata.last_updated);
      const hoursSinceUpdate = (Date.now() - lastUpdated.getTime()) / (1000 * 60 * 60);
      
      if (hoursSinceUpdate >= this.config.updateThresholdHours) {
        try {
          await this.updateRepository(repoInfo.localPath);
          // Refresh repository info after update
          return await this.getRepositoryInfo(url, branch);
        } catch (error) {
          logger.warn(`Failed to update repository, using cached version: ${error}`);
        }
      }
    }

    return repoInfo;
  }

  /**
   * Get repository statistics
   */
  async getRepositoryStats(): Promise<RepositoryStats> {
    try {
      const repositories = await fs.readdir(this.config.storagePath, { withFileTypes: true });
      const repoDirs = repositories.filter(dirent => dirent.isDirectory());
      
      let totalSize = 0;
      let oldestAccess = new Date();
      let newestAccess = new Date(0);
      
      for (const dir of repoDirs) {
        const repoPath = path.join(this.config.storagePath, dir.name);
        
        try {
          const stats = await fs.stat(repoPath);
          totalSize += await this.getDirectorySize(repoPath);
          
          const metadata = await this.getRepositoryMetadata(repoPath);
          const accessTime = new Date(metadata.last_accessed);
          
          if (accessTime < oldestAccess) oldestAccess = accessTime;
          if (accessTime > newestAccess) newestAccess = accessTime;
        } catch (error) {
          logger.warn(`Failed to get stats for ${repoPath}:`, error);
        }
      }

      return {
        totalRepositories: repoDirs.length,
        diskUsage: totalSize,
        oldestAccess: repoDirs.length > 0 ? oldestAccess.toISOString() : new Date().toISOString(),
        newestAccess: repoDirs.length > 0 ? newestAccess.toISOString() : new Date().toISOString()
      };
    } catch (error) {
      logger.error('Failed to get repository stats:', error);
      throw new RepositoryException(
        RepositoryError.STORAGE_ERROR,
        'Failed to get repository statistics',
        { error }
      );
    }
  }

  /**
   * Get statistics for a single repository
   */
  async getSingleRepositoryStats(localPath: string): Promise<import('../types').SingleRepositoryStats> {
    if (!await this.checkRepositoryExists(localPath)) {
      throw new RepositoryException(
        RepositoryError.NOT_FOUND,
        `Repository not found: ${localPath}`
      );
    }

    try {
      let fileCount = 0;
      let codeFileCount = 0;
      let totalSizeBytes = 0;
      let largestFileSizeBytes = 0;

      const codeExtensions = new Set([
        '.js', '.ts', '.tsx', '.jsx', '.py', '.java', '.cpp', '.c', '.h', '.hpp',
        '.cs', '.php', '.rb', '.go', '.rs', '.swift', '.kt', '.scala', '.clj',
        '.hs', '.elm', '.dart', '.vue', '.svelte', '.md', '.json', '.yaml', '.yml',
        '.xml', '.html', '.css', '.scss', '.sass', '.less', '.sql', '.sh', '.bash',
        '.zsh', '.fish', '.ps1', '.bat', '.cmd', '.r', '.m', '.mm', '.pl', '.pm'
      ]);

      const walkDir = async (dir: string): Promise<void> => {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          
          // Skip .git directory and other hidden directories
          if (entry.isDirectory() && !entry.name.startsWith('.')) {
            await walkDir(fullPath);
          } else if (entry.isFile()) {
            const stats = await fs.stat(fullPath);
            const fileSizeBytes = stats.size;
            
            fileCount++;
            totalSizeBytes += fileSizeBytes;
            largestFileSizeBytes = Math.max(largestFileSizeBytes, fileSizeBytes);
            
            // Check if it's a code file
            const ext = path.extname(entry.name).toLowerCase();
            if (codeExtensions.has(ext)) {
              codeFileCount++;
            }
          }
        }
      };

      await walkDir(localPath);
      
      return {
        fileCount,
        totalSizeMb: Math.round((totalSizeBytes / (1024 * 1024)) * 100) / 100,
        codeFileCount,
        largestFileSizeMb: Math.round((largestFileSizeBytes / (1024 * 1024)) * 100) / 100
      };
    } catch (error) {
      logger.error(`Failed to get repository stats for ${localPath}:`, error);
      throw new RepositoryException(
        RepositoryError.STORAGE_ERROR,
        'Failed to get repository statistics',
        { localPath, error }
      );
    }
  }

  /**
   * Clean up old repositories
   */
  async cleanupRepositories(retentionDays: number, maxStorageBytes?: number): Promise<void> {
    logger.info(`Starting repository cleanup, retention: ${retentionDays} days`);
    
    try {
      const repositories = await fs.readdir(this.config.storagePath, { withFileTypes: true });
      const repoDirs = repositories.filter(dirent => dirent.isDirectory());
      
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
      
      const repoStats = [];
      
      // Collect repository statistics
      for (const dir of repoDirs) {
        const repoPath = path.join(this.config.storagePath, dir.name);
        
        try {
          const metadata = await this.getRepositoryMetadata(repoPath);
          const lastAccessed = new Date(metadata.last_accessed);
          const size = await this.getDirectorySize(repoPath);
          
          repoStats.push({
            path: repoPath,
            lastAccessed,
            size,
            shouldDelete: lastAccessed < cutoffDate
          });
        } catch (error) {
          logger.warn(`Failed to get metadata for ${repoPath}, marking for deletion:`, error);
          repoStats.push({
            path: repoPath,
            lastAccessed: new Date(0),
            size: 0,
            shouldDelete: true
          });
        }
      }
      
      // Sort by last accessed (oldest first)
      repoStats.sort((a, b) => a.lastAccessed.getTime() - b.lastAccessed.getTime());
      
      let deletedCount = 0;
      let totalSize = repoStats.reduce((sum, repo) => sum + repo.size, 0);
      
      for (const repo of repoStats) {
        let shouldDelete = repo.shouldDelete;
        
        // Also delete if storage limit is exceeded
        if (maxStorageBytes && totalSize > maxStorageBytes) {
          shouldDelete = true;
        }
        
        if (shouldDelete) {
          try {
            await fs.rm(repo.path, { recursive: true, force: true });
            totalSize -= repo.size;
            deletedCount++;
            logger.info(`Deleted repository: ${repo.path}`);
          } catch (error) {
            logger.error(`Failed to delete repository ${repo.path}:`, error);
          }
        }
        
        // Stop if we're under the storage limit
        if (maxStorageBytes && totalSize <= maxStorageBytes) {
          break;
        }
      }
      
      logger.info(`Repository cleanup completed: ${deletedCount} repositories deleted`);
      
    } catch (error) {
      logger.error('Repository cleanup failed:', error);
      throw new RepositoryException(
        RepositoryError.STORAGE_ERROR,
        'Repository cleanup failed',
        { error }
      );
    }
  }

  // Private helper methods

  private async ensureDirectories(): Promise<void> {
    try {
      await fs.mkdir(this.config.storagePath, { recursive: true });
      await fs.mkdir(this.lockDir, { recursive: true });
    } catch (error) {
      logger.error('Failed to create directories:', error);
      throw new RepositoryException(
        RepositoryError.STORAGE_ERROR,
        'Failed to create storage directories',
        { error }
      );
    }
  }

  private normalizeUrl(url: string): string {
    if (!url || typeof url !== 'string') {
      throw new RepositoryException(
        RepositoryError.INVALID_URL,
        'Invalid repository URL'
      );
    }

    // Remove trailing slash and .git suffix
    let normalized = url.replace(/\/+$/, '').replace(/\.git$/, '');
    
    // Validate URL format
    const urlPattern = /^https?:\/\/[^\s/$.?#].[^\s]*$|^git@[^\s:]+:[^\s]+$/;
    if (!urlPattern.test(normalized + '.git')) {
      throw new RepositoryException(
        RepositoryError.INVALID_URL,
        `Invalid repository URL format: ${url}`
      );
    }
    
    return normalized;
  }

  private generateRepositoryPath(url: string, branch: string): string {
    // Extract owner and repo name from URL
    const match = url.match(/[\/:]([^\/]+)\/([^\/]+?)(?:\.git)?$/);
    if (!match) {
      throw new RepositoryException(
        RepositoryError.INVALID_URL,
        `Cannot parse repository URL: ${url}`
      );
    }
    
    const [, owner, repo] = match;
    const branchHash = crypto.createHash('sha1').update(branch).digest('hex').substring(0, 8);
    const dirName = `${owner}_${repo}_${branch}_${branchHash}`;
    
    return path.join(this.config.storagePath, dirName);
  }

  private async checkRepositoryExists(localPath: string): Promise<boolean> {
    try {
      await fs.access(localPath);
      await fs.access(path.join(localPath, '.git'));
      return true;
    } catch {
      return false;
    }
  }

  private async getRepositoryMetadata(localPath: string): Promise<RepositoryMetadata> {
    try {
      const metadataPath = path.join(localPath, this.metadataFileName);
      const content = await fs.readFile(metadataPath, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      throw new RepositoryException(
        RepositoryError.METADATA_ERROR,
        `Failed to read repository metadata: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { localPath, error }
      );
    }
  }

  private async saveRepositoryMetadata(localPath: string, metadata: RepositoryMetadata): Promise<void> {
    try {
      const metadataPath = path.join(localPath, this.metadataFileName);
      await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2), 'utf-8');
    } catch (error) {
      throw new RepositoryException(
        RepositoryError.METADATA_ERROR,
        `Failed to save repository metadata: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { localPath, error }
      );
    }
  }

  private async updateAccessTime(localPath: string): Promise<void> {
    try {
      const metadata = await this.getRepositoryMetadata(localPath);
      metadata.last_accessed = new Date().toISOString();
      await this.saveRepositoryMetadata(localPath, metadata);
    } catch (error) {
      logger.warn(`Failed to update access time for ${localPath}:`, error);
    }
  }

  /**
   * Repair missing repository metadata file
   * Extract information from Git repository and regenerate metadata
   */
  private async repairRepositoryMetadata(localPath: string, originalUrl: string, expectedBranch: string): Promise<RepositoryMetadata> {
    try {
      const git = simpleGit(localPath);
      
      // Get current branch
      let actualBranch: string;
      try {
        const status = await git.status();
        actualBranch = status.current || expectedBranch;
      } catch (error) {
        logger.warn(`Failed to get current branch, using expected branch: ${expectedBranch}`);
        actualBranch = expectedBranch;
      }
      
      // Get current commit hash
      let commitHash: string;
      try {
        const log = await git.log(['-n', '1']);
        commitHash = log.latest?.hash || 'unknown';
      } catch (error) {
        logger.warn(`Failed to get commit hash: ${error}`);
        commitHash = 'unknown';
      }
      
      // Try to get remote URL
      let remoteUrl: string;
      try {
        const remotes = await git.getRemotes(true);
        const origin = remotes.find(remote => remote.name === 'origin');
        remoteUrl = origin?.refs?.fetch || originalUrl;
      } catch (error) {
        logger.warn(`Failed to get remote URL, using original: ${originalUrl}`);
        remoteUrl = originalUrl;
      }
      
      // Create new metadata
      const now = new Date().toISOString();
      const metadata: RepositoryMetadata = {
        url: remoteUrl,
        branch: actualBranch,
        last_updated: now,
        last_accessed: now,
        commit_hash: commitHash,
        clone_method: this.config.cloneMethod
      };
      
      // Save metadata file
      await this.saveRepositoryMetadata(localPath, metadata);
      
      logger.info(`Repaired metadata for repository: ${localPath} (url: ${remoteUrl}, branch: ${actualBranch}, commit: ${commitHash})`);
      return metadata;
      
    } catch (error) {
      throw new RepositoryException(
        RepositoryError.METADATA_ERROR,
        `Failed to repair repository metadata: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { localPath, originalUrl, expectedBranch, error }
      );
    }
  }

  private getLockPath(repositoryPath: string): string {
    const repoName = path.basename(repositoryPath);
    return path.join(this.lockDir, `${repoName}.lock`);
  }

  private async acquireLock(lockPath: string, options?: LockOptions): Promise<() => Promise<void>> {
    try {
      // Ensure the lock directory exists
      await fs.mkdir(this.lockDir, { recursive: true });
      
      const lockOptions = {
        retries: options?.retries || 5,
        retryWait: options?.retryInterval || 500,
        stale: options?.timeout || 60000, // Default 60 seconds stale time
        realpath: false // Don't resolve symlinks
      };
      
      return await lockfile.lock(lockPath, lockOptions);
    } catch (error) {
      logger.error(`Lock acquisition failed for ${lockPath}:`, error);
      throw new RepositoryException(
        RepositoryError.LOCK_FAILED,
        `Failed to acquire lock: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { lockPath, error }
      );
    }
  }

  private async getDirectorySize(dir: string): Promise<number> {
    let size = 0;
    
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const entryPath = path.join(dir, entry.name);
        
        if (entry.isDirectory()) {
          size += await this.getDirectorySize(entryPath);
        } else {
          const stats = await fs.stat(entryPath);
          size += stats.size;
        }
      }
    } catch (error) {
      logger.warn(`Failed to calculate directory size for ${dir}:`, error);
    }
    
    return size;
  }

  /**
   * Get the default branch of a remote repository
   */
  private async getDefaultBranch(url: string): Promise<string> {
    try {
      const git = simpleGit();
      
      // Use ls-remote to get the default branch
      const result = await git.listRemote(['--symref', url, 'HEAD']);
      
      // Parse the result to extract the default branch
      // Format: "ref: refs/heads/main	HEAD"
      const lines = result.split('\n');
      for (const line of lines) {
        if (line.includes('ref: refs/heads/')) {
          const match = line.match(/ref: refs\/heads\/([^\s]+)/);
          if (match && match[1]) {
            logger.info(`Detected default branch: ${match[1]} for ${url}`);
            return match[1];
          }
        }
      }
      
      // Fallback: try common default branch names
      const commonBranches = ['main', 'master', 'develop', 'dev'];
      logger.warn(`Could not detect default branch for ${url}, trying common names`);
      
      for (const branch of commonBranches) {
        try {
          await git.listRemote([url, `refs/heads/${branch}`]);
          logger.info(`Found existing branch: ${branch} for ${url}`);
          return branch;
        } catch {
          // Branch doesn't exist, continue
        }
      }
      
      throw new Error('No suitable branch found');
      
    } catch (error) {
      logger.error(`Failed to detect default branch for ${url}:`, error);
      throw new RepositoryException(
        RepositoryError.CLONE_FAILED,
        `Failed to detect default branch: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { url, error }
      );
    }
  }
} 