# Git Repository Code Q&A Service Architecture Design

## 1. Overview

This service provides a REST API for answering questions about Git/GitHub repositories using the Gemini CLI. The service automatically clones repositories, manages local cache, and leverages Gemini-CLI to provide code-based question answering capabilities.

## 2. System Architecture

### 2.1 High-Level Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Client        │───▶│   REST API       │───▶│  Repository     │
│   Application   │    │   Server         │    │  Manager        │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │                        │
                                ▼                        ▼
                       ┌──────────────────┐    ┌─────────────────┐
                       │   Gemini CLI     │    │  Local Git      │
                       │   Executor       │    │  Storage        │
                       └──────────────────┘    └─────────────────┘
```

### 2.2 Core Components

1. **API Server**: HTTP REST API endpoint handler
2. **Repository Manager**: Git repository cloning and caching logic
3. **Gemini CLI Executor**: Interface to Gemini CLI execution
4. **Lock Manager**: Concurrent access control for repositories
5. **Cleanup Service**: Background service for repository maintenance
6. **Configuration Manager**: Service configuration management

## 3. API Specification

### 3.1 Endpoint

```
POST /api/v1/ask
```

### 3.2 Request Schema

```json
{
  "repository_url": "string (required)",
  "question": "string (required)", 
  "branch": "string (optional)",
  "timeout": "integer (optional, seconds)"
}
```

### 3.3 Response Schema

#### Success Response
```json
{
  "status": "success",
  "answer": "string",
  "repository": {
    "url": "string",
    "branch": "string",
    "commit_hash": "string"
  },
  "execution_time": "float"
}
```

#### Error Response
```json
{
  "status": "error",
  "error_code": "string",
  "message": "string",
  "details": "object (optional)"
}
```

## 4. Repository Management

### 4.1 Repository Identification

- Generate unique directory names using: `{repo_owner}_{repo_name}_{branch}_{branch_hash}`
- Support both HTTPS and SSH URLs (configurable preference)
- Default branch resolution for repositories without specified branch

### 4.2 Local Storage Structure

```
repositories/
├── github.com_owner_repo_main_abc123/
│   ├── .git/
│   ├── source_code/
│   └── .repo_metadata.json
├── github.com_another_repo_dev_def456/
└── ...
```

### 4.3 Repository Metadata

```json
{
  "url": "https://github.com/owner/repo",
  "branch": "main",
  "last_updated": "2024-01-01T00:00:00Z",
  "last_accessed": "2024-01-01T00:00:00Z",
  "commit_hash": "abc123...",
  "clone_method": "https"
}
```

## 5. Concurrency Management

### 5.1 Locking Strategy

- Use file-based locking per repository directory
- Read-write lock implementation:
  - Multiple readers allowed simultaneously
  - Exclusive writer access during updates
- Lock timeout mechanism to prevent deadlocks

### 5.2 Lock Implementation

```
repository_locks/
├── github.com_owner_repo_main_abc123.lock
├── github.com_another_repo_dev_def456.lock
└── ...
```

## 6. Data Flow

### 6.1 Request Processing Flow

```
1. Receive API request
2. Validate input parameters
3. Parse and normalize repository URL
4. Generate repository directory identifier
5. Acquire repository lock (read/write)
6. Check repository status:
   - If not exists: Clone repository
   - If exists but stale: Update repository
   - If exists and fresh: Use cached version
7. Execute Gemini CLI with question
8. Release repository lock
9. Update access timestamp
10. Return response
```

### 6.2 Repository Update Logic

```
1. Acquire write lock
2. Fetch latest changes (git fetch)
3. Check for updates on target branch
4. If updates available:
   - Perform minimal pull (git pull --depth=1)
   - Update metadata timestamp
5. Release write lock
```

## 7. Configuration Management

### 7.1 Configuration File Structure (config.yaml)

```yaml
server:
  host: "0.0.0.0"
  port: 8080
  max_concurrent_requests: 100

gemini:
  model: "gemini-1.5-flash-latest"
  temperature: 0.7
  top_p: 0.9
  top_k: 40
  max_output_tokens: 4096
  api_timeout: 300
  base_prompt: |
    You are a code analysis assistant. Please analyze the provided repository 
    and answer questions about the codebase accurately and concisely.

