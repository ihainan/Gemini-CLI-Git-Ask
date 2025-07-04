/**
 * Global teardown for real integration tests
 */

import * as path from 'path';
import * as fs from 'fs/promises';

export default async function globalTeardown() {
  console.log('🌍 Global teardown for real integration tests...');
  
  // Check if real integration tests are enabled
  if (process.env.REAL_INTEGRATION_ENABLED !== 'true') {
    console.log('⚠️  Real integration tests are disabled. Skipping global teardown.');
    return;
  }
  
  try {
    // Clean up base temporary directory if it exists
    const baseDir = path.join(__dirname, '../tmp');
    await fs.rm(baseDir, { recursive: true, force: true });
    console.log(`✅ Cleaned up base temporary directory: ${baseDir}`);
  } catch (error) {
    console.warn('⚠️  Failed to clean up base temporary directory:', error);
  }
  
  console.log('✅ Global teardown completed');
} 