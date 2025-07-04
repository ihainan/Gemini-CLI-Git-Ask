/**
 * Mock implementation of ConfigManager
 */

class MockConfigManager {
  constructor() {
    this.config = {
      server: {
        host: '0.0.0.0',
        port: 8080,
        max_concurrent_requests: 100
      },
      gemini: {
        model: 'gemini-2.5-flash',
        api_timeout: 300,
        all_files_mode: 'auto',
        auto_all_files_thresholds: {
          max_files: 200,
          max_size_mb: 10
        },
        base_prompt: 'You are a code analysis assistant.'
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
        request_timeout: 30000,
        max_request_size: '10mb',
        rate_limit: {
          enabled: false,
          max_requests: 100,
          window_minutes: 15
        }
      },
      monitoring: {
        health_check_interval: 30,
        metrics_enabled: false,
        performance_logging: false
      }
    };
  }

  static getInstance() {
    if (!MockConfigManager.instance) {
      MockConfigManager.instance = new MockConfigManager();
    }
    return MockConfigManager.instance;
  }

  async load() {
    // Mock implementation - do nothing
    return Promise.resolve();
  }

  get(path) {
    const keys = path.split('.');
    let value = this.config;

    for (const key of keys) {
      if (value && typeof value === 'object' && key in value) {
        value = value[key];
      } else {
        throw new Error(`Configuration path not found: ${path}`);
      }
    }

    return value;
  }

  getAll() {
    return this.config;
  }

  setMockConfig(path, value) {
    const keys = path.split('.');
    let target = this.config;

    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (key && (!target[key] || typeof target[key] !== 'object')) {
        target[key] = {};
      }
      if (key) {
        target = target[key];
      }
    }

    const lastKey = keys[keys.length - 1];
    if (lastKey) {
      target[lastKey] = value;
    }
  }
}

// CommonJS exports
module.exports = {
  MockConfigManager,
  ConfigManager: {
    getInstance: () => MockConfigManager.getInstance()
  }
}; 