repository:
  storage_path: "./repositories"
  clone_method: "https"  # https or ssh
  clone_depth: 1
  update_threshold_hours: 24
  access_timeout_hours: 72
  max_concurrent_operations: 10

cleanup:
  enabled: true
  interval_hours: 24
  retention_days: 7
  max_storage_gb: 50

logging:
  level: "INFO"
  file: "./logs/service.log"
  max_size_mb: 100
  backup_count: 5
```

## 8. Error Handling

### 8.1 Error Categories

1. **Validation Errors**: Invalid input parameters
2. **Repository Errors**: Git clone/update failures
3. **Lock Errors**: Concurrency control failures  
4. **Gemini Errors**: CLI execution failures
5. **System Errors**: Storage, network, or resource issues

### 8.2 Error Codes

- `INVALID_REQUEST`: Malformed request parameters
- `REPOSITORY_NOT_FOUND`: Git repository inaccessible
- `REPOSITORY_CLONE_FAILED`: Git clone operation failed
- `LOCK_TIMEOUT`: Failed to acquire repository lock
- `GEMINI_EXECUTION_FAILED`: Gemini CLI execution error
- `TIMEOUT_EXCEEDED`: Operation exceeded configured timeout
- `STORAGE_FULL`: Insufficient disk space
- `INTERNAL_ERROR`: Unexpected system error

## 9. Background Services

### 9.1 Cleanup Service

- **Schedule**: Configurable interval (default: daily)
- **Operations**:
  - Remove repositories not accessed within retention period
  - Clean up orphaned lock files
  - Rotate log files
  - Monitor disk usage and enforce storage limits

### 9.2 Health Monitoring

- Repository storage usage monitoring
- Active lock tracking
- Gemini CLI availability checks
- System resource monitoring

## 10. Performance Considerations

### 10.1 Optimization Strategies

- Shallow clones for reduced storage and faster operations
- Repository metadata caching
- Asynchronous cleanup operations
- Connection pooling for concurrent requests
- Efficient locking with minimal critical sections

### 10.2 Scalability

- Horizontal scaling support through stateless design
- Configurable resource limits
- Load balancing compatibility
- Shared storage support for multi-instance deployment

## 11. Security Considerations

### 11.1 Current Scope

- Public repository access only
- Input validation and sanitization
- File system access controls
- Process isolation for Git operations

### 11.2 Future Enhancements

- Authentication for private repositories
- API key management
- Rate limiting per client
- Audit logging

## 12. Technology Stack

### 12.1 Core Technologies

- **Language**: Node.js 18+ (chosen to align with Gemini CLI and reduce Docker image size)
- **Web Framework**: Express.js with TypeScript
- **Git Operations**: simple-git / nodegit
- **Concurrency**: async/await with proper-lockfile for file locking
- **Configuration**: js-yaml for YAML configuration files  
- **Logging**: winston with rotation support
- **Process Management**: child_process for Gemini CLI execution

**Rationale for Node.js Selection**:
- Gemini CLI is Node.js-based, enabling shared runtime environment
- Reduced Docker image size by avoiding multiple language runtimes
- Excellent async/await support for concurrent repository operations
- Rich ecosystem for Git operations and web services
- Native JSON/YAML handling capabilities

### 12.2 Dependencies

- **Core Dependencies**:
  - express: Web framework
  - simple-git: Git operations
  - proper-lockfile: File-based locking
  - js-yaml: YAML configuration parsing
  - winston: Logging framework
  - node-cron: Scheduled cleanup tasks
  - helmet: Security middleware for Express
  - cors: Cross-Origin Resource Sharing middleware
  - express-rate-limit: Rate limiting middleware
- **Development Dependencies**:
  - typescript: Type safety
  - @types/node: Node.js type definitions
  - nodemon: Development server
  - jest: Testing framework
  - supertest: HTTP assertion library for testing
  - ts-jest: TypeScript preprocessor for Jest
  - jest-environment-node: Node.js environment for Jest
  - @types/jest: Jest type definitions
  - @types/supertest: Supertest type definitions
  - @typescript-eslint/eslint-plugin: TypeScript ESLint rules
  - @typescript-eslint/parser: TypeScript parser for ESLint
- **External Dependencies**:
  - Gemini CLI (shared Node.js runtime)
  - Git client

## 13. Deployment Architecture

### 13.1 Container Readiness

- Environment variable configuration support
- Volume mounting for repository storage
- Health check endpoints
- Graceful shutdown handling
- Log output to stdout/stderr
- Multi-stage Docker build for optimized image size
- Node.js Alpine base image for minimal footprint

### 13.2 Project Structure

```
project/
├── src/
│   ├── api/
│   │   ├── routes/
│   │   └── middleware/
│   ├── services/
│   │   ├── repository-manager.ts
│   │   ├── gemini-executor.ts
│   │   ├── lock-manager.ts
│   │   └── cleanup-service.ts
│   ├── config/
│   │   └── config-manager.ts
│   ├── types/
│   └── utils/
├── tests/
├── config/
│   └── config.yaml
├── logs/
├── repositories/
├── repository_locks/
├── package.json
├── tsconfig.json
├── Dockerfile
└── README.md
```

### 13.3 Resource Requirements

- **CPU**: 2+ cores recommended
- **Memory**: 2GB+ recommended (optimized for Node.js single runtime)
- **Storage**: Variable based on repository cache size
- **Network**: Outbound access to Git repositories and Gemini API
- **Node.js Runtime**: v18+ with npm/yarn package manager

## 14. Testing Strategy

### 14.1 Testing Framework

The project uses **Jest** as the primary testing framework with TypeScript support via ts-jest. The testing infrastructure includes:

- **Unit Tests**: Test individual components in isolation
- **Integration Tests**: Test component interactions and API endpoints
- **Comprehensive Coverage**: Target >95% code coverage
- **CI/CD Integration**: Automated testing in continuous integration

### 14.2 Test Organization

```
tests/
├── setup.ts                 # Global test configuration
├── helpers/                 # Testing utilities and factories
│   └── test-utils.ts        # MockDataFactory, TestAPIHelper, etc.
├── __mocks__/               # External service mocks
│   ├── simple-git.ts        # Git operations mock
│   └── child_process.ts     # Gemini CLI execution mock
├── unit/                    # Unit tests
│   ├── config/              # Configuration layer tests
│   ├── services/            # Business logic layer tests
│   └── utils/               # Utility function tests
└── integration/             # Integration tests
    └── api/                 # API endpoint tests
