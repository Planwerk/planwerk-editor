import { describe, it, expect } from 'vitest';

/**
 * WebSocket Binary Protocol Tests
 *
 * Protocol definition from server.ts (lines 22-24):
 * - DATA_BYTE (0x00): Terminal data messages
 * - CONTROL_BYTE (0x01): Control messages (JSON)
 *
 * Message format:
 * - Byte 0: Type (DATA_BYTE or CONTROL_BYTE)
 * - Bytes 1+: Payload (UTF-8 string for data, JSON for control)
 */

const DATA_BYTE = 0x00;
const CONTROL_BYTE = 0x01;

// Helper functions (like sendData and sendControl in server.ts)
function createDataMessage(data: string): Buffer {
  const payload = Buffer.alloc(1 + Buffer.byteLength(data));
  payload[0] = DATA_BYTE;
  payload.write(data, 1);
  return payload;
}

function createControlMessage(obj: object): Buffer {
  const msg = JSON.stringify(obj);
  const payload = Buffer.alloc(1 + Buffer.byteLength(msg));
  payload[0] = CONTROL_BYTE;
  payload.write(msg, 1);
  return payload;
}

describe('WebSocket Binary Protocol', () => {
  describe('Message Encoding', () => {
    it('should encode data message correctly', () => {
      const data = 'Hello, terminal!';
      const payload = Buffer.alloc(1 + Buffer.byteLength(data));
      payload[0] = DATA_BYTE;
      payload.write(data, 1);

      expect(payload[0]).toBe(DATA_BYTE);
      expect(payload.subarray(1).toString()).toBe(data);
      expect(payload.length).toBe(1 + data.length);
    });

    it('should encode control message correctly', () => {
      const control = { type: 'resize', cols: 80, rows: 24 };
      const msg = JSON.stringify(control);
      const payload = Buffer.alloc(1 + Buffer.byteLength(msg));
      payload[0] = CONTROL_BYTE;
      payload.write(msg, 1);

      expect(payload[0]).toBe(CONTROL_BYTE);
      expect(JSON.parse(payload.subarray(1).toString())).toEqual(control);
    });

    it('should encode empty data message', () => {
      const data = '';
      const payload = Buffer.alloc(1 + Buffer.byteLength(data));
      payload[0] = DATA_BYTE;
      payload.write(data, 1);

      expect(payload[0]).toBe(DATA_BYTE);
      expect(payload.length).toBe(1);
    });

    it('should handle UTF-8 characters in data messages', () => {
      const data = 'こんにちは 🚀';
      const payload = Buffer.alloc(1 + Buffer.byteLength(data));
      payload[0] = DATA_BYTE;
      payload.write(data, 1);

      expect(payload.subarray(1).toString()).toBe(data);
    });

    it('should handle large data messages', () => {
      const data = 'x'.repeat(10000);
      const payload = Buffer.alloc(1 + Buffer.byteLength(data));
      payload[0] = DATA_BYTE;
      payload.write(data, 1);

      expect(payload[0]).toBe(DATA_BYTE);
      expect(payload.length).toBe(10001);
      expect(payload.subarray(1).toString()).toBe(data);
    });
  });

  describe('Message Decoding', () => {
    it('should decode data message correctly', () => {
      const data = '$ ls -la\n';
      const buf = Buffer.alloc(1 + Buffer.byteLength(data));
      buf[0] = DATA_BYTE;
      buf.write(data, 1);

      const type = buf[0];
      const body = buf.subarray(1);

      expect(type).toBe(DATA_BYTE);
      expect(body.toString()).toBe(data);
    });

    it('should decode control message correctly', () => {
      const control = { type: 'start' };
      const msg = JSON.stringify(control);
      const buf = Buffer.alloc(1 + Buffer.byteLength(msg));
      buf[0] = CONTROL_BYTE;
      buf.write(msg, 1);

      const type = buf[0];
      const body = buf.subarray(1);

      expect(type).toBe(CONTROL_BYTE);
      expect(JSON.parse(body.toString())).toEqual(control);
    });

    it('should handle empty buffer gracefully', () => {
      const buf = Buffer.alloc(0);

      expect(buf.length).toBe(0);
    });

    it('should decode buffer from raw data', () => {
      const raw = new Uint8Array([DATA_BYTE, 0x48, 0x69]); // "Hi"
      const buf = Buffer.from(raw);

      expect(buf[0]).toBe(DATA_BYTE);
      expect(buf.subarray(1).toString()).toBe('Hi');
    });
  });

  describe('Control Message Types', () => {
    it('should create "start" control message', () => {
      const control = { type: 'start' };
      const msg = JSON.stringify(control);
      const payload = Buffer.alloc(1 + Buffer.byteLength(msg));
      payload[0] = CONTROL_BYTE;
      payload.write(msg, 1);

      const decoded = JSON.parse(payload.subarray(1).toString());
      expect(decoded.type).toBe('start');
    });

    it('should create "close" control message', () => {
      const control = { type: 'close' };
      const msg = JSON.stringify(control);
      const payload = Buffer.alloc(1 + Buffer.byteLength(msg));
      payload[0] = CONTROL_BYTE;
      payload.write(msg, 1);

      const decoded = JSON.parse(payload.subarray(1).toString());
      expect(decoded.type).toBe('close');
    });

    it('should create "resize" control message with dimensions', () => {
      const control = { type: 'resize', cols: 120, rows: 30 };
      const msg = JSON.stringify(control);
      const payload = Buffer.alloc(1 + Buffer.byteLength(msg));
      payload[0] = CONTROL_BYTE;
      payload.write(msg, 1);

      const decoded = JSON.parse(payload.subarray(1).toString());
      expect(decoded).toEqual(control);
      expect(decoded.cols).toBe(120);
      expect(decoded.rows).toBe(30);
    });

    it('should create "exit" control message', () => {
      const control = { type: 'exit' };
      const msg = JSON.stringify(control);
      const payload = Buffer.alloc(1 + Buffer.byteLength(msg));
      payload[0] = CONTROL_BYTE;
      payload.write(msg, 1);

      const decoded = JSON.parse(payload.subarray(1).toString());
      expect(decoded.type).toBe('exit');
    });

    it('should create "session-active" control message', () => {
      const control = { type: 'session-active' };
      const msg = JSON.stringify(control);
      const payload = Buffer.alloc(1 + Buffer.byteLength(msg));
      payload[0] = CONTROL_BYTE;
      payload.write(msg, 1);

      const decoded = JSON.parse(payload.subarray(1).toString());
      expect(decoded.type).toBe('session-active');
    });

    it('should create "session-inactive" control message', () => {
      const control = { type: 'session-inactive' };
      const msg = JSON.stringify(control);
      const payload = Buffer.alloc(1 + Buffer.byteLength(msg));
      payload[0] = CONTROL_BYTE;
      payload.write(msg, 1);

      const decoded = JSON.parse(payload.subarray(1).toString());
      expect(decoded.type).toBe('session-inactive');
    });

    it('should create "file-changed" control message', () => {
      const control = { type: 'file-changed', file: 'docs/test.md' };
      const msg = JSON.stringify(control);
      const payload = Buffer.alloc(1 + Buffer.byteLength(msg));
      payload[0] = CONTROL_BYTE;
      payload.write(msg, 1);

      const decoded = JSON.parse(payload.subarray(1).toString());
      expect(decoded.type).toBe('file-changed');
      expect(decoded.file).toBe('docs/test.md');
    });
  });

  describe('Protocol Edge Cases', () => {
    it('should handle malformed JSON in control message', () => {
      const invalidJson = 'not valid json{';
      const buf = Buffer.alloc(1 + Buffer.byteLength(invalidJson));
      buf[0] = CONTROL_BYTE;
      buf.write(invalidJson, 1);

      expect(() => {
        JSON.parse(buf.subarray(1).toString());
      }).toThrow();
    });

    it('should handle buffer with only type byte', () => {
      const buf = Buffer.alloc(1);
      buf[0] = DATA_BYTE;

      expect(buf.length).toBe(1);
      expect(buf.subarray(1).toString()).toBe('');
    });

    it('should differentiate between DATA_BYTE and CONTROL_BYTE', () => {
      const dataBuf = Buffer.alloc(5);
      dataBuf[0] = DATA_BYTE;
      dataBuf.write('test', 1);

      const controlBuf = Buffer.alloc(20);
      controlBuf[0] = CONTROL_BYTE;
      controlBuf.write(JSON.stringify({ type: 'test' }), 1);

      expect(dataBuf[0]).toBe(DATA_BYTE);
      expect(controlBuf[0]).toBe(CONTROL_BYTE);
      expect(dataBuf[0]).not.toBe(controlBuf[0]);
    });

    it('should handle binary data in data messages', () => {
      // Terminal might send binary escape sequences
      const binaryData = Buffer.from([0x1b, 0x5b, 0x31, 0x6d]); // ANSI escape code
      const payload = Buffer.alloc(1 + binaryData.length);
      payload[0] = DATA_BYTE;
      binaryData.copy(payload, 1);

      expect(payload[0]).toBe(DATA_BYTE);
      expect(payload.subarray(1)).toEqual(binaryData);
    });

    it('should handle control message with extra fields', () => {
      const control = {
        type: 'resize',
        cols: 80,
        rows: 24,
        extraField: 'ignored',
      };
      const msg = JSON.stringify(control);
      const payload = Buffer.alloc(1 + Buffer.byteLength(msg));
      payload[0] = CONTROL_BYTE;
      payload.write(msg, 1);

      const decoded = JSON.parse(payload.subarray(1).toString());
      expect(decoded.type).toBe('resize');
      expect(decoded.cols).toBe(80);
      expect(decoded.rows).toBe(24);
      expect(decoded.extraField).toBe('ignored');
    });
  });

  describe('Protocol Helpers', () => {
    // Note: Helper functions are defined at module level for use across all tests

    it('should create data message with helper', () => {
      const msg = createDataMessage('Hello');

      expect(msg[0]).toBe(DATA_BYTE);
      expect(msg.subarray(1).toString()).toBe('Hello');
    });

    it('should create control message with helper', () => {
      const msg = createControlMessage({ type: 'test', value: 123 });

      expect(msg[0]).toBe(CONTROL_BYTE);
      const decoded = JSON.parse(msg.subarray(1).toString());
      expect(decoded.type).toBe('test');
      expect(decoded.value).toBe(123);
    });

    it('should parse incoming message correctly', () => {
      const incoming = createDataMessage('user input');

      // Simulate server-side parsing
      const buf = Buffer.from(incoming);
      const type = buf[0];
      const body = buf.subarray(1);

      expect(type).toBe(DATA_BYTE);
      expect(body.toString()).toBe('user input');
    });
  });

  describe('Real-World Scenarios', () => {
    it('should handle terminal echo scenario', () => {
      // User types "ls"
      const userInput = createDataMessage('ls\r');

      // Terminal echoes back
      const echo = createDataMessage('ls\r\n');

      // Terminal outputs result
      const output = createDataMessage('file1.md  file2.md\r\n');

      expect(userInput[0]).toBe(DATA_BYTE);
      expect(echo[0]).toBe(DATA_BYTE);
      expect(output[0]).toBe(DATA_BYTE);
    });

    it('should handle session lifecycle', () => {
      // Client starts session
      const start = createControlMessage({ type: 'start' });

      // Server confirms
      const active = createControlMessage({ type: 'session-active' });

      // Client closes session
      const close = createControlMessage({ type: 'close' });

      // Server confirms
      const inactive = createControlMessage({ type: 'session-inactive' });

      expect(JSON.parse(start.subarray(1).toString()).type).toBe('start');
      expect(JSON.parse(active.subarray(1).toString()).type).toBe('session-active');
      expect(JSON.parse(close.subarray(1).toString()).type).toBe('close');
      expect(JSON.parse(inactive.subarray(1).toString()).type).toBe('session-inactive');
    });

    it('should handle terminal resize', () => {
      // Client resizes terminal window
      const resize = createControlMessage({ type: 'resize', cols: 100, rows: 40 });

      const decoded = JSON.parse(resize.subarray(1).toString());
      expect(decoded.type).toBe('resize');
      expect(decoded.cols).toBe(100);
      expect(decoded.rows).toBe(40);
    });

    it('should handle file change notification', () => {
      // Server notifies client of file change
      const notification = createControlMessage({
        type: 'file-changed',
        file: 'docs/getting-started.md',
      });

      const decoded = JSON.parse(notification.subarray(1).toString());
      expect(decoded.type).toBe('file-changed');
      expect(decoded.file).toBe('docs/getting-started.md');
    });

    it('should handle rapid data messages', () => {
      // Simulate rapid terminal output
      const messages = [
        createDataMessage('Line 1\r\n'),
        createDataMessage('Line 2\r\n'),
        createDataMessage('Line 3\r\n'),
      ];

      messages.forEach((msg, i) => {
        expect(msg[0]).toBe(DATA_BYTE);
        expect(msg.subarray(1).toString()).toBe(`Line ${i + 1}\r\n`);
      });
    });
  });

  describe('Buffer Utilities', () => {
    // Note: Helper functions are defined at module level for use across all tests

    it('should correctly calculate buffer size for ASCII', () => {
      const data = 'Hello';
      const size = 1 + Buffer.byteLength(data);

      expect(size).toBe(6); // 1 type byte + 5 chars
    });

    it('should correctly calculate buffer size for UTF-8', () => {
      const data = 'こんにちは'; // 5 chars, but more bytes
      const size = 1 + Buffer.byteLength(data);

      expect(size).toBeGreaterThan(6);
      expect(Buffer.byteLength(data)).toBe(15); // 5 chars × 3 bytes each
    });

    it('should handle emoji in buffer size calculation', () => {
      const data = '🚀';
      const size = 1 + Buffer.byteLength(data);

      expect(size).toBe(5); // 1 type byte + 4 bytes for emoji
    });
  });
});
