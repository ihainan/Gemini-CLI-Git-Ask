# Git Ask MCP Server Architecture Design

## 1. Overview

This MCP (Model Context Protocol) server provides a standardized interface for AI clients to interact with Git repositories through code analysis. The server acts as an adapter layer that converts MCP protocol requests into REST API calls to the existing Git Ask service, enabling seamless integration with MCP-compatible clients like Claude Desktop and VS Code.

## 2. System Architecture

### 2.1 High-Level Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   MCP Client    │───▶│   MCP Server     │───▶│  Git Ask        │
│ (Claude/VS Code)│    │  (Adapter Layer) │    │  Service API    │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │                        │
                                ▼                        ▼
                       ┌──────────────────┐    ┌─────────────────┐
                       │ MCP Protocol     │    │ Repository      │
                       │ (stdio/HTTP)     │    │ Manager         │
                       └──────────────────┘    └─────────────────┘
```

### 2.2 Core Components

1. **MCP Server**: Core MCP protocol implementation using official SDK
2. **Service Client**: HTTP client for communicating with Git Ask service
3. **Tool Handler**: MCP tool implementation for repository analysis
4. **Transport Layer**: stdio/HTTP transport for MCP communication
5. **Configuration Manager**: Environment-based configuration management
6. **Error Handler**: Comprehensive error handling and logging

## 3. MCP Protocol Specification

### 3.1 Tools

#### 3.1.1 ask-repository Tool

**Name**: `ask-repository`
**Title**: Ask Repository Question
**Description**: Ask questions about any Git repository using AI code analysis. Supports GitHub, GitLab, and other Git hosting platforms with multiple URL formats including HTTPS and SSH.

**Input Schema**:
```json
{
  "repository_url": {
    "type": "string",
    "format": "uri",
    "description": "Git repository URL supporting multiple formats",
    "examples": [
      "https://github.com/owner/repo",
      "https://github.com/owner/repo.git", 
      "git@github.com:owner/repo.git",
      "https://gitlab.com/owner/repo.git"
    ]
  },
  "question": {
    "type": "string", 
    "description": "Your question about the repository"
  },
  "branch": {
    "type": "string",
    "description": "Specific branch to analyze (optional, default: main/master)"
  }
}
```

**Output Schema**:
```json
{
  "content": [
    {
      "type": "text",
      "text": "Analysis result with repository metadata"
    }
  ],
  "isError": "boolean (optional)"
}
```

### 3.2 Transport Methods

- **Primary**: stdio transport for direct client integration
- **Future**: HTTP transport for remote deployments

## 4. Service Integration

### 4.1 Git Ask Service Client

The MCP server communicates with the existing Git Ask service through a dedicated HTTP client:

**API Endpoint**: `POST /api/v1/ask`

```typescript
interface ServiceRequest {
  repository_url: string;
  question: string;
  branch?: string;
  timeout?: number;  // Request timeout in seconds
}

interface ServiceResponse {
  status: 'success' | 'error';
  answer?: string;
  repository?: {
    url: string;
    branch: string;
    commit_hash: string;
  };
  execution_time?: number;
  error_code?: string;
  message?: string;
}
```

### 4.2 Request Flow

```
1. Receive MCP tool call from client
2. Validate input parameters using Zod schema
3. Transform MCP request to service API format
4. Send HTTP POST request to Git Ask service
5. Process service response and handle errors
6. Transform service response to MCP format
7. Return MCP tool result to client
```

### 4.3 Error Mapping

| Service Error Code | MCP Error Handling |
|-------------------|-------------------|
| `INVALID_REQUEST` | Parameter validation error |
| `REPOSITORY_NOT_FOUND` | Repository access error |
| `REPOSITORY_CLONE_FAILED` | Git operation failure |
| `GEMINI_EXECUTION_FAILED` | Analysis service error |
| `TIMEOUT_EXCEEDED` | Request timeout |
| `INTERNAL_ERROR` | Generic service error |

## 5. Configuration Management

### 5.1 Environment Variables

The MCP server configuration is entirely driven by environment variables passed during startup:

```typescript
interface MCPServerConfig {
  SERVICE_URL: string;           // Primary Git Ask service endpoint
  GIT_ASK_SERVICE_URL: string;   // Alternative service URL (fallback)
  REQUEST_TIMEOUT: number;       // HTTP request timeout (seconds)
  LOG_LEVEL: string;             // Logging level (info, debug, error, warn)
}
```

**Environment Variable Priority:**
1. `SERVICE_URL` - Primary service endpoint URL
2. `GIT_ASK_SERVICE_URL` - Fallback service endpoint URL  
3. Default: `http://localhost:8080`

