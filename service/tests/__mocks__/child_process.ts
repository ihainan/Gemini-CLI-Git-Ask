/**
 * Mock implementation of child_process
 */

import { EventEmitter } from 'events';

export interface MockChildProcess extends EventEmitter {
  stdout: EventEmitter;
  stderr: EventEmitter;
  stdin: {
    write: jest.Mock;
    end: jest.Mock;
  };
  kill: jest.Mock;
  pid: number;
  killed: boolean;
}

export interface MockExecResult {
  stdout: string;
  stderr: string;
  error?: Error;
}

class MockChildProcessEmitter extends EventEmitter implements MockChildProcess {
  stdout = new EventEmitter();
  stderr = new EventEmitter();
  stdin = {
    write: jest.fn(),
    end: jest.fn()
  };
  kill = jest.fn().mockImplementation((signal?: string) => {
    this.killed = true;
    return true;
  });
  pid = Math.floor(Math.random() * 10000) + 1000; // Ensure it's not 0
  killed = false;

  constructor(private result: MockExecResult) {
    super();
  }

  simulateExecution(): void {
    // Simulate async execution
    setTimeout(() => {
      // Always emit stdout and stderr data, even if empty
      this.stdout.emit('data', Buffer.from(this.result.stdout || ''));
      
      if (this.result.stderr) {
        this.stderr.emit('data', Buffer.from(this.result.stderr));
      }
      
      if (this.result.error) {
        this.emit('error', this.result.error);
      } else {
        this.emit('close', 0);
      }
    }, 10);
  }

  // Add kill implementation to track killed state
  killProcess(signal?: string): boolean {
    this.killed = true;
    this.kill(signal);
    return true;
  }
}

// Mock data storage
const mockExecResults = new Map<string, MockExecResult>();

// Set mock result for specific command
export function setMockExecResult(command: string, result: MockExecResult): void {
  mockExecResults.set(command, result);
}

// Clear all mock results
export function clearMockExecResults(): void {
  mockExecResults.clear();
}

// Mock spawn function
export const spawn = jest.fn().mockImplementation((command: string, args: string[] = []) => {
  const fullCommand = `${command} ${args.join(' ')}`.trim();
  
  console.log('Mock spawn called with:', fullCommand);
  
  // Try exact match first
  let result = mockExecResults.get(fullCommand);
  
  // Try pattern matching for common scenarios
  if (!result) {
    for (const [pattern, mockResult] of mockExecResults.entries()) {
      console.log('Checking pattern:', pattern, 'against:', fullCommand);
      if (fullCommand.includes('--version') && pattern.includes('--version')) {
        result = mockResult;
        console.log('Found matching pattern:', pattern);
        break;
      }
    }
  }
  
  // Default result
  if (!result) {
    result = {
      stdout: 'Mock command executed successfully',
      stderr: ''
    };
    console.log('Using default result');
  } else {
    console.log('Using result:', result);
  }

  const mockProcess = new MockChildProcessEmitter(result);
  
  console.log('Created mock process with pid:', mockProcess.pid);
  
  // Start simulation after next tick
  process.nextTick(() => {
    mockProcess.simulateExecution();
  });

  return mockProcess;
});

// Mock exec function
export const exec = jest.fn().mockImplementation((command: string, callback?: Function) => {
  const result = mockExecResults.get(command) || {
    stdout: 'Mock command executed successfully',
    stderr: ''
  };

  if (callback) {
    setTimeout(() => {
      callback(result.error || null, result.stdout, result.stderr);
    }, 10);
  }

  return new MockChildProcessEmitter(result);
});

// Mock execSync function
export const execSync = jest.fn().mockImplementation((command: string) => {
  const result = mockExecResults.get(command) || {
    stdout: 'Mock command executed successfully',
    stderr: ''
  };

  if (result.error) {
    throw result.error;
  }

  return result.stdout;
});

// Set default mock results for common commands
setMockExecResult('gemini --version', {
  stdout: 'gemini version 1.0.0',
  stderr: ''
});

// Also keep the old one for backward compatibility
setMockExecResult('gemini-cli --version', {
  stdout: 'gemini-cli version 1.0.0',
  stderr: ''
});

setMockExecResult('git --version', {
  stdout: 'git version 2.34.1',
  stderr: ''
});

// Common Gemini CLI ask command mock results - updated to use new format
setMockExecResult('echo "You are a code analysis assistant.\n\nQuestion: What does this code do?" | gemini --model gemini-2.5-flash --all_files', {
  stdout: 'This is a test repository that demonstrates basic functionality.',
  stderr: ''
});

// Mock successful JSON response
setMockExecResult('echo "You are a code analysis assistant.\n\nQuestion: What is the main purpose of this code?" | gemini --model gemini-2.5-flash --all_files', {
  stdout: '{"answer": "This code implements a web server with REST API endpoints.", "tokens_used": 150}',
  stderr: ''
});

// Mock commands without all_files flag
setMockExecResult('echo "You are a code analysis assistant.\n\nQuestion: What does this code do?" | gemini --model gemini-2.5-flash', {
  stdout: 'This code demonstrates basic functionality (analyzed without full context).',
  stderr: ''
});

// Mock error scenarios
setMockExecResult('echo "Test prompt" | gemini --model invalid-model', {
  stdout: '',
  stderr: 'Error: Invalid model specified: invalid-model',
  error: new Error('Command failed with exit code 1')
});

setMockExecResult('echo "Test prompt" | gemini --model gemini-2.5-flash', {
  stdout: '',
  stderr: 'Error: Repository directory not found: /nonexistent/path',
  error: new Error('Command failed with exit code 1')
});

// Mock API timeout/rate limiting
setMockExecResult('echo "Rate limit test" | gemini --model gemini-2.5-flash', {
  stdout: '',
  stderr: 'Error: API rate limit exceeded. Please try again later.',
  error: new Error('Command failed with exit code 429')
}); 