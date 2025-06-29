/**
 * Mock implementation of simple-git
 */

export interface MockGitResponse {
  current?: string;
  latest?: {
    hash: string;
    message: string;
    author_name: string;
    author_email: string;
  };
}

export class MockSimpleGit {
  private repoPath: string;
  private mockData: MockGitResponse = {
    current: 'main',
    latest: {
      hash: 'abc123def456789',
      message: 'Initial commit',
      author_name: 'Test Author',
      author_email: 'test@example.com'
    }
  };

  constructor(repoPath: string = '.') {
    this.repoPath = repoPath;
  }

  // Mock clone method
  async clone(url: string, path: string, options?: any): Promise<void> {
    console.log(`Mock: Cloning ${url} to ${path}`);
    return Promise.resolve();
  }

  // Mock pull method
  async pull(remote?: string, branch?: string): Promise<any> {
    console.log(`Mock: Pulling ${remote}/${branch}`);
    return Promise.resolve({
      summary: {
        changes: 0,
        insertions: 0,
        deletions: 0
      }
    });
  }

  // Mock fetch method
  async fetch(): Promise<any> {
    console.log('Mock: Fetching');
    return Promise.resolve();
  }

  // Mock branch method
  async branch(): Promise<any> {
    return Promise.resolve({
      current: this.mockData.current,
      all: ['main', 'develop']
    });
  }

  // Mock log method
  async log(): Promise<any> {
    return Promise.resolve({
      latest: this.mockData.latest,
      total: 1,
      all: [this.mockData.latest]
    });
  }

  // Mock status method
  async status(): Promise<any> {
    return Promise.resolve({
      current: this.mockData.current,
      tracking: null,
      ahead: 0,
      behind: 0,
      staged: [],
      not_added: [],
      conflicted: [],
      created: [],
      deleted: [],
      modified: [],
      renamed: [],
      files: []
    });
  }

  // Mock checkout method
  async checkout(branch: string): Promise<void> {
    console.log(`Mock: Checking out ${branch}`);
    this.mockData.current = branch;
    return Promise.resolve();
  }

  // Set mock data for testing
  setMockData(data: Partial<MockGitResponse>): void {
    this.mockData = { ...this.mockData, ...data };
  }
}

// Mock factory function
const mockSimpleGit = jest.fn().mockImplementation((repoPath?: string) => {
  return new MockSimpleGit(repoPath);
});

export default mockSimpleGit;
export { mockSimpleGit as simpleGit }; 