### 5.2 Default Configuration

```typescript
const defaultConfig = {
  SERVICE_URL: process.env.SERVICE_URL || process.env.GIT_ASK_SERVICE_URL || 'http://localhost:8080',
  REQUEST_TIMEOUT: parseInt(process.env.REQUEST_TIMEOUT || '300', 10),
  LOG_LEVEL: process.env.LOG_LEVEL || 'info'
};
```

**Configuration Validation:**
- Service URL is validated during server startup
- Invalid timeout values fallback to 300 seconds
- Unsupported log levels fallback to 'info'

### 5.3 Client Configuration Examples

#### Claude Desktop Configuration
```json
{
  "mcpServers": {
    "git-ask": {
      "command": "npx",
      "args": ["-y", "git-ask-mcp-server"],
      "env": {
        "SERVICE_URL": "http://localhost:8080"
      }
    }
  }
}
```

#### VS Code MCP Configuration
```json
{
  "mcp": {
    "servers": {
      "git-ask": {
        "command": "npx",
        "args": ["-y", "git-ask-mcp-server"],
        "env": {
          "SERVICE_URL": "http://localhost:8080"
        }
      }
    }
  }
}
```

## 6. Error Handling

### 6.1 Error Categories

1. **Configuration Errors**: Invalid or missing environment variables
2. **Service Connection Errors**: Git Ask service unavailable
3. **Request Validation Errors**: Invalid MCP tool parameters
4. **Service Response Errors**: Git Ask service error responses
5. **Network Errors**: HTTP request failures and timeouts

### 6.2 Error Response Format

```typescript
interface MCPErrorResponse {
  content: [{
    type: "text";
    text: string;
  }];
  isError: true;
}
```

### 6.3 Error Handling Strategy

- **Graceful Degradation**: Provide meaningful error messages to users
- **Service Health Checks**: Validate service connectivity on startup
- **Timeout Management**: Implement request timeouts with clear messages
- **Connection Retry**: Basic retry logic for transient network errors
- **Logging**: Comprehensive error logging for debugging

### 6.4 Known Issues and Solutions

#### 6.4.1 Timeout Unit Mismatch
**Issue**: MCP clients send timeout values in seconds, but some service implementations may interpret them as milliseconds.
**Solution**: Ensure consistent timeout unit handling - MCP Server converts seconds to milliseconds for service calls.

#### 6.4.2 MCP Inspector Timeout
**Issue**: MCP Inspector has a default 10-second timeout which is too short for AI analysis tasks.
**Solution**: Configure MCP Inspector with extended timeout (300 seconds) or use URL parameters for timeout configuration.

## 7. NPM Package Distribution

### 7.1 Package Configuration

```json
{
  "name": "git-ask-mcp-server",
  "version": "1.0.0",
  "description": "MCP Server for Git Repository Code Analysis",
  "type": "module",
  "main": "dist/index.js",
  "bin": {
    "git-ask-mcp-server": "dist/index.js"
  },
  "files": [
    "dist/**/*",
    "README.md",
    "LICENSE"
  ]
}
```

### 7.2 Distribution Strategy

