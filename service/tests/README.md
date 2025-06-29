# Testing Framework

This project uses Jest + TypeScript for comprehensive unit and integration testing of the Git Repository Code Q&A Service.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn package manager
- TypeScript knowledge for writing tests

### Installation
```bash
npm install
```

### Run All Tests
```bash
npm test
```

### Run Tests with Coverage Report
```bash
npm run test:coverage
```

## 📁 Test Directory Structure

```
tests/
├── setup.ts                    # Global test configuration and setup
├── helpers/
│   └── test-utils.ts           # Testing utility classes and helper functions
├── __mocks__/                  # Mock implementations for external dependencies
│   ├── simple-git.ts          # Git operations mocking
│   └── child_process.ts       # Child process mocking for CLI execution
├── unit/                       # Unit tests for individual components
│   ├── config/
│   │   └── config-manager.test.ts
│   ├── utils/
│   │   └── logger.test.ts
│   └── services/
│       ├── repository-manager.test.ts
│       ├── gemini-executor.test.ts
│       ├── lock-manager.test.ts
│       └── cleanup-service.test.ts
└── integration/                # Integration tests for API endpoints
    └── api/
        ├── ask-endpoint.test.ts
        └── health-endpoints.test.ts
```

## 🛠️ Available Test Commands

| Command | Description |
|---------|-------------|
| `npm test` | Run all tests with default configuration |
| `npm run test:watch` | Run tests in watch mode (auto-rerun on file changes) |
| `npm run test:coverage` | Generate and display test coverage report |
| `npm run test:unit` | Run only unit tests |
| `npm run test:integration` | Run only integration tests |
| `npm run test:unit:watch` | Run unit tests in watch mode |
| `npm run test:integration:watch` | Run integration tests in watch mode |
| `npm run test:silent` | Run tests with minimal output |
| `npm run test:verbose` | Run tests with detailed output |
| `npm run test:ci` | Run tests in CI environment with strict settings |

## 🧪 Test Types

### Unit Tests
Unit tests focus on testing individual components in isolation:

- **Purpose**: Verify that individual functions, classes, and modules work correctly
- **Scope**: Single component with all dependencies mocked
- **Location**: `tests/unit/`
- **Naming**: `*.test.ts` or `*.spec.ts`

**Example:**
```typescript
describe('ConfigManager', () => {
  describe('loadConfig', () => {
    it('should load valid YAML configuration', async () => {
      // Test implementation
    });
  });
});
```

### Integration Tests
Integration tests verify that multiple components work together:

- **Purpose**: Test component interactions and API endpoints
- **Scope**: Multiple components with minimal mocking
- **Location**: `tests/integration/`
- **Focus**: API endpoints, database interactions, external service calls

**Example:**
```typescript
describe('POST /api/v1/ask', () => {
  it('should return answer for valid repository question', async () => {
    const response = await request(app)
      .post('/api/v1/ask')
      .send(mockRequest);
    expect(response.status).toBe(200);
  });
});
```

### Type Definition Tests
Type definition tests ensure type safety and validate enum values:

- **Purpose**: Verify TypeScript interfaces and enums are correctly defined
- **Scope**: Type definitions, mock factories, and test utilities
- **Location**: `tests/unit/types/`
- **Focus**: Enum values, type assertions, mock data factory validation

**Example:**
```typescript
describe('Type Definitions', () => {
  describe('ErrorCode', () => {
    it('should have all required error codes', () => {
      expect(ErrorCode.INVALID_REQUEST).toBe('INVALID_REQUEST');
      expect(ErrorCode.REPOSITORY_NOT_FOUND).toBe('REPOSITORY_NOT_FOUND');
    });
  });
});
```

## 🔧 Testing Tools and Utilities

### MockDataFactory
Factory class for creating consistent test data with full type safety:

