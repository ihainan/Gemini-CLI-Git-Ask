/**
 * Global setup for real integration tests
 */

import * as path from 'path';
import * as fs from 'fs/promises';
import { execSync } from 'child_process';

export default async function globalSetup() {
  console.log('🌍 Global setup for real integration tests...');
  
  // Check if real integration tests are enabled
  if (process.env.REAL_INTEGRATION_ENABLED !== 'true') {
    console.log('⚠️  Real integration tests are disabled. Skipping global setup.');
    return;
  }
  
  try {
    // Check if Gemini CLI is installed
    const geminiVersion = execSync('gemini --version', { encoding: 'utf8' });
    console.log(`✅ Gemini CLI found: ${geminiVersion.trim()}`);
  } catch (error) {
    console.error('❌ Gemini CLI not found. Please install it:');
    console.error('   npm install -g @google/gemini-cli');
    throw new Error('Gemini CLI not installed');
  }
  
  try {
    // Check if Git is installed
    const gitVersion = execSync('git --version', { encoding: 'utf8' });
    console.log(`✅ Git found: ${gitVersion.trim()}`);
  } catch (error) {
    console.error('❌ Git not found. Please install Git.');
    throw new Error('Git not installed');
  }
  
  // Create base temporary directory
  const baseDir = path.join(__dirname, '../tmp');
  await fs.mkdir(baseDir, { recursive: true });
  
  console.log('✅ Global setup completed');
} 