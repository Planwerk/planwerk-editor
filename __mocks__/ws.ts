import { EventEmitter } from 'events';

/**
 * Mock for ws (WebSocket) module
 * Used for testing WebSocket server functionality
 */

export enum WebSocketState {
  CONNECTING = 0,
  OPEN = 1,
  CLOSING = 2,
  CLOSED = 3,
}

export class WebSocket extends EventEmitter {
  static CONNECTING = WebSocketState.CONNECTING;
  static OPEN = WebSocketState.OPEN;
  static CLOSING = WebSocketState.CLOSING;
  static CLOSED = WebSocketState.CLOSED;

  readyState: WebSocketState = WebSocketState.CONNECTING;
  url: string;
  protocol: string = '';
  bufferedAmount: number = 0;

  // Track sent messages for testing
  sentMessages: Array<Buffer | string> = [];

  constructor(url: string) {
    super();
    this.url = url;

    // Simulate connection opening
    setTimeout(() => {
      this.readyState = WebSocketState.OPEN;
      this.emit('open');
    }, 0);
  }

  send(data: Buffer | string | ArrayBuffer): void {
    if (this.readyState !== WebSocketState.OPEN) {
      throw new Error('WebSocket is not open');
    }

    // Store sent data for assertions
    if (data instanceof ArrayBuffer) {
      this.sentMessages.push(Buffer.from(data));
    } else {
      this.sentMessages.push(data);
    }

    // Simulate successful send
    this.emit('send', data);
  }

  close(code?: number, reason?: string): void {
    if (this.readyState === WebSocketState.CLOSED || this.readyState === WebSocketState.CLOSING) {
      return;
    }

    this.readyState = WebSocketState.CLOSING;

    setTimeout(() => {
      this.readyState = WebSocketState.CLOSED;
      this.emit('close', code || 1000, reason || '');
    }, 0);
  }

  ping(data?: Buffer | string): void {
    this.emit('ping', data);
  }

  pong(data?: Buffer | string): void {
    this.emit('pong', data);
  }

  terminate(): void {
    this.readyState = WebSocketState.CLOSED;
    this.emit('close', 1006, 'Connection terminated');
  }

  // Test helpers
  simulateMessage(data: Buffer | string): void {
    this.emit('message', data);
  }

  simulateError(error: Error): void {
    this.emit('error', error);
  }
}

export class WebSocketServer extends EventEmitter {
  clients: Set<WebSocket> = new Set();
  options: Record<string, unknown>;

  constructor(options?: Record<string, unknown>) {
    super();
    this.options = options || {};
  }

  handleUpgrade(
    _request: unknown,
    _socket: unknown,
    _head: Buffer,
    callback: (ws: WebSocket) => void
  ): void {
    const ws = new WebSocket('ws://localhost');
    this.clients.add(ws);

    ws.on('close', () => {
      this.clients.delete(ws);
    });

    callback(ws);
  }

  close(callback?: (err?: Error) => void): void {
    // Close all client connections
    this.clients.forEach(client => client.close());
    this.clients.clear();

    if (callback) {
      setTimeout(() => callback(), 0);
    }
  }

  shouldHandle(/* eslint-disable-line @typescript-eslint/no-unused-vars */ _request: unknown): boolean {
    return true;
  }
}

// Mock Server class (if needed)
export class Server extends WebSocketServer {}

// Export for testing
export default WebSocket;