```typescript
import { MockDataFactory } from '../helpers/test-utils';
import { ErrorCode, GitCloneMethod } from '../../src/types';

// Create mock API request (now fully typed)
const mockRequest = MockDataFactory.createMockRequest({
  repository_url: 'https://github.com/test/repo',
  question: 'What does this code do?'
});

// Create mock successful response
const mockResponse = MockDataFactory.createMockSuccessResponse({
  answer: 'This is a test repository.'
});

// Create mock error response with typed error codes
const mockError = MockDataFactory.createMockErrorResponse({
  error_code: ErrorCode.REPOSITORY_NOT_FOUND,
  message: 'Repository not found'
});

// Create mock repository metadata
const mockMetadata = MockDataFactory.createMockRepositoryMetadata({
  url: 'https://github.com/test/repo',
  clone_method: 'ssh' as GitCloneMethod,
  size_mb: 25.7
});

// Create mock repository info
const mockRepoInfo = MockDataFactory.createMockRepositoryInfo({
  url: 'https://github.com/test/repo',
  branch: 'develop'
});
```

### TestAPIHelper
Helper class for API endpoint testing with full type safety:

```typescript
import { TestAPIHelper } from '../helpers/test-utils';
import { AskRequest } from '../../src/types';

const apiHelper = new TestAPIHelper(app);

// Test API endpoints (now with typed requests)
const mockRequest: AskRequest = MockDataFactory.createMockRequest();
const response = await apiHelper.askQuestion(mockRequest);
const healthCheck = await apiHelper.checkHealth();
const readinessCheck = await apiHelper.checkReady();
const metrics = await apiHelper.getMetrics(); // New method
```

### TestAssertions
Helper class for type-safe response validation:

```typescript
import { TestAssertions } from '../helpers/test-utils';

// Assert response structure and types
TestAssertions.assertSuccessResponse(response.body);
TestAssertions.assertErrorResponse(errorResponse.body);
TestAssertions.assertValidRepositoryMetadata(metadata);

// Example usage in tests
it('should return valid success response', async () => {
  const response = await apiHelper.askQuestion(mockRequest);
  
  // This will throw if response doesn't match AskSuccessResponse structure
  TestAssertions.assertSuccessResponse(response.body);
  
  // Now TypeScript knows response.body is AskSuccessResponse
  expect(response.body.execution_time).toBeGreaterThan(0);
});
```

### TestEnvironmentUtils
Utilities for test environment management:

```typescript
import { TestEnvironmentUtils } from '../helpers/test-utils';

// Create temporary directory
const tempDir = TestEnvironmentUtils.createTempRepoDir();

// Clean up test resources
await TestEnvironmentUtils.cleanup([tempDir]);

// Wait for conditions
await TestEnvironmentUtils.waitFor(
  () => someCondition(),
  5000 // timeout in ms
);
```

### MockFileSystem
File system operations mocking:

```typescript
import { MockFileSystem } from '../helpers/test-utils';

// Mock file content
MockFileSystem.mockFile('/path/to/file', 'file content');

// Check if file is mocked
const exists = MockFileSystem.hasMockFile('/path/to/file');

// Clear all mocks
MockFileSystem.clearMocks();
```

## 🎭 Mocking External Dependencies

### Git Operations (simple-git)
```typescript
// Mock successful clone
const mockGitInstance = {
  clone: jest.fn().mockResolvedValue(undefined),
  pull: jest.fn().mockResolvedValue({ summary: { changes: 0 } }),
  log: jest.fn().mockResolvedValue({ latest: { hash: 'abc123' } })
};
(mockSimpleGit as jest.Mock).mockReturnValue(mockGitInstance);
```

### Child Process (Gemini CLI)
```typescript
import { setMockExecResult } from '../__mocks__/child_process';

// Set command execution result
setMockExecResult('gemini-cli --version', {
  stdout: 'gemini-cli version 1.0.0',
  stderr: ''
});

// Mock command with error
setMockExecResult('gemini-cli ask', {
  stdout: '',
  stderr: 'Error: API key not found',
  error: new Error('Command failed')
});
```

### File System Operations
```typescript
// Mock file existence
mockFs.access.mockResolvedValue(undefined);

// Mock file not found
mockFs.access.mockRejectedValue(new Error('ENOENT'));

// Mock file content
mockFs.readFile.mockResolvedValue('file content');
```

## 📊 Coverage Requirements

| Metric | Development | CI Environment |
|--------|-------------|----------------|
| Statements | 70% | 80% |
| Branches | 70% | 80% |
| Functions | 70% | 80% |
| Lines | 70% | 80% |

