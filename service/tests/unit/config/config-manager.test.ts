/**
 * Unit tests for ConfigManager
 */

import { ConfigManager } from '../../../src/config/config-manager';

// Mock fs module
jest.mock('fs', () => ({
  existsSync: jest.fn(),
  readFileSync: jest.fn()
}));

// Mock path module
jest.mock('path', () => ({
  join: jest.fn((...args) => args.join('/')),
  resolve: jest.fn((...args) => args.join('/'))
}));

// Mock js-yaml module
jest.mock('js-yaml', () => ({
  load: jest.fn()
}));

describe('ConfigManager', () => {
  let configManager: ConfigManager;
  const mockFs = require('fs');
  const mockYaml = require('js-yaml');

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset singleton instance for testing
    (ConfigManager as any).instance = null;
    configManager = ConfigManager.getInstance();
  });

  describe('getInstance', () => {
    it('should return singleton instance', () => {
      const instance1 = ConfigManager.getInstance();
      const instance2 = ConfigManager.getInstance();
      
      expect(instance1).toBeInstanceOf(ConfigManager);
      expect(instance1).toBe(instance2);
    });
  });

  describe('load', () => {
    const mockConfig = {
      server: {
        host: 'localhost',
        port: 8080,
        max_concurrent_requests: 100
      },
      gemini: {
        model: 'gemini-1.5-flash',
        api_timeout: 300,
        all_files_mode: 'auto',
        auto_all_files_thresholds: {
          max_files: 200,
          max_size_mb: 10
        },
        base_prompt: 'You are a helpful assistant'
      },
      repository: {
        storage_path: './repositories',
        clone_method: 'https',
        clone_depth: 1,
        update_threshold_hours: 24,
        access_timeout_hours: 72,
        max_concurrent_operations: 10,
        default_branch: 'main'
      },
      cleanup: {
        enabled: true,
        interval_hours: 24,
        retention_days: 7,
        max_storage_gb: 50,
        cleanup_on_startup: false
      },
      logging: {
        level: 'INFO',
        file: './logs/service.log',
        max_size_mb: 100,
        backup_count: 5,
        console_output: true
      },
      security: {
        request_timeout: 30,
        max_request_size: '10mb',
        rate_limit: {
          enabled: true,
          max_requests: 100,
          window_minutes: 15
        }
      },
      monitoring: {
        health_check_interval: 30,
        metrics_enabled: true,
        performance_logging: false
      }
    };

    it('should load valid configuration successfully', async () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue('mock yaml content');
      mockYaml.load.mockReturnValue(mockConfig);

      await expect(configManager.load()).resolves.toBeUndefined();
    });

    it('should throw error when config file does not exist', async () => {
      mockFs.existsSync.mockReturnValue(false);

      await expect(configManager.load()).rejects.toThrow('Configuration file not found');
    });

    it('should throw error when YAML parsing fails', async () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue('invalid yaml');
      mockYaml.load.mockImplementation(() => {
        throw new Error('Invalid YAML');
      });

      await expect(configManager.load()).rejects.toThrow('Failed to load configuration');
    });

    it('should throw error for invalid server port', async () => {
      const invalidConfig = {
        ...mockConfig,
        server: { ...mockConfig.server, port: 0 }
      };

      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue('mock yaml content');
      mockYaml.load.mockReturnValue(invalidConfig);

      await expect(configManager.load()).rejects.toThrow('Invalid server port configuration');
    });

    it('should throw error for missing gemini model', async () => {
      const invalidConfig = {
        ...mockConfig,
        gemini: { ...mockConfig.gemini, model: '' }
      };

      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue('mock yaml content');
      mockYaml.load.mockReturnValue(invalidConfig);

      await expect(configManager.load()).rejects.toThrow('Gemini model not specified');
    });

    it('should throw error for missing repository storage path', async () => {
      const invalidConfig = {
        ...mockConfig,
        repository: { ...mockConfig.repository, storage_path: '' }
      };

      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue('mock yaml content');
      mockYaml.load.mockReturnValue(invalidConfig);

      await expect(configManager.load()).rejects.toThrow('Repository storage path not specified');
    });
  });

  describe('get', () => {
    const mockConfig = {
      server: {
        host: 'localhost',
        port: 8080,
        max_concurrent_requests: 100
      },
      gemini: {
        model: 'gemini-1.5-flash',
        api_timeout: 300,
        all_files_mode: 'auto',
        auto_all_files_thresholds: {
          max_files: 200,
          max_size_mb: 10
        },
        base_prompt: 'You are a helpful assistant'
      },
      repository: {
        storage_path: './repositories',
        clone_method: 'https',
        clone_depth: 1,
        update_threshold_hours: 24,
        access_timeout_hours: 72,
        max_concurrent_operations: 10,
        default_branch: 'main'
      },
      cleanup: {
        enabled: true,
        interval_hours: 24,
        retention_days: 7,
        max_storage_gb: 50,
        cleanup_on_startup: false
      },
      logging: {
        level: 'INFO',
        file: './logs/service.log',
        max_size_mb: 100,
        backup_count: 5,
        console_output: true
      },
      security: {
        request_timeout: 30,
        max_request_size: '10mb',
        rate_limit: {
          enabled: true,
          max_requests: 100,
          window_minutes: 15
        }
      },
      monitoring: {
        health_check_interval: 30,
        metrics_enabled: true,
        performance_logging: false
      }
    };

    beforeEach(async () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue('mock yaml content');
      mockYaml.load.mockReturnValue(mockConfig);
      await configManager.load();
    });

    it('should get nested configuration value', () => {
      expect(configManager.get('server.host')).toBe('localhost');
      expect(configManager.get('server.port')).toBe(8080);
      expect(configManager.get('gemini.model')).toBe('gemini-1.5-flash');
      expect(configManager.get('gemini.all_files_mode')).toBe('auto');
    });

    it('should get top-level configuration object', () => {
      const serverConfig = configManager.get('server');
      expect(serverConfig).toEqual({
        host: 'localhost',
        port: 8080,
        max_concurrent_requests: 100
      });
    });

    it('should throw error for non-existent path', () => {
      expect(() => configManager.get('non.existent.path'))
        .toThrow('Configuration path not found: non.existent.path');
    });

    it('should throw error when config not loaded', () => {
      const freshInstance = ConfigManager.getInstance();
      (freshInstance as any).config = null;

      expect(() => freshInstance.get('server.host'))
        .toThrow('Configuration not loaded. Call load() first.');
    });
  });

  describe('getAll', () => {
    const mockConfig = {
      server: { 
        host: 'localhost', 
        port: 8080, 
        max_concurrent_requests: 100 
      },
      gemini: { 
        model: 'gemini-1.5-flash',
        api_timeout: 300,
        all_files_mode: 'auto',
        auto_all_files_thresholds: {
          max_files: 200,
          max_size_mb: 10
        },
        base_prompt: 'You are a helpful assistant'
      },
      repository: {
        storage_path: './repositories',
        clone_method: 'https',
        clone_depth: 1,
        update_threshold_hours: 24,
        access_timeout_hours: 72,
        max_concurrent_operations: 10,
        default_branch: 'main'
      },
      cleanup: {
        enabled: true,
        interval_hours: 24,
        retention_days: 7,
        max_storage_gb: 50,
        cleanup_on_startup: false
      },
      logging: {
        level: 'INFO',
        file: './logs/service.log',
        max_size_mb: 100,
        backup_count: 5,
        console_output: true
      },
      security: {
        request_timeout: 30,
        max_request_size: '10mb',
        rate_limit: {
          enabled: true,
          max_requests: 100,
          window_minutes: 15
        }
      },
      monitoring: {
        health_check_interval: 30,
        metrics_enabled: true,
        performance_logging: false
      }
    };

    beforeEach(async () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue('mock yaml content');
      mockYaml.load.mockReturnValue(mockConfig);
      await configManager.load();
    });

    it('should return complete configuration object', () => {
      const config = configManager.getAll();
      expect(config).toEqual(mockConfig);
    });

    it('should throw error when config not loaded', () => {
      const freshInstance = ConfigManager.getInstance();
      (freshInstance as any).config = null;

      expect(() => freshInstance.getAll())
        .toThrow('Configuration not loaded. Call load() first.');
    });
  });
}); 