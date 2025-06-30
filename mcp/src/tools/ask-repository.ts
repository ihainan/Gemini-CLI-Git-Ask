import { z } from 'zod';
import { Tool, CallToolResult, TextContent } from '@modelcontextprotocol/sdk/types.js';
import { ServiceClient, ServiceRequest } from '../client/service-client.js';

// Tool argument schema
const AskRepositoryArgsSchema = z.object({
  repository_url: z.string().url('Must be a valid Git repository URL'),
  question: z.string().min(1, 'Question cannot be empty'),
  branch: z.string().nullable().optional()
});

export type AskRepositoryArgs = z.infer<typeof AskRepositoryArgsSchema>;

interface ServerConfig {
  serviceUrl: string;
  requestTimeout: number;
  logLevel: string;
}

export function createAskRepositoryTool(): Tool {
  return {
    name: 'ask-repository',
    description: 'Ask questions about any Git repository using AI code analysis. Supports GitHub, GitLab, and other Git hosting platforms with multiple URL formats (HTTPS, SSH, .git extensions)',
    inputSchema: {
      type: 'object',
      properties: {
        repository_url: {
          type: 'string',
          format: 'uri',
          description: 'Git repository URL. Supports multiple formats: GitHub URLs (https://github.com/owner/repo), Git URLs with .git extension (https://github.com/owner/repo.git), SSH URLs (git@github.com:owner/repo.git), and other Git repository URLs'
        },
        question: {
          type: 'string',
          description: 'Your question about the repository'
        },
        branch: {
          type: ['string', 'null'],
          description: 'Specific branch to analyze (optional, default: main/master). Can be null.'
        }
      },
      required: ['repository_url', 'question']
    }
  };
}

export async function handleAskRepositoryTool(
  args: unknown,
  config: ServerConfig
): Promise<CallToolResult> {
  try {
    // Validate arguments
    const validatedArgs = AskRepositoryArgsSchema.parse(args);
    
    // Create service client
    const serviceClient = new ServiceClient({
      serviceUrl: config.serviceUrl,
      requestTimeout: config.requestTimeout
    });

    // Prepare service request
    const serviceRequest: ServiceRequest = {
      repository_url: validatedArgs.repository_url,
      question: validatedArgs.question,
      branch: validatedArgs.branch ?? undefined,
      timeout: config.requestTimeout
    };

    // Make service call
    const response = await serviceClient.askRepository(serviceRequest);

    // Handle service response
    if (response.status === 'error') {
      return {
        content: [{
          type: 'text',
          text: `Analysis failed: ${response.message || 'Unknown error'}\n\nError Code: ${response.error_code || 'UNKNOWN'}`
        } as TextContent],
        isError: true
      };
    }

    // Format successful response
    let responseText = `## Repository Analysis\n\n`;
    
    if (response.repository) {
      responseText += `**Repository**: ${response.repository.url}\n`;
      responseText += `**Branch**: ${response.repository.branch}\n`;
      responseText += `**Commit**: ${response.repository.commit_hash}\n\n`;
    }
    
    responseText += `**Question**: ${validatedArgs.question}\n\n`;
    responseText += `**Answer**: ${response.answer || 'No answer provided'}\n`;
    
    if (response.execution_time) {
      responseText += `\n*Analysis completed in ${response.execution_time.toFixed(2)} seconds*`;
    }

    return {
      content: [{
        type: 'text',
        text: responseText
      } as TextContent],
      isError: false
    };

  } catch (error) {
    let errorMessage = 'Unknown error occurred';
    
    if (error instanceof z.ZodError) {
      const issues = error.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`);
      errorMessage = `Invalid arguments:\n${issues.join('\n')}`;
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }

    return {
      content: [{
        type: 'text',
        text: `Error: ${errorMessage}`
      } as TextContent],
      isError: true
    };
  }
} 