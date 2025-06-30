import { z } from 'zod';

// Request and response schemas
export const ServiceRequestSchema = z.object({
  repository_url: z.string().url(),
  question: z.string(),
  branch: z.string().nullable().optional(),
  timeout: z.number().optional()
});

export const ServiceResponseSchema = z.object({
  status: z.enum(['success', 'error']),
  answer: z.string().optional(),
  repository: z.object({
    url: z.string(),
    branch: z.string(),
    commit_hash: z.string()
  }).optional(),
  execution_time: z.number().optional(),
  error_code: z.string().optional(),
  message: z.string().optional()
});

export type ServiceRequest = z.infer<typeof ServiceRequestSchema>;
export type ServiceResponse = z.infer<typeof ServiceResponseSchema>;

export interface ServiceClientConfig {
  serviceUrl: string;
  requestTimeout: number;
}

export class ServiceClient {
  private config: ServiceClientConfig;

  constructor(config: ServiceClientConfig) {
    this.config = config;
  }

  async askRepository(request: ServiceRequest): Promise<ServiceResponse> {
    // Validate request
    const validatedRequest = ServiceRequestSchema.parse(request);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, this.config.requestTimeout * 1000);

    try {
      const response = await fetch(`${this.config.serviceUrl}/api/v1/ask`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'git-ask-mcp-server/1.0.0'
        },
        body: JSON.stringify(validatedRequest),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      
      // Validate response
      return ServiceResponseSchema.parse(data);
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(`Request timeout after ${this.config.requestTimeout} seconds`);
      }
      
      if (error instanceof z.ZodError) {
        throw new Error(`Invalid service response: ${error.message}`);
      }
      
      if (error instanceof Error) {
        throw error;
      }
      
      throw new Error(`Unknown error: ${String(error)}`);
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(`${this.config.serviceUrl}/health`, {
        method: 'GET',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      return response.ok;
    } catch {
      return false;
    }
  }
} 