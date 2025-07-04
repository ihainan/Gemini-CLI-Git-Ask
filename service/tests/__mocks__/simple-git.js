// service/tests/__mocks__/simple-git.js

const mockGitInstance = {
  clone: jest.fn().mockResolvedValue(undefined),
  fetch: jest.fn().mockResolvedValue(undefined),
  pull: jest.fn().mockResolvedValue({ summary: { changes: 1 } }),
  log: jest.fn().mockResolvedValue({ latest: { hash: 'abc123' } }),
  clean: jest.fn().mockResolvedValue(undefined),
  status: jest.fn().mockResolvedValue({ current: 'main' }),
  listRemote: jest.fn().mockResolvedValue('refs/heads/main\nrefs/heads/develop\n'),
  checkout: jest.fn().mockResolvedValue(undefined),
  reset: jest.fn().mockResolvedValue(undefined),
  add: jest.fn().mockResolvedValue(undefined),
  commit: jest.fn().mockResolvedValue(undefined),
  push: jest.fn().mockResolvedValue(undefined),
  branch: jest.fn().mockResolvedValue({ current: 'main' }),
  tag: jest.fn().mockResolvedValue(undefined),
  diff: jest.fn().mockResolvedValue(''),
  show: jest.fn().mockResolvedValue(''),
  raw: jest.fn().mockResolvedValue(''),
  revparse: jest.fn().mockResolvedValue('abc123'),
  config: jest.fn().mockResolvedValue(undefined)
};

const simpleGit = jest.fn(function() {
  return mockGitInstance;
});

const CleanOptions = {
  FORCE: 'f',
  RECURSIVE: 'd',
  IGNORED_ONLY: 'X',
  IGNORED_INCLUDED: 'x',
  QUIET: 'q',
  DRY_RUN: 'n'
};

module.exports = simpleGit;
module.exports.default = simpleGit;
module.exports.simpleGit = simpleGit;
module.exports.CleanOptions = CleanOptions;
module.exports.mockGitInstance = mockGitInstance;
module.exports.__mockGitInstance = mockGitInstance; 