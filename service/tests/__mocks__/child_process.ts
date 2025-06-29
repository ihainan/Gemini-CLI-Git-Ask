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
  kill = jest.fn();
  pid = Math.floor(Math.random() * 10000);

  constructor(private result: MockExecResult) {
    super();
  }

  simulateExecution(): void {
    // Simulate async execution
    setTimeout(() => {
      if (this.result.stdout) {
        this.stdout.emit('data', this.result.stdout);
      }
      if (this.result.stderr) {
        this.stderr.emit('data', this.result.stderr);
      }
      
      if (this.result.error) {
        this.emit('error', this.result.error);
      } else {
        this.emit('close', 0);
      }
    }, 10);
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
  const result = mockExecResults.get(fullCommand) || {
    stdout: 'Mock command executed successfully',
    stderr: ''
  };

  const mockProcess = new MockChildProcessEmitter(result);
  
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
setMockExecResult('gemini-cli --version', {
  stdout: 'gemini-cli version 1.0.0',
  stderr: ''
});

setMockExecResult('git --version', {
  stdout: 'git version 2.34.1',
  stderr: ''
}); 