import { vi } from 'vitest';
import { EventEmitter } from 'events';

/**
 * Mock for node-pty module
 * Used for testing terminal/PTY functionality without spawning real processes
 */

export interface IPty extends EventEmitter {
  pid: number;
  cols: number;
  rows: number;
  process: string;
  handleFlowControl: boolean;
  onData: (listener: (data: string) => void) => void;
  onExit: (listener: (exitCode: { exitCode: number; signal?: number }) => void) => void;
  write: (data: string) => void;
  resize: (cols: number, rows: number) => void;
  clear: () => void;
  kill: (signal?: string) => void;
  pause: () => void;
  resume: () => void;
}

class MockPty extends EventEmitter implements IPty {
  pid: number;
  cols: number;
  rows: number;
  process: string;
  handleFlowControl: boolean = false;

  private _killed = false;

  constructor(
    file: string,
    args: string[],
    options: {
      cols?: number;
      rows?: number;
      cwd?: string;
      env?: Record<string, string>;
      name?: string;
    }
  ) {
    super();
    this.pid = Math.floor(Math.random() * 10000) + 1000;
    this.cols = options.cols || 80;
    this.rows = options.rows || 24;
    this.process = file;

    // Simulate async spawn - emit ready state
    setTimeout(() => {
      if (!this._killed) {
        this.emit('spawn');
      }
    }, 0);
  }

  onData(listener: (data: string) => void): void {
    this.on('data', listener);
  }

  onExit(listener: (exitCode: { exitCode: number; signal?: number }) => void): void {
    this.on('exit', listener);
  }

  write(data: string): void {
    if (this._killed) return;
    // Echo back the data (simulate terminal echo)
    this.emit('data', data);
  }

  resize(cols: number, rows: number): void {
    this.cols = cols;
    this.rows = rows;
    this.emit('resize', { cols, rows });
  }

  clear(): void {
    this.emit('data', '\x1b[2J\x1b[H');
  }

  kill(signal?: string): void {
    if (this._killed) return;
    this._killed = true;
    this.emit('exit', { exitCode: 0, signal: signal ? 15 : undefined });
  }

  pause(): void {
    // No-op in mock
  }

  resume(): void {
    // No-op in mock
  }
}

// Mock spawn function
export const spawn = vi.fn((
  file: string,
  args?: string[] | Record<string, unknown>,
  options?: Record<string, unknown>
): IPty => {
  // Handle both spawn(file, args, options) and spawn(file, options)
  let actualArgs: string[];
  let actualOptions: Record<string, unknown>;

  if (Array.isArray(args)) {
    actualArgs = args;
    actualOptions = options || {};
  } else {
    actualArgs = [];
    actualOptions = args || {};
  }

  return new MockPty(file, actualArgs, actualOptions);
});

// Platform detection (needed by some PTY code)
export const platform = process.platform;
