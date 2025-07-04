/**
 * Real Integration Tests Setup
 * No mocks - uses real services and APIs
 */

// Restore real modules to ensure no interference from unit test mocks
jest.doMock('simple-git', () => jest.requireActual('simple-git'));
jest.doMock('child_process', () => jest.requireActual('child_process'));
jest.doMock('fs', () => jest.requireActual('fs'));

import * as path from 'path';
import * as fs from 'fs/promises';

// Environment variables for real integration tests
const REQUIRED_ENV_VARS = [
  'REAL_INTEGRATION_ENABLED'
];

const OPTIONAL_ENV_VARS = [
  'GEMINI_MODEL',
  'TEST_TIMEOUT',
  'REAL_INTEGRATION_CLEANUP'
];

// Check if real integration tests are enabled
const isRealIntegrationEnabled = () => {
  return process.env.REAL_INTEGRATION_ENABLED === 'true';
};

// Check if required environment variables are set
const checkEnvironmentVariables = () => {
  const missingVars = REQUIRED_ENV_VARS.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.error('❌ Missing required environment variables for real integration tests:');
    missingVars.forEach(varName => {
      console.error(`   - ${varName}`);
    });
    console.error('\nTo run real integration tests, set this environment variable:');
    console.error('export REAL_INTEGRATION_ENABLED=true');
    console.error('\nOptional environment variables:');
    console.error('export GEMINI_MODEL="gemini-2.5-flash"');
    console.error('export TEST_TIMEOUT="60000"');
    console.error('export REAL_INTEGRATION_CLEANUP="true"');
    
    throw new Error('Missing required environment variables for real integration tests');
  }
};

// Global setup for real integration tests
beforeAll(async () => {
  console.log('🚀 Starting real integration tests setup...');
  
  // Check if real integration tests are enabled
  if (!isRealIntegrationEnabled()) {
    console.log('⚠️  Real integration tests are disabled. Set REAL_INTEGRATION_ENABLED=true to enable.');
    console.log('   Skipping real integration tests...');
    return;
  }
  
  // Check required environment variables
  checkEnvironmentVariables();
  
  // Create temporary directory for real integration tests
  const tempDir = path.join(__dirname, '../tmp/real-integration');
  await fs.mkdir(tempDir, { recursive: true });
  
  // Set global test configuration
  (global as any).REAL_INTEGRATION_CONFIG = {
    tempDir,
    geminiModel: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
    testTimeout: parseInt(process.env.TEST_TIMEOUT || '60000', 10),
    cleanupAfterTests: process.env.REAL_INTEGRATION_CLEANUP === 'true'
  };
  
  console.log('✅ Real integration tests setup completed');
  console.log(`   - Temp directory: ${tempDir}`);
  console.log(`   - Gemini model: ${(global as any).REAL_INTEGRATION_CONFIG.geminiModel}`);
  console.log(`   - Test timeout: ${(global as any).REAL_INTEGRATION_CONFIG.testTimeout}ms`);
  console.log(`   - Cleanup after tests: ${(global as any).REAL_INTEGRATION_CONFIG.cleanupAfterTests}`);
});

// Global teardown for real integration tests
afterAll(async () => {
  if (!isRealIntegrationEnabled()) {
    return;
  }
  
  console.log('🧹 Cleaning up real integration tests...');
  
  // Clean up temporary directory if enabled
  if ((global as any).REAL_INTEGRATION_CONFIG?.cleanupAfterTests) {
    try {
      const tempDir = (global as any).REAL_INTEGRATION_CONFIG.tempDir;
      await fs.rm(tempDir, { recursive: true, force: true });
      console.log(`✅ Cleaned up temporary directory: ${tempDir}`);
    } catch (error) {
      console.warn('⚠️  Failed to clean up temporary directory:', error);
    }
  }
  
  console.log('✅ Real integration tests cleanup completed');
});

// Skip tests if real integration is not enabled
const skipIfNotEnabled = () => {
  if (!isRealIntegrationEnabled()) {
    console.log('⚠️  Skipping real integration test - REAL_INTEGRATION_ENABLED=false');
    return true;
  }
  return false;
};

// Export utilities for use in tests
export { isRealIntegrationEnabled, skipIfNotEnabled }; 