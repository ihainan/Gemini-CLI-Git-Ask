import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

interface Config {
  server: {
    host: string;
    port: number;
    max_concurrent_requests: number;
  };
  gemini: {
    model: string;
    temperature: number;
    top_p: number;
    top_k: number;
    max_output_tokens: number;
    api_timeout: number;
    base_prompt: string;
  };
  repository: {
    storage_path: string;
    clone_method: string;
    clone_depth: number;
    update_threshold_hours: number;
    access_timeout_hours: number;
    max_concurrent_operations: number;
    default_branch: string;
  };
  cleanup: {
    enabled: boolean;
    interval_hours: number;
    retention_days: number;
    max_storage_gb: number;
    cleanup_on_startup: boolean;
  };
  logging: {
    level: string;
    file: string;
    max_size_mb: number;
    backup_count: number;
    console_output: boolean;
  };
  security: {
    request_timeout: number;
    max_request_size: string;
    rate_limit: {
      enabled: boolean;
      max_requests: number;
      window_minutes: number;
    };
  };
  monitoring: {
    health_check_interval: number;
    metrics_enabled: boolean;
    performance_logging: boolean;
  };
}

export class ConfigManager {
  private static instance: ConfigManager;
  private config: Config | null = null;
  private configPath: string;

  private constructor() {
    this.configPath = path.join(process.cwd(), 'config.yaml');
  }

  public static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
    }
    return ConfigManager.instance;
  }

  public async load(): Promise<void> {
    try {
      if (!fs.existsSync(this.configPath)) {
        throw new Error(`Configuration file not found: ${this.configPath}`);
      }

      const fileContents = fs.readFileSync(this.configPath, 'utf8');
      this.config = yaml.load(fileContents) as Config;
      
      // Validate configuration
      this.validate();
      
    } catch (error) {
      throw new Error(`Failed to load configuration: ${error}`);
    }
  }

  public get<T = any>(path: string): T {
    if (!this.config) {
      throw new Error('Configuration not loaded. Call load() first.');
    }

    const keys = path.split('.');
    let value: any = this.config;

    for (const key of keys) {
      if (value && typeof value === 'object' && key in value) {
        value = value[key];
      } else {
        throw new Error(`Configuration path not found: ${path}`);
      }
    }

    return value as T;
  }

  public getAll(): Config {
    if (!this.config) {
      throw new Error('Configuration not loaded. Call load() first.');
    }
    return this.config;
  }

  private validate(): void {
    if (!this.config) {
      throw new Error('Configuration is empty');
    }

    // Basic validation
    if (!this.config.server?.port || this.config.server.port < 1 || this.config.server.port > 65535) {
      throw new Error('Invalid server port configuration');
    }

    if (!this.config.gemini?.model) {
      throw new Error('Gemini model not specified');
    }

    if (!this.config.repository?.storage_path) {
      throw new Error('Repository storage path not specified');
    }
  }
} 