### Viewing Coverage Reports
```bash
# Generate HTML coverage report
npm run test:coverage

# View detailed coverage in browser
open coverage/lcov-report/index.html
```

## 🔍 Writing Effective Tests

### Test Structure (AAA Pattern)
```typescript
it('should handle repository clone successfully', async () => {
  // Arrange
  const mockRepo = 'https://github.com/test/repo';
  mockGit.clone.mockResolvedValue(undefined);
  
  // Act
  const result = await repositoryManager.cloneRepository(mockRepo);
  
  // Assert
  expect(result).toBe(true);
  expect(mockGit.clone).toHaveBeenCalledWith(mockRepo, expect.any(String));
});
```

### Test Naming Conventions
- Use descriptive names that explain what is being tested
- Follow pattern: `should [expected behavior] when [condition]`
- Group related tests using `describe` blocks

```typescript
describe('RepositoryManager', () => {
  describe('cloneRepository', () => {
    it('should clone repository successfully with valid URL', () => {});
    it('should throw error when repository URL is invalid', () => {});
    it('should handle network errors gracefully', () => {});
  });
});
```

### Testing Async Code
```typescript
// Using async/await
it('should handle async operations', async () => {
  const result = await asyncFunction();
  expect(result).toBe(expected);
});

// Testing promises
it('should resolve with correct data', () => {
  return expect(promiseFunction()).resolves.toBe(expectedData);
});

// Testing rejections
it('should reject with error', () => {
  return expect(promiseFunction()).rejects.toThrow('Expected error');
});
```

### Testing Error Scenarios
```typescript
it('should throw specific error for invalid input', () => {
  expect(() => functionThatThrows()).toThrow('Invalid input');
});

it('should handle API errors gracefully', async () => {
  mockApiCall.mockRejectedValue(new Error('API Error'));
  
  await expect(serviceFunction()).rejects.toThrow('API Error');
});
```

## 🐛 Debugging Tests

### Running Specific Tests
```bash
# Run single test file
npm test -- config-manager.test.ts

# Run specific test case
npm test -- --testNamePattern="should load configuration"

# Run tests matching pattern
npm test -- --testPathPattern="unit/config"
```

### Debug Mode
```bash
# Run with debug information
npm test -- --detectOpenHandles --forceExit

# Run with verbose output
npm run test:verbose

# Run single test in watch mode
npm test -- --watch config-manager.test.ts
```

### Common Jest Matchers
```typescript
// Equality
expect(value).toBe(4); // Strict equality (===)
expect(object).toEqual({name: 'test'}); // Deep equality

// Truthiness
expect(value).toBeTruthy();
expect(value).toBeFalsy();
expect(value).toBeNull();
expect(value).toBeUndefined();
expect(value).toBeDefined();

// Numbers
expect(value).toBeGreaterThan(3);
expect(value).toBeCloseTo(3.14, 2);

// Strings
expect('hello world').toMatch(/world/);
expect('hello world').toContain('hello');

// Arrays
expect(['a', 'b', 'c']).toContain('b');
expect(['a', 'b']).toHaveLength(2);

// Exceptions
expect(() => throwError()).toThrow();
expect(() => throwError()).toThrow('Error message');

// Mocks
expect(mockFn).toHaveBeenCalled();
expect(mockFn).toHaveBeenCalledWith(arg1, arg2);
expect(mockFn).toHaveBeenCalledTimes(2);
```

## 🚀 CI/CD Integration

### GitHub Actions Example
```yaml
name: Test
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run test:ci
```

### CI Configuration
The `npm run test:ci` command uses special CI configuration:
- Stricter coverage thresholds (80%)
- No watch mode
- JUnit XML output for CI integration
- Parallel execution limited to 2 workers

## 📝 Best Practices

### 1. Test Organization
- Group related tests in `describe` blocks
- Use clear, descriptive test names
- Keep tests focused and independent
- One assertion per test when possible

### 2. Mock Management
- Clear mocks before each test with `beforeEach`
- Use specific mocks for specific scenarios
- Avoid over-mocking - test real interactions when safe

### 3. Test Data
- Use factory functions for consistent test data
- Keep test data minimal and focused
- Use meaningful test data that aids understanding

### 4. Performance
- Avoid unnecessary setup in tests
- Use `beforeAll` for expensive setup when safe
- Mock external dependencies to improve speed

