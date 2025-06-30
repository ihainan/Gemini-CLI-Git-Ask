# Git Ask via Gemini CLI

A code analysis tool that enables natural language queries about Git repositories using Google's Gemini CLI.

## Overview

Git Ask via Gemini CLI is a solution built on top of [Google's Gemini CLI](https://github.com/google-gemini/gemini-cli) that provides code analysis capabilities for Git repositories. The project includes two main components:

- **RESTful API Service**: A Node.js service that processes repository analysis requests
- **MCP Server**: A Model Context Protocol server that integrates with MCP-compatible clients like Cursor、Claude Desktop and VS Code

This platform allows developers to ask natural language questions about codebases and receive AI-assisted insights about architecture, functionality, dependencies, and best practices.

## Live Demo

Try our live demo at: **https://gemini-demo.ihainan.me/**

## Quick Start

### Deploy Service (Docker)

1. **Configure Gemini CLI authentication** (on host machine):
   ```bash
   # Install Gemini CLI on host machine
   npm install -g @google/gemini-cli
   
   # Authenticate using OAuth
   gemini
   # Then use the /auth command in the CLI
   # This will generate ~/.gemini/oauth_creds.json file
   ```

2. **Clone the repository**:
   ```bash
   git clone https://github.com/ihainan/Gemini-CLI-Git-Ask.git
   cd Gemini-CLI-Git-Ask
   ```

3. **Configure the service**:
   ```bash
   cd service
   cp config.yaml.example config.yaml
   # (Optional) Edit config.yaml with your configuration
   ```

4. **Start the service**:
   ```bash
   cd ../docker
   docker-compose up -d
   ```

   The service will be available at `http://<your_IP_address>:18080`

### Deploy MCP Server (NPX)

```bash
# Quick start with default configuration
env SERVICE_URL=http://<your_IP_address>:18080 npx -y git-ask-mcp-server
```

For Claude Desktop integration, add to your configuration:
```json
{
  "mcpServers": {
    "git-ask": {
      "command": "npx",
      "args": ["-y", "git-ask-mcp-server"],
      "env": {
        "SERVICE_URL": "http://<your_IP_address>:18080"
      }
    }
  }
}
```

## RESTful API

The service provides a RESTful API for repository analysis with the following endpoints:

### POST /api/v1/ask

Ask questions about any Git repository.

**Request Body**:
```json
{
  "repository_url": "https://github.com/owner/repo",
  "question": "How does the authentication system work?",
  "branch": "main",
  "timeout": 300
}
```

**Response**:
```json
{
  "status": "success",
  "answer": "The authentication system uses JWT tokens...",
  "repository": {
    "url": "https://github.com/owner/repo",
    "branch": "main",
    "commit_hash": "abc123..."
  },
  "execution_time": 15420
}
```

**cURL Example**:
```bash
curl -X POST http://localhost:18080/api/v1/ask \
  -H "Content-Type: application/json" \
  -d '{
    "repository_url": "https://github.com/microsoft/vscode",
    "question": "How does the extension loading mechanism work?",
    "branch": "main"
  }'
```

**Supported Repository Formats**:
- Git/GitHub HTTPS: `https://github.com/owner/repo` or `https://github.com/owner/repo.git`
- Git/GitHub SSH: `git@github.com:owner/repo.git`

### GET /api/v1/stats

Get repository storage statistics and service metrics.

### GET /api/v1/gemini/health

Check Gemini CLI availability and version information.

## MCP Tool

The MCP Server provides the `ask-repository` tool for integration with MCP clients.

### ask-repository Tool

**Parameters**:
- `repository_url` (required): Git repository URL (GitHub, GitLab, or Bitbucket)
- `question` (required): Your question about the repository
- `branch` (optional): Specific branch to analyze (default: main/master)

**Example Usage in Claude Desktop**:
```
Repository URL: https://github.com/microsoft/vscode
Question: Explain the extension loading mechanism and how plugins are initialized
Branch: main
```

## Configuration

### Service Configuration

The service is configured through `config.yaml` file:
```yaml
server:
  host: "0.0.0.0"
  port: 8080
  max_concurrent_requests: 100

gemini:
  model: "gemini-2.5-flash"
  api_timeout: 300
  all_files_mode: "auto"
  auto_all_files_thresholds:
    max_files: 5
    max_size_mb: 1

repository:
  storage_path: "./repositories"
  clone_method: "https"
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

**Key Configuration Parameters**:

**Server Configuration**:
- `max_concurrent_requests`: Maximum number of simultaneous API requests (default: 100)
- `host` / `port`: Service binding address and port

**Gemini Configuration**:
- `model`: Gemini model to use (recommended: `gemini-2.5-flash` for balance of speed and quality)
- `api_timeout`: Timeout for Gemini CLI operations in seconds (default: 300)
- `all_files_mode`: Controls when to pass all repository files to Gemini:
  - `"always"`: Always include all files (slower but more comprehensive)
  - `"never"`: Let Gemini CLI decide which files to analyze (faster)
  - `"auto"`: Automatically decide based on repository size (recommended)
- `auto_all_files_thresholds`: When `all_files_mode` is "auto":
  - `max_files`: Use all files if repository has fewer than this many files (default: 5)
  - `max_size_mb`: Use all files if total repository size is smaller than this (default: 1MB)

**Repository Management**:
- `storage_path`: Local directory to store cloned repositories
- `clone_method`: Use "https" or "ssh" for cloning repositories
- `clone_depth`: Git clone depth (1 for shallow clone to save space)
- `update_threshold_hours`: Hours before re-fetching repository updates (default: 24)
- `access_timeout_hours`: Hours before removing unused repositories (default: 72)
- `max_concurrent_operations`: Maximum simultaneous git operations (default: 10)

**Cleanup Configuration**:
- `enabled`: Enable automatic cleanup of old repositories and logs
- `interval_hours`: How often to run cleanup (default: 24 hours)
- `retention_days`: Days to keep repository data (default: 7)
- `max_storage_gb`: Maximum total storage usage before forced cleanup (default: 50GB)

**Logging**:
- `level`: Log level (DEBUG, INFO, WARN, ERROR)
- `file`: Log file path
- `max_size_mb`: Maximum log file size before rotation (default: 100MB)
- `backup_count`: Number of rotated log files to keep (default: 5)

### MCP Server Configuration

The MCP Server accepts the following environment variables:

- `SERVICE_URL`: Git Ask service endpoint (required)
- `REQUEST_TIMEOUT`: HTTP request timeout in seconds (default: 300)
- `LOG_LEVEL`: Logging level - info, debug, error, warn (default: info)

## Development

### Prerequisites

- Node.js 18 or higher
- Docker and Docker Compose
- Gemini CLI installed and authenticated (see deployment steps above)
- Git

### Service Development

```bash
# Clone and setup
git clone https://github.com/ihainan/Gemini-CLI-Git-Ask.git
cd Gemini-CLI-Git-Ask

# Setup service
cd service
npm install

# Copy and configure settings
cp config.yaml.example config.yaml
# Edit config.yaml with your settings

# Development mode with hot reload
npm run dev

# Build for production
npm run build

# Run tests
npm test

# Run tests with coverage
npm run test:coverage
```

### MCP Server Development

```bash
# From project root
cd mcp

# Install dependencies
npm install

# Development build with watch mode
npm run dev

# Production build
npm run build

# Test the MCP server
node dist/index.js
```

### Docker Development

```bash
# From project root
# Configure service settings
cd service
cp config.yaml.example config.yaml
# Edit config.yaml with your settings

# Start development environment
cd ../docker
docker-compose -f docker-compose-dev.yaml up -d

# View logs
docker-compose logs -f
```

### Project Structure

```
├── service/                    # RESTful API Service
│   ├── src/                   # Source code
│   ├── tests/                 # Test files
│   ├── config.yaml           # Service configuration
│   ├── Dockerfile            # Docker configuration
│   └── package.json          # Node.js dependencies
├── mcp/                      # MCP Server
│   ├── src/                  # MCP server source
│   ├── dist/                 # Compiled output
│   └── package.json          # NPM package configuration
├── docker/                   # Docker deployment
│   ├── docker-compose.yml    # Production compose
│   └── docker-compose-dev.yaml # Development compose
└── README.md                 # This file
```

## Additional Resources

### Architecture Documentation

For developers interested in the detailed internal architecture and design decisions:

- **[Service Architecture Design](service/design.md)**: Comprehensive documentation of the RESTful API service architecture, including system design, repository management, Gemini CLI integration, and deployment strategies
- **[MCP Server Architecture Design](mcp/design.md)**: Detailed design documentation for the Model Context Protocol server implementation, including MCP protocol compliance, tool definitions, and client integration

### Development History

This project was developed using **Cursor** with AI-assisted "Vibe Coding". The development conversation history, including key prompts, design decisions, and iterative improvements, is available in the [`chat_history/`](chat_history/) directory. These conversations provide insights into the AI-assisted development process and can be valuable for developers interested in similar approaches.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details. 