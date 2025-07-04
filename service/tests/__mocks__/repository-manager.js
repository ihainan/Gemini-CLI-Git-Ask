/**
 * Mock implementation of RepositoryManager
 */

class MockRepositoryManager {
  constructor(config) {
    // Mock constructor - accept config but ignore it
  }

  static getInstance() {
    if (!MockRepositoryManager.instance) {
      MockRepositoryManager.instance = new MockRepositoryManager();
    }
    return MockRepositoryManager.instance;
  }

  async ensureRepository(url, branch = 'main') {
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

  async getSingleRepositoryStats(repositoryPath) {
    // Mock single repository statistics
    return {
      fileCount: 25,
      totalSizeMb: 2.5,
      codeFileCount: 15
    };
  }

  async getRepositoryStats() {
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

  async cleanup() {
    // Mock cleanup - do nothing
    return Promise.resolve();
  }

  async destroy() {
    // Mock destroy - do nothing
    return Promise.resolve();
  }
}

// CommonJS exports
module.exports = {
  MockRepositoryManager,
  RepositoryManager: MockRepositoryManager
}; 