import { EventEmitter } from 'events';

/**
 * Mock for @xterm/xterm module
 * Used for testing terminal UI components without browser dependencies
 */

export interface ITerminalOptions {
  cols?: number;
  rows?: number;
  cursorBlink?: boolean;
  cursorStyle?: 'block' | 'underline' | 'bar';
  theme?: {
    background?: string;
    foreground?: string;
    cursor?: string;
    [key: string]: string | undefined;
  };
  fontSize?: number;
  fontFamily?: string;
  scrollback?: number;
  allowTransparency?: boolean;
}

export interface IDisposable {
  dispose(): void;
}

export class Terminal extends EventEmitter {
  cols: number;
  rows: number;
  options: ITerminalOptions;

  // Track written data for testing
  writtenData: string[] = [];
  element?: HTMLElement;

  constructor(options: ITerminalOptions = {}) {
    super();
    this.cols = options.cols || 80;
    this.rows = options.rows || 24;
    this.options = options;
  }

  write(data: string | Uint8Array, callback?: () => void): void {
    const text = typeof data === 'string' ? data : new TextDecoder().decode(data);
    this.writtenData.push(text);
    this.emit('data', text);

    if (callback) {
      setTimeout(callback, 0);
    }
  }

  writeln(data: string, callback?: () => void): void {
    this.write(data + '\r\n', callback);
  }

  open(parent: HTMLElement): void {
    this.element = parent;

    // Create a mock canvas element
    const canvas = document.createElement('canvas');
    canvas.className = 'xterm-canvas';
    parent.appendChild(canvas);

    this.emit('open');
  }

  focus(): void {
    this.emit('focus');
  }

  blur(): void {
    this.emit('blur');
  }

  clear(): void {
    this.writtenData = [];
    this.emit('clear');
  }

  reset(): void {
    this.clear();
    this.emit('reset');
  }

  resize(cols: number, rows: number): void {
    this.cols = cols;
    this.rows = rows;
    this.emit('resize', { cols, rows });
  }

  scrollToBottom(): void {
    this.emit('scroll', this.rows);
  }

  scrollToTop(): void {
    this.emit('scroll', 0);
  }

  selectAll(): void {
    this.emit('selection');
  }

  clearSelection(): void {
    this.emit('selection');
  }

  dispose(): void {
    this.removeAllListeners();
    this.writtenData = [];

    if (this.element) {
      this.element.innerHTML = '';
    }

    this.emit('dispose');
  }

  onData(listener: (data: string) => void): IDisposable {
    this.on('data', listener);
    return {
      dispose: () => this.off('data', listener),
    };
  }

  onResize(listener: (size: { cols: number; rows: number }) => void): IDisposable {
    this.on('resize', listener);
    return {
      dispose: () => this.off('resize', listener),
    };
  }

  onTitleChange(listener: (title: string) => void): IDisposable {
    this.on('title', listener);
    return {
      dispose: () => this.off('title', listener),
    };
  }

  onBinary(listener: (data: string) => void): IDisposable {
    this.on('binary', listener);
    return {
      dispose: () => this.off('binary', listener),
    };
  }

  onCursorMove(listener: () => void): IDisposable {
    this.on('cursormove', listener);
    return {
      dispose: () => this.off('cursormove', listener),
    };
  }

  onLineFeed(listener: () => void): IDisposable {
    this.on('linefeed', listener);
    return {
      dispose: () => this.off('linefeed', listener),
    };
  }

  onScroll(listener: (newPosition: number) => void): IDisposable {
    this.on('scroll', listener);
    return {
      dispose: () => this.off('scroll', listener),
    };
  }

  onSelectionChange(listener: () => void): IDisposable {
    this.on('selection', listener);
    return {
      dispose: () => this.off('selection', listener),
    };
  }

  onRender(listener: (event: { start: number; end: number }) => void): IDisposable {
    this.on('render', listener);
    return {
      dispose: () => this.off('render', listener),
    };
  }

  // Test helper methods
  simulateUserInput(data: string): void {
    this.emit('data', data);
  }

  getWrittenData(): string {
    return this.writtenData.join('');
  }

  clearWrittenData(): void {
    this.writtenData = [];
  }
}

// Export default
export default Terminal;
