import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { 
  ListToolsRequestSchema, 
  CallToolRequestSchema,
  CallToolResult,
  TextContent
} from '@modelcontextprotocol/sdk/types.js';
import { createAskRepositoryTool, handleAskRepositoryTool } from './tools/ask-repository.js';

interface ServerConfig {
  serviceUrl: string;
  requestTimeout: number;
  logLevel: string;
}

function getConfig(): ServerConfig {
  const serviceUrl = process.env.SERVICE_URL || process.env.GIT_ASK_SERVICE_URL || 'http://localhost:8080';
  const requestTimeout = parseInt(process.env.REQUEST_TIMEOUT || '300', 10);
  const logLevel = process.env.LOG_LEVEL || 'info';

  // Validate service URL
  try {
    new URL(serviceUrl);
  } catch (error) {
    console.error(`Invalid SERVICE_URL: ${serviceUrl}`);
    throw new Error(`Invalid service URL configuration: ${serviceUrl}`);
  }

  // Validate timeout
  if (isNaN(requestTimeout) || requestTimeout <= 0) {
    console.warn(`Invalid REQUEST_TIMEOUT: ${process.env.REQUEST_TIMEOUT}, using default 300`);
  }

  // Validate log level
  const validLogLevels = ['debug', 'info', 'warn', 'error'];
  if (!validLogLevels.includes(logLevel)) {
    console.warn(`Invalid LOG_LEVEL: ${logLevel}, using default 'info'`);
  }

  console.error(`Git Ask MCP Server Configuration:`);
  console.error(`  Service URL: ${serviceUrl}`);
  console.error(`  Request Timeout: ${requestTimeout}s`);
  console.error(`  Log Level: ${logLevel}`);

  return {
    serviceUrl,
    requestTimeout: isNaN(requestTimeout) || requestTimeout <= 0 ? 300 : requestTimeout,
    logLevel: validLogLevels.includes(logLevel) ? logLevel : 'info'
  };
}

export function createServer(): Server {
  const config = getConfig();
  const server = new Server({
    name: 'git-ask-mcp-server',
    version: '1.0.0',
  });

  // Register tools
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: [createAskRepositoryTool()]
    };
  });

  // Handle tool calls
  server.setRequestHandler(CallToolRequestSchema, async (request): Promise<CallToolResult> => {
    const { name, arguments: args } = request.params;

    try {
      switch (name) {
        case 'ask-repository':
          return await handleAskRepositoryTool(args, config);
        
        default:
          return {
            content: [{
              type: 'text',
              text: `Unknown tool: ${name}`
            } as TextContent],
            isError: true
          };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error(`Tool execution error for ${name}:`, error);
      
      return {
        content: [{
          type: 'text',
          text: `Error executing tool ${name}: ${errorMessage}`
        } as TextContent],
        isError: true
      };
    }
  });

  return server;
} 