- **NPM Registry**: Public package distribution via npm
- **Executable Binary**: Command-line tool with shebang support
- **Dependency Management**: Minimal dependencies for faster installation
- **Version Management**: Semantic versioning with automated releases

### 7.3 Installation Methods

#### Direct NPX Usage (Recommended)
```bash
npx -y git-ask-mcp-server
```

#### Global Installation
```bash
npm install -g git-ask-mcp-server
git-ask-mcp-server
```

#### Local Development
```bash
git clone <repository>
cd mcp
npm install
npm run build
npm start
```

## 8. Development Workflow

### 8.1 Project Structure

```
mcp/
├── package.json                    # NPM package configuration
├── tsconfig.json                   # TypeScript compiler configuration
├── README.md                       # Project documentation
├── LICENSE                         # MIT license file
├── design.md                       # Architecture design document
├── TESTING.md                      # MCP Inspector testing guide
├── inspector.config.json           # MCP Inspector configuration
├── src/                            # Source code directory
│   ├── index.ts                    # Entry point with shebang
│   ├── server.ts                   # MCP server configuration with environment validation
│   ├── client/
│   │   └── service-client.ts       # Git Ask service HTTP client
│   └── tools/
│       └── ask-repository.ts       # Repository analysis tool implementation
└── dist/                           # Compiled JavaScript output
```

**Note:** The project uses the root-level `.gitignore` file for unified Git ignore management across all submodules. MCP-specific ignore patterns are included in the root configuration.

### 8.2 Build Process

```bash
# Development build with watch mode
npm run dev

# Production build
npm run build

# Clean build artifacts
npm run clean
```

### 8.3 Testing and Debugging

```bash
# MCP Inspector testing (see TESTING.md for details)
DANGEROUSLY_OMIT_AUTH=true HOST=0.0.0.0 SERVER_PORT=6277 \
npx @modelcontextprotocol/inspector --config inspector.config.json

# Direct MCP server testing
node dist/index.js

# Service connectivity testing
curl -s http://localhost:8080/health
```

### 8.4 Release Process

```bash
# Patch release (1.0.0 -> 1.0.1)
npm run release

# Minor release (1.0.0 -> 1.1.0)
npm run release:minor

# Major release (1.0.0 -> 2.0.0)
npm run release:major
```

## 9. Testing Strategy

### 9.1 Testing Framework

- **Unit Tests**: Test individual components in isolation
- **Integration Tests**: Test MCP tool functionality with mock service
- **End-to-End Tests**: Test complete workflow with real service
- **Service Compatibility Tests**: Validate service API integration

### 9.2 Test Coverage

```
tests/
├── unit/
│   ├── service-client.test.ts      # HTTP client tests
│   ├── ask-repository.test.ts      # Tool implementation tests
│   └── server.test.ts              # MCP server tests
├── integration/
│   ├── mcp-protocol.test.ts        # MCP protocol compliance
│   └── service-integration.test.ts # Service API integration
└── mocks/
    └── service-responses.ts        # Mock service responses
```

### 9.3 Test Requirements

- **Service Mocking**: Mock Git Ask service responses
- **MCP Protocol Testing**: Validate MCP compliance
- **Error Scenario Testing**: Test all error conditions
- **Performance Testing**: Validate response times
- **Configuration Testing**: Test environment variable handling

### 9.4 MCP Inspector Testing

**MCP Inspector** is the official debugging tool for MCP servers:

- **Purpose**: Visual debugging interface for MCP protocol communication
- **Features**: Real-time tool testing, request/response inspection, timeout configuration
- **Usage**: Essential for development and troubleshooting MCP servers
- **Configuration**: Requires proper timeout settings (300+ seconds) for AI analysis tasks

**Testing Guide**: See [TESTING.md](./TESTING.md) for detailed MCP Inspector setup and usage instructions.

## 10. Performance Considerations

### 10.1 Response Time Targets

- **MCP Tool Call Overhead**: < 100ms
- **Service Request Time**: Inherited from Git Ask service (12-21 seconds)
- **Total Response Time**: Service time + minimal MCP overhead