```

### 14.3 Testing Utilities

- **MockDataFactory**: Generate consistent test data
- **TestAPIHelper**: API endpoint testing utilities
- **TestEnvironmentUtils**: Environment setup and teardown
- **MockFileSystem**: File system operation mocking

### 14.4 Mocking Strategy

External dependencies are mocked to ensure test reliability:
- **simple-git**: Git operations
- **child_process**: Gemini CLI execution
- **File System**: Repository storage operations
- **Network**: HTTP requests

### 14.5 Coverage Requirements

- **Statements**: 95%+ (currently 74.26%)
- **Branches**: 85%+ (currently 55.24%)
- **Functions**: 100% (currently 81.63%)
- **Lines**: 95%+ (currently 73.88%)

## 15. Monitoring and Observability

### 15.1 Metrics

- Request rate and response times
- Repository cache hit/miss ratios
- Gemini CLI execution statistics
- Storage usage trends
- Error rates by category

### 15.2 Health Checks

- `/health`: Basic service health
- `/ready`: Service readiness for traffic
- `/metrics`: Prometheus-compatible metrics endpoint

## 16. Development Phases

### Phase 1: Core Implementation
- Express.js API server with TypeScript setup ✅
- Repository management with simple-git ✅ (fully implemented with comprehensive testing)
- Gemini CLI integration via child_process ✅ (fully implemented with comprehensive testing)
- YAML configuration management with js-yaml ✅
- Basic logging with winston ✅

### Phase 2: Production Features
- File-based concurrency control with proper-lockfile ⏳ (design complete, implementation pending)
- Comprehensive error handling and validation ⏳ (partial implementation)
- Background cleanup service with node-cron ⏳ (design complete, implementation pending)
- Health check endpoints and monitoring ✅
- Unit testing with Jest ✅ (framework complete, 136 tests, 74.26% coverage)

### Phase 3: Enhancement
- Performance optimization and caching strategies ⏳
- Advanced Git operations and repository metadata ⏳
- Docker containerization with Node.js Alpine base ⏳
- API documentation with Swagger/OpenAPI ⏳
- Production deployment guides ⏳

### Phase 4: Package Management
- package.json with proper dependency management ✅
- npm scripts for development, testing, and production ✅
- Environment-specific configuration ✅
- CI/CD pipeline integration ✅ (Jest CI configuration complete)

## 17. Current Implementation Status

### Completed Components
- **Project Structure**: Complete directory structure as per design ✅
- **Base Configuration**: TypeScript, ESLint, package.json setup ✅
- **Configuration Management**: `ConfigManager` class with YAML support ✅
- **Logging System**: Winston logger with file and console output ✅
- **Server Foundation**: Express.js server with security middleware ✅
- **Health Monitoring**: Basic health check and ready endpoints ✅
- **Development Environment**: npm scripts for build, dev, and test ✅
- **Repository Manager**: Complete Git operations and caching logic with proper-lockfile concurrency control ✅
  - Full CRUD operations for repository management
  - Intelligent update strategy with time-based caching
  - Comprehensive error handling and metadata management
  - Background cleanup service with storage limit enforcement
  - 86.06% statement coverage, 100% function coverage
- **Testing Framework**: Complete Jest setup with CI support ✅
  - 136 test cases with 74.26% code coverage overall
  - Unit tests for ConfigManager, Logger, Repository Manager, Gemini Executor, and Gemini Factory
  - Integration test framework for API endpoints
  - Comprehensive test utilities and mocks
  - CI-friendly configuration
- **Gemini CLI Executor**: Complete integration with Gemini CLI ✅
  - Full CLI command execution with proper error handling
  - Comprehensive timeout and buffer management
  - Response parsing for both JSON and plain text formats
  - 20 test cases covering all functionality
- **Gemini Factory**: Complete factory utilities for creating Gemini components ✅
  - Configuration conversion utilities
  - Executor instance creation methods
  - 14 test cases with 100% coverage

### In Progress
- **API Routes**: Main `/api/v1/ask` endpoint (test framework ready, implementation pending)

### Pending Implementation
- **Request Validation**: Input validation and error handling (partial implementation)

### File Structure Status
```
service/
├── src/
│   ├── index.ts ✅
│   ├── config/
│   │   └── config-manager.ts ✅
│   ├── utils/
│   │   └── logger.ts ✅
│   ├── api/
│   │   ├── routes/ (empty - implementation pending)
│   │   └── middleware/ (empty - implementation pending)
│   ├── services/
│   │   ├── repository-manager.ts ✅ (full implementation with concurrency control)
│   │   └── gemini-executor.ts ✅ (full implementation with CLI integration)
│   ├── types/
│   │   ├── index.ts ✅ (all type exports)
│   │   ├── repository.ts ✅ (complete repository type definitions)
│   │   └── gemini.ts ✅ (complete Gemini CLI type definitions)
│   └── utils/
│       └── gemini-factory.ts ✅ (complete factory utilities)
├── tests/ ✅ (complete testing framework and utilities)
│   ├── unit/ (ConfigManager, Logger, Repository Manager, Gemini Executor, Gemini Factory fully implemented)
│   ├── integration/ (API test framework ready)
│   ├── helpers/ (comprehensive test utilities)
│   └── __mocks__/ (external service mocks)
├── config.yaml ✅
├── config.yaml.example ✅
├── package.json ✅ (all dependencies including testing)
├── tsconfig.json ✅
├── jest.config.js ✅ (comprehensive Jest configuration)
├── jest.config.ci.js ✅ (CI-optimized configuration)
└── logs/ ✅
```

### Testing Status
- **Unit Tests**: 136 tests (ConfigManager, Logger, Repository Manager, Gemini Executor, Gemini Factory fully implemented)
- **Integration Tests**: 0 tests (API endpoint tests scaffolded, awaiting implementation)
- **Test Coverage**: 74.26% statements, 55.24% branches, 81.63% functions
- **Test Infrastructure**: Complete with utilities, mocks, and CI support

This architecture provides a robust foundation for the Git repository Q&A service with comprehensive testing infrastructure, while core service implementations are scheduled for completion in the next development phase.
