import { createServer } from "http";
import { parse } from "url";
import next from "next";
import { WebSocketServer, WebSocket } from "ws";
import * as pty from "node-pty";
import path from "path";
import fs from "fs";

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = parseInt(process.env.PORT || "3000", 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

const CLAUDE_BIN = "/Users/berendt/.local/bin/claude";
const DOCS_DIR = process.env.DOCS_PATH
  ? path.resolve(process.env.DOCS_PATH)
  : path.resolve(process.cwd(), "docs");

// Protocol bytes
const DATA_BYTE = 0x00;
const CONTROL_BYTE = 0x01;

// Singleton PTY session
let currentPty: pty.IPty | null = null;
let activeWs: WebSocket | null = null;

function sendControl(ws: WebSocket, obj: object) {
  if (ws.readyState !== WebSocket.OPEN) return;
  const msg = JSON.stringify(obj);
  const payload = Buffer.alloc(1 + Buffer.byteLength(msg));
  payload[0] = CONTROL_BYTE;
  payload.write(msg, 1);
  ws.send(payload);
}

function sendData(ws: WebSocket, data: string) {
  if (ws.readyState !== WebSocket.OPEN) return;
  const payload = Buffer.alloc(1 + Buffer.byteLength(data));
  payload[0] = DATA_BYTE;
  payload.write(data, 1);
  ws.send(payload);
}

function spawnSession() {
  if (currentPty) return; // already running

  const shell = process.env.SHELL || "/bin/zsh";
  try {
    currentPty = pty.spawn(shell, ["-l", "-c", `exec "${CLAUDE_BIN}"`], {
      name: "xterm-256color",
      cols: 80,
      rows: 24,
      cwd: DOCS_DIR,
      env: { ...process.env } as Record<string, string>,
    });
  } catch (err) {
    console.error("Failed to spawn PTY:", err);
    if (activeWs) sendControl(activeWs, { type: "exit" });
    return;
  }

  console.log(`> Claude session started (pid: ${currentPty.pid})`);

  currentPty.onData((data: string) => {
    if (activeWs) sendData(activeWs, data);
  });

  currentPty.onExit(() => {
    console.log("> Claude session ended");
    currentPty = null;
    if (activeWs) sendControl(activeWs, { type: "exit" });
  });
}

function killSession() {
  if (!currentPty) return;
  console.log(`> Killing Claude session (pid: ${currentPty.pid})`);
  currentPty.kill();
  currentPty = null;
}

console.log(`> DOCS_DIR: ${DOCS_DIR} (exists: ${fs.existsSync(DOCS_DIR)})`);
console.log(`> CLAUDE_BIN: ${CLAUDE_BIN} (exists: ${fs.existsSync(CLAUDE_BIN)})`);

app.prepare().then(() => {
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url!, true);
    handle(req, res, parsedUrl);
  });

  const wss = new WebSocketServer({ noServer: true });

  server.on("upgrade", (req, socket, head) => {
    const { pathname } = parse(req.url!, true);

    if (pathname === "/api/terminal") {
      wss.handleUpgrade(req, socket, head, (ws) => {
        wss.emit("connection", ws, req);
      });
    } else {
      app.getUpgradeHandler()(req, socket, head);
    }
  });

  wss.on("connection", (ws: WebSocket) => {
    // Replace previous WebSocket (browser reconnect / new tab)
    activeWs = ws;

    // Tell client whether a session is already running
    sendControl(ws, { type: currentPty ? "session-active" : "session-inactive" });

    ws.on("message", (raw: Buffer) => {
      const buf = Buffer.from(raw);
      if (buf.length === 0) return;

      const type = buf[0];
      const body = buf.subarray(1);

      if (type === DATA_BYTE) {
        if (currentPty) currentPty.write(body.toString());
      } else if (type === CONTROL_BYTE) {
        try {
          const msg = JSON.parse(body.toString());
          if (msg.type === "start") {
            spawnSession();
            sendControl(ws, { type: currentPty ? "session-active" : "exit" });
          } else if (msg.type === "close") {
            killSession();
            sendControl(ws, { type: "session-inactive" });
          } else if (msg.type === "resize" && msg.cols && msg.rows) {
            if (currentPty) currentPty.resize(msg.cols, msg.rows);
          }
        } catch {
          // ignore malformed control messages
        }
      }
    });

    ws.on("close", () => {
      // Only clear if this is still the active WebSocket
      if (activeWs === ws) activeWs = null;
      // PTY stays alive — session persists
    });
  });

  // Watch docs/ for .md file changes and notify client
  let fileChangeTimer: ReturnType<typeof setTimeout> | null = null;
  fs.watch(DOCS_DIR, { recursive: true }, (event, filename) => {
    if (!filename || !filename.endsWith(".md")) return;
    // Debounce: writes often trigger multiple events
    if (fileChangeTimer) clearTimeout(fileChangeTimer);
    fileChangeTimer = setTimeout(() => {
      const relative = filename.replace(/\\/g, "/");
      console.log(`> File changed: ${relative}`);
      if (activeWs) sendControl(activeWs, { type: "file-changed", file: relative });
    }, 300);
  });

  server.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
  });

  const cleanup = () => {
    killSession();
    process.exit();
  };

  process.on("SIGINT", cleanup);
  process.on("SIGTERM", cleanup);
});