### 10.2 Optimization Strategies

- **Connection Pooling**: Reuse HTTP connections to service
- **Request Caching**: Cache identical requests (future enhancement)
- **Async Processing**: Non-blocking I/O for service calls
- **Memory Management**: Efficient object creation and cleanup

### 10.3 Scalability

- **Stateless Design**: No server-side state management
- **Concurrent Requests**: Support multiple simultaneous requests
- **Service Dependency**: Scalability limited by Git Ask service capacity
- **Resource Usage**: Minimal memory footprint for MCP server

## 11. Security Considerations

### 11.1 Input Validation

- **URL Validation**: Validate Git repository URLs (GitHub, GitLab, etc.)
- **Parameter Sanitization**: Sanitize all user inputs
- **Schema Validation**: Use Zod for strict type checking
- **Injection Prevention**: Prevent command injection attacks

### 11.2 Network Security

- **HTTP vs HTTPS**: Support both protocols for service communication
- **Request Timeout**: Prevent resource exhaustion
- **Rate Limiting**: Rely on service-side rate limiting
- **Error Information**: Avoid exposing sensitive information

### 11.3 Dependency Security

- **Minimal Dependencies**: Reduce attack surface
- **Regular Updates**: Keep dependencies updated
- **Vulnerability Scanning**: Monitor for security issues
- **Official SDK**: Use only official MCP SDK

## 12. Monitoring and Observability

### 12.1 Logging Strategy

- **Startup Logging**: Server initialization and configuration
- **Request Logging**: MCP tool calls and service requests
- **Error Logging**: Comprehensive error tracking
- **Performance Logging**: Response time monitoring

### 12.2 Health Monitoring

- **Service Connectivity**: Monitor Git Ask service availability
- **MCP Protocol Health**: Validate MCP communication
- **Resource Usage**: Monitor memory and CPU usage
- **Error Rates**: Track error frequency and types

### 12.3 Metrics Collection

- **Request Volume**: Number of tool calls per time period
- **Response Times**: Tool call latency distribution
- **Error Rates**: Success/failure ratios
- **Service Dependencies**: Git Ask service health status

## 13. Deployment Architecture

### 13.1 Client-Side Deployment

**Primary Deployment Model**: Client-side execution via npx
- **Distribution**: NPM package registry
- **Execution**: Direct execution on client machines
- **Configuration**: Environment variables and client config
- **Updates**: Automatic via npx package resolution

### 13.2 Service Dependencies

**Required Services**:
- Git Ask Service (HTTP API)
- Network connectivity to Git repositories (GitHub, GitLab, etc.)
- Node.js runtime environment (18+)

**Optional Services**:
- Logging aggregation systems
- Monitoring and metrics collection
- Configuration management systems

### 13.3 Container Support (Future)

```dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY dist/ ./dist/
EXPOSE 3000

CMD ["node", "dist/index.js"]
```

## 14. Technology Stack

### 14.1 Core Technologies

- **Language**: TypeScript 5.0+
- **Runtime**: Node.js 18+
- **MCP SDK**: @modelcontextprotocol/sdk (official)
- **Validation**: Zod for schema validation
- **HTTP Client**: Node.js fetch API
- **Transport**: stdio (primary), HTTP (future)

### 14.2 Dependencies

**Production Dependencies**:
- `@modelcontextprotocol/sdk`: Official MCP protocol implementation
- `zod`: Runtime type checking and validation

**Development Dependencies**:
- `typescript`: Type safety and compilation
- `@types/node`: Node.js type definitions

### 14.3 Rationale for Technology Choices

- **TypeScript**: Type safety and better developer experience
- **Official MCP SDK**: Guaranteed protocol compatibility
- **Minimal Dependencies**: Faster installation and reduced security surface
- **Node.js 18+**: Modern JavaScript features and performance
- **Zod**: Runtime validation with TypeScript integration

