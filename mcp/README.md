# Git Ask MCP Server

A Model Context Protocol (MCP) server that provides AI-powered code analysis for Git repositories.

## Overview

This MCP server acts as an adapter layer between MCP clients (like Claude Desktop or VS Code) and the Git Ask service, enabling seamless repository analysis through natural language queries.

## Features

- **Repository Analysis**: Ask questions about any Git repository (GitHub, GitLab, etc.)
- **MCP Protocol Compliance**: Full compatibility with MCP-enabled clients
- **Easy Installation**: One-command setup via npx
- **TypeScript Support**: Built with TypeScript for reliability

## Installation

### Quick Start (Recommended)

```bash
npx -y git-ask-mcp-server
```

### Global Installation

```bash
npm install -g git-ask-mcp-server
git-ask-mcp-server
```

## Configuration

### Claude Desktop

Add to your Claude Desktop configuration:

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

### Environment Variables

- `SERVICE_URL`: Git Ask service endpoint (default: http://localhost:8080)
- `REQUEST_TIMEOUT`: HTTP request timeout in seconds (default: 300)
- `LOG_LEVEL`: Logging level (default: info)

## Usage

Once configured with your MCP client, you can use the `ask-repository` tool:

- **Repository URL**: Git repository URL supporting multiple formats:
  - GitHub HTTPS: `https://github.com/owner/repo`
  - GitHub HTTPS with .git: `https://github.com/owner/repo.git`  
  - GitHub SSH: `git@github.com:owner/repo.git`
  - Other Git repositories: `https://gitlab.com/owner/repo.git`
- **Question**: Your question about the repository
- **Branch**: Optional branch to analyze (default: main/master)

## Development

### Setup

```bash
git clone https://github.com/ihainan/Gemini-CLI-Git-Ask.git
cd Gemini-CLI-Git-Ask/mcp
npm install
```

### Build

```bash
npm run build
```

### Development Mode

```bash
npm run dev
```

## Requirements

- Node.js 18 or higher
- Git Ask service running locally or remotely

## License

MIT License - see LICENSE file for details. 