### 5. Maintenance
- Update tests when requirements change
- Remove obsolete tests
- Refactor test code like production code

## 🔧 Configuration Files

### jest.config.js
Main Jest configuration with TypeScript support, coverage settings, and module mapping.

### jest.config.ci.js
CI-specific configuration with stricter requirements and optimizations for automated environments.

### tests/setup.ts
Global test setup including environment variables, timeouts, and global hooks.

## 📚 Additional Resources

- [Jest Documentation](https://jestjs.io/docs)
- [Testing Library Best Practices](https://testing-library.com/docs/guiding-principles)
- [TypeScript Testing Guide](https://typescript-eslint.io/docs/linting/type-linting/)

## 🆘 Troubleshooting

### Common Issues

**Tests hanging or not finishing:**
```bash
npm test -- --detectOpenHandles --forceExit
```

**Module resolution errors:**
- Check `moduleNameMapping` in `jest.config.js`
- Verify import paths in test files

**Coverage not accurate:**
- Ensure all source files are included in `collectCoverageFrom`
- Check for untested code paths

**Mocks not working:**
- Verify mock placement before imports
- Check mock implementation matches expected interface

### Getting Help

1. Check test output for specific error messages
2. Review Jest documentation for matcher usage
3. Examine existing working tests for patterns
4. Use `console.log` for debugging test values

## ✅ Project Status & Todo List

### Completed Features

#### Core Testing Infrastructure ✅
- [x] Jest + TypeScript configuration setup
- [x] Test directory structure organization
- [x] Global test setup and configuration
- [x] Coverage reporting with thresholds (70% dev, 80% CI)
- [x] CI/CD configuration for automated testing
- [x] npm test scripts for different scenarios

#### Testing Utilities ✅
- [x] `MockDataFactory` for consistent test data generation with full type safety
- [x] `TestAPIHelper` for API endpoint testing with typed requests
- [x] `TestEnvironmentUtils` for environment management
- [x] `MockFileSystem` for file system operations mocking
- [x] `TestAssertions` for type-safe response validation
- [x] Mock implementations for external dependencies

#### Mock System ✅
- [x] simple-git operations mocking
- [x] child_process execution mocking for Gemini CLI
- [x] File system operations mocking
- [x] Winston logger mocking
- [x] Configuration system mocking

#### Unit Tests Implementation ✅
- [x] **ConfigManager** - Complete test suite (12 test cases)
  - [x] Configuration loading from YAML files
  - [x] Environment variable overrides
  - [x] Default value handling
  - [x] Validation and error scenarios
- [x] **Logger** - Complete test suite (6 test cases)
  - [x] Log level configuration
  - [x] File and console output testing
  - [x] Error handling and formatting
- [x] **Type Definitions** - Complete test suite (20+ test cases)
  - [x] Enum value validation for all error codes and categories
  - [x] Mock data factory type safety verification
  - [x] Test assertion utility validation
  - [x] Type structure compliance testing

#### Test Coverage ✅
- [x] Achieved 97.67% statement coverage
- [x] 88.88% branch coverage
- [x] 100% function coverage
- [x] HTML coverage reports generation

### In Progress Features 🚧

#### Unit Tests - Skeleton Implementation
- [🚧] **RepositoryManager** - Basic structure created (needs implementation)
- [🚧] **GeminiExecutor** - Basic structure created (needs implementation) 
- [🚧] **LockManager** - Not yet created
- [🚧] **CleanupService** - Not yet created

#### Integration Tests - Skeleton Implementation
- [🚧] **API Endpoints** - Basic structure created (needs implementation)
- [🚧] **Health Endpoints** - Basic structure created (needs implementation)

### Pending Features 📋

#### High Priority (Next Sprint)
- [ ] **Complete RepositoryManager Tests**
  - [ ] Git clone operations testing
  - [ ] Repository caching logic
  - [ ] Branch handling and validation
  - [ ] Repository metadata management
  - [ ] Update and sync operations
  - [ ] Error handling for Git failures

- [ ] **Complete GeminiExecutor Tests**
  - [ ] CLI command execution testing
  - [ ] Response parsing and validation
  - [ ] Timeout handling
  - [ ] Error scenario testing
  - [ ] API rate limiting testing

- [ ] **Complete API Integration Tests**
  - [ ] POST /api/v1/ask endpoint testing
  - [ ] Request validation testing
  - [ ] Response format validation
  - [ ] Error response testing
  - [ ] Authentication testing (if implemented)

#### Medium Priority (Future Sprints)
- [ ] **LockManager Implementation & Tests**
  - [ ] File-based locking mechanism
  - [ ] Concurrent access control
  - [ ] Lock timeout handling
  - [ ] Deadlock prevention
  - [ ] Lock cleanup on failures

- [ ] **CleanupService Implementation & Tests**
  - [ ] Repository cleanup scheduling
  - [ ] Storage usage monitoring
  - [ ] Orphaned lock cleanup
  - [ ] Log rotation testing
  - [ ] Configuration-based cleanup rules

- [ ] **Advanced Testing Scenarios**
  - [ ] Concurrent operation testing
  - [ ] Memory leak detection
  - [ ] Large repository handling
  - [ ] Network failure simulation
  - [ ] Disk space exhaustion testing

#### Low Priority (Future Enhancements)
- [ ] **Performance Testing**
  - [ ] Load testing for API endpoints
  - [ ] Memory usage profiling
  - [ ] Repository cache performance
  - [ ] Concurrent request handling

- [ ] **Security Testing**
  - [ ] Input sanitization testing
  - [ ] Path traversal prevention
  - [ ] Repository URL validation
  - [ ] Process isolation testing

- [ ] **Additional Test Types**
  - [ ] End-to-end (E2E) testing
  - [ ] Contract testing
  - [ ] Chaos engineering tests
  - [ ] Snapshot testing for responses

### Technical Debt & Improvements 🔧

#### Code Quality
- [ ] Increase branch coverage from 88.88% to 95%+
- [ ] Add more edge case testing
- [ ] Improve error message testing specificity
- [ ] Add property-based testing for complex logic

#### Test Infrastructure
- [ ] Add test data fixtures for complex scenarios
- [ ] Implement test database seeding utilities
- [ ] Add visual regression testing for any UI components
- [ ] Create test environment containerization

#### Documentation
- [ ] Add inline code documentation for test utilities
- [ ] Create testing contribution guidelines
- [ ] Add troubleshooting guide for common test failures
- [ ] Document test data management best practices

#### Tooling & Automation
- [ ] Add automated test report generation
- [ ] Implement test flakiness detection
- [ ] Add performance regression detection
- [ ] Create automated test maintenance scripts

### Testing Metrics Goals 🎯

#### Current Status
- **Total Test Suites**: 7 passed (including new Type Definition tests)
- **Total Tests**: 125+ (32+ implemented, 90+ skeletons)
- **Statement Coverage**: 97.67%
- **Branch Coverage**: 88.88%
- **Function Coverage**: 100%

#### Target Goals
- **Total Tests**: 200+ (complete implementation)
- **Statement Coverage**: 95%+
- **Branch Coverage**: 95%+
- **Function Coverage**: 100%
- **Test Execution Time**: <30 seconds
- **Test Reliability**: 99%+ (minimal flaky tests)

### Recent Changes 📝

#### Version 1.0.0 (Current)
- ✅ Initial testing framework setup
- ✅ Core utility implementations
- ✅ ConfigManager and Logger complete tests
- ✅ Mock system implementation
- ✅ CI/CD integration

#### Upcoming Version 1.1.0
- 🎯 Complete RepositoryManager tests
- 🎯 Complete GeminiExecutor tests  
- 🎯 API integration tests implementation
- 🎯 Increase coverage to 95%+

### Contributing to Tests 🤝

#### Getting Started
1. Review existing test patterns in `tests/unit/config/` and `tests/unit/utils/`
2. Check skeleton tests in `tests/unit/services/` for structure
3. Follow AAA pattern (Arrange-Act-Assert)
4. Ensure new tests increase overall coverage

#### Test Implementation Priority
1. **RepositoryManager** - Critical for Git operations
2. **GeminiExecutor** - Critical for AI integration  
3. **API Endpoints** - Critical for service functionality
4. **LockManager** - Important for concurrency
5. **CleanupService** - Important for maintenance

---

**Happy Testing! 🧪✨** 