## 15. Future Enhancements

### 15.1 Protocol Extensions

- **Resource Support**: Expose repository metadata as MCP resources
- **Prompt Templates**: Pre-defined analysis prompts
- **Streaming Responses**: Real-time analysis updates
- **Batch Operations**: Multiple repository analysis

### 15.2 Advanced Features

- **Request Caching**: Cache analysis results
- **Authentication**: Support for private repositories
- **Rate Limiting**: Client-side request throttling
- **Configuration UI**: Web-based configuration management

### 15.3 Integration Enhancements

- **Multiple Services**: Support for different analysis backends
- **Plugin Architecture**: Extensible tool system
- **Webhook Support**: Real-time repository updates
- **Analytics**: Usage tracking and optimization

## 16. Quality Assurance

### 16.1 Code Quality

- **TypeScript Strict Mode**: Enforce type safety
- **ESLint Configuration**: Code style and best practices
- **Prettier Integration**: Consistent code formatting
- **Pre-commit Hooks**: Automated quality checks

### 16.2 Testing Requirements

- **Unit Test Coverage**: > 90% statement coverage
- **Integration Testing**: Full MCP protocol compliance
- **Performance Testing**: Response time validation
- **Compatibility Testing**: Multiple Node.js versions

### 16.3 Documentation Standards

- **API Documentation**: Comprehensive tool documentation
- **Usage Examples**: Real-world usage scenarios
- **Troubleshooting Guide**: Common issues and solutions
- **Configuration Reference**: Complete configuration options

## 17. Implementation Status

### 17.1 Core Implementation

- **MCP Server Framework**: Complete implementation with official SDK
- **Service Client**: HTTP client with error handling and timeouts
- **Tool Implementation**: ask-repository tool with full functionality
- **Configuration Management**: Environment-based configuration
- **Error Handling**: Comprehensive error management
- **TypeScript Setup**: Complete type safety implementation

### 17.2 Package Distribution

- **NPM Configuration**: Complete package.json with proper metadata
- **Build System**: TypeScript compilation with proper output
- **Binary Configuration**: Executable with shebang support
- **Documentation**: README with installation and usage instructions
- **Licensing**: MIT license for open source distribution

### 17.3 Testing Infrastructure

- **Test Framework**: Jest configuration for unit and integration tests
- **Mock Services**: Comprehensive mocking for service responses
- **CI/CD Ready**: GitHub Actions compatible configuration
- **Coverage Reporting**: Automated test coverage reporting
- **MCP Inspector Integration**: Complete testing guide with MCP Inspector setup
- **Debugging Tools**: Inspector configuration and timeout handling
- **Real-world Testing**: Service integration testing with actual Git Ask service

## 18. Maintenance and Support

### 18.1 Version Management

- **Semantic Versioning**: Proper version numbering scheme
- **Release Notes**: Comprehensive change documentation
- **Migration Guides**: Upgrade instructions for breaking changes
- **Deprecation Policy**: Clear deprecation timelines

### 18.2 Community Support

- **Issue Tracking**: GitHub issues for bug reports and features
- **Documentation**: Comprehensive usage and troubleshooting guides
- **Testing Guide**: Complete MCP Inspector testing documentation (TESTING.md)
- **Examples**: Real-world usage examples and tutorials
- **Debugging Support**: MCP Inspector configuration and timeout troubleshooting
- **Community Guidelines**: Clear contribution and support policies

### 18.3 Long-term Sustainability

- **Dependency Management**: Regular dependency updates
- **Security Monitoring**: Automated vulnerability scanning
- **Performance Monitoring**: Continuous performance optimization
- **Compatibility Maintenance**: Support for MCP protocol updates

This architecture provides a robust foundation for the Git Ask MCP Server, ensuring seamless integration between MCP clients and the existing Git Ask service while maintaining high performance, reliability, and ease of use. The design emphasizes simplicity, maintainability, and adherence to MCP protocol standards. 