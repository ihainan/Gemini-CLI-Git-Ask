/**
 * Mock implementation of RepositoryManager
 */

export class MockRepositoryManager {
  private static instance: MockRepositoryManager;

  constructor(config?: any) {
    // Mock constructor - accept config but ignore it
  }

  public static getInstance(): MockRepositoryManager {
    if (!MockRepositoryManager.instance) {
      MockRepositoryManager.instance = new MockRepositoryManager();
    }
    return MockRepositoryManager.instance;
  }

  public async ensureRepository(url: string, branch: string = 'main'): Promise<any> {
    // Mock successful repository info
    return {
      url,
      branch,
      localPath: `/tmp/test_repo_${branch}_abc123`,
      exists: true,
      metadata: {
        url,
        branch,
        last_updated: new Date().toISOString(),
        last_accessed: new Date().toISOString(),
        commit_hash: 'abc123def456789',
        clone_method: 'https'
      }
    };
  }

  public async getSingleRepositoryStats(repositoryPath: string): Promise<any> {
    // Mock single repository statistics
    return {
      fileCount: 25,
      totalSizeMb: 2.5,
      codeFileCount: 15
    };
  }

  public async getRepositoryStats(): Promise<any> {
    // Mock repository statistics
    return {
      total_repositories: 5,
      total_size_mb: 125.5,
      repositories: [
        {
          url: 'https://github.com/test/repo1',
          branch: 'main',
          size_mb: 25.1,
          last_accessed: new Date().toISOString()
        },
        {
          url: 'https://github.com/test/repo2',
          branch: 'develop',
          size_mb: 30.2,
          last_accessed: new Date().toISOString()
        }
      ]
    };
  }

  public async cleanup(): Promise<void> {
    // Mock cleanup - do nothing
    return Promise.resolve();
  }

  public async destroy(): Promise<void> {
    // Mock destroy - do nothing
    return Promise.resolve();
  }
}

// Mock the RepositoryManager class
export const RepositoryManager = MockRepositoryManager; 