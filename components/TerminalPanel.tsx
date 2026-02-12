"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import "@xterm/xterm/css/xterm.css";

const DATA_BYTE = 0x00;
const CONTROL_BYTE = 0x01;

const MIN_HEIGHT = 150;
const DEFAULT_HEIGHT = 300;

function sendControl(ws: WebSocket, obj: object) {
  if (ws.readyState !== WebSocket.OPEN) return;
  const msg = new TextEncoder().encode(JSON.stringify(obj));
  const payload = new Uint8Array(1 + msg.length);
  payload[0] = CONTROL_BYTE;
  payload.set(msg, 1);
  ws.send(payload);
}

export default function TerminalPanel() {
  const [open, setOpen] = useState(false);
  const [sessionActive, setSessionActive] = useState(false);
  const [height, setHeight] = useState(DEFAULT_HEIGHT);
  const [connected, setConnected] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const termRef = useRef<any>(null);
  const fitAddonRef = useRef<any>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const termModulesRef = useRef<{ Terminal: any; FitAddon: any } | null>(null);

  // Fit terminal when height changes
  useEffect(() => {
    if (!fitAddonRef.current) return;
    try {
      fitAddonRef.current.fit();
    } catch {
      // terminal may not be ready
    }
  }, [height]);

  // Refit when panel opens (was hidden via CSS)
  useEffect(() => {
    if (open && fitAddonRef.current) {
      requestAnimationFrame(() => {
        try {
          fitAddonRef.current?.fit();
        } catch {}
      });
    }
  }, [open]);

  // WebSocket connection — lives independently of panel visibility
  // Connects once on mount, reconnects as needed
  useEffect(() => {
    let disposed = false;
    let reconnectTimer: ReturnType<typeof setTimeout>;

    function connect() {
      if (disposed) return;

      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const ws = new WebSocket(`${protocol}//${window.location.host}/api/terminal`);
      ws.binaryType = "arraybuffer";
      wsRef.current = ws;

      ws.onopen = () => {
        if (disposed) return;
        setConnected(true);
      };

      ws.onmessage = (event) => {
        const buf = new Uint8Array(event.data);
        if (buf.length === 0) return;
        const type = buf[0];
        const body = buf.subarray(1);

        if (type === DATA_BYTE) {
          termRef.current?.write(body);
        } else if (type === CONTROL_BYTE) {
          try {
            const msg = JSON.parse(new TextDecoder().decode(body));
            if (msg.type === "session-active") {
              setSessionActive(true);
              ensureTerminal();
            } else if (msg.type === "session-inactive") {
              setSessionActive(false);
            } else if (msg.type === "exit") {
              setSessionActive(false);
            } else if (msg.type === "file-changed") {
              window.dispatchEvent(new CustomEvent("docs-file-changed", { detail: msg.file }));
            }
          } catch {}
        }
      };

      ws.onclose = () => {
        if (disposed) return;
        setConnected(false);
        wsRef.current = null;
        // Reconnect after delay
        reconnectTimer = setTimeout(connect, 2000);
      };

      ws.onerror = () => {
        // onclose will fire after this
      };
    }

    connect();

    return () => {
      disposed = true;
      clearTimeout(reconnectTimer);
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, []);

  // Create xterm instance (lazy, once)
  async function ensureTerminal() {
    if (termRef.current) return;

    if (!termModulesRef.current) {
      const [{ Terminal }, { FitAddon }] = await Promise.all([
        import("@xterm/xterm"),
        import("@xterm/addon-fit"),
      ]);
      termModulesRef.current = { Terminal, FitAddon };
    }

    if (!containerRef.current || termRef.current) return;

    const { Terminal, FitAddon } = termModulesRef.current;
    const fitAddon = new FitAddon();
    const term = new Terminal({
      cursorBlink: false,
      fontSize: 13,
      fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
      theme: {
        background: "#1e1e1e",
        foreground: "#d4d4d4",
        cursor: "#d4d4d4",
        selectionBackground: "#264f78",
      },
      allowProposedApi: true,
    });

    term.loadAddon(fitAddon);
    term.open(containerRef.current);

    termRef.current = term;
    fitAddonRef.current = fitAddon;

    requestAnimationFrame(() => {
      try { fitAddon.fit(); } catch {}
    });

    // Terminal keystrokes -> WebSocket
    term.onData((data: string) => {
      const ws = wsRef.current;
      if (ws && ws.readyState === WebSocket.OPEN) {
        const encoded = new TextEncoder().encode(data);
        const payload = new Uint8Array(1 + encoded.length);
        payload[0] = DATA_BYTE;
        payload.set(encoded, 1);
        ws.send(payload);
      }
    });

    // ResizeObserver for auto-fit + server resize
    const ro = new ResizeObserver(() => {
      try {
        fitAddon.fit();
        const ws = wsRef.current;
        if (ws && ws.readyState === WebSocket.OPEN) {
          sendControl(ws, { type: "resize", cols: term.cols, rows: term.rows });
        }
      } catch {}
    });
    ro.observe(containerRef.current);
    resizeObserverRef.current = ro;
  }

  function handleStart() {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    sendControl(ws, { type: "start" });
    // session-active response will trigger ensureTerminal
  }

  function handleStop(e: React.MouseEvent) {
    e.stopPropagation(); // don't toggle panel
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    sendControl(ws, { type: "close" });
    // Clean up terminal
    resizeObserverRef.current?.disconnect();
    resizeObserverRef.current = null;
    termRef.current?.dispose();
    termRef.current = null;
    fitAddonRef.current = null;
  }

  const maxHeight = typeof window !== "undefined" ? window.innerHeight * 0.8 : 600;

  // Drag-to-resize on the toggle bar itself (like VS Code)
  const dragging = useRef(false);
  const lastY = useRef(0);

  const onBarMouseDown = useCallback((e: React.MouseEvent) => {
    // Only left mouse button
    if (e.button !== 0) return;
    dragging.current = true;
    lastY.current = e.clientY;
    document.body.style.cursor = "row-resize";
    document.body.style.userSelect = "none";
    e.preventDefault();
  }, []);

  useEffect(() => {
    let didDrag = false;

    const onMouseMove = (e: MouseEvent) => {
      if (!dragging.current) return;
      didDrag = true;
      const delta = lastY.current - e.clientY;
      lastY.current = e.clientY;
      setHeight((h) => {
        const maxH = window.innerHeight * 0.8;
        return Math.min(maxH, Math.max(MIN_HEIGHT, h + delta));
      });
    };

    const onMouseUp = () => {
      if (!dragging.current) return;
      dragging.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      // If it was just a click (no drag), toggle the panel
      if (!didDrag) {
        setOpen((o) => !o);
      }
      didDrag = false;
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, []);

  return (
    <div className="shrink-0">
      {/* Toggle bar — always visible, also serves as resize handle */}
      <div
        onMouseDown={onBarMouseDown}
        className="flex w-full items-center gap-2 border-t border-gray-600 bg-[#1e1e1e] px-4 py-1 text-xs text-gray-300 hover:bg-[#2a2a2a] transition-colors cursor-row-resize select-none"
      >
        <svg
          className={`h-3 w-3 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
        </svg>
        <span className="font-medium">Terminal</span>
        {sessionActive && (
          <span className="ml-1 inline-block h-1.5 w-1.5 rounded-full bg-green-400" title="Session active" />
        )}
        {!connected && (
          <span className="ml-1 inline-block h-1.5 w-1.5 rounded-full bg-red-400" title="Disconnected" />
        )}
        <span className="flex-1" />
        {sessionActive && (
          <span
            role="button"
            tabIndex={0}
            onClick={handleStop}
            className="ml-2 rounded px-1.5 py-0.5 text-gray-400 hover:bg-red-900/50 hover:text-red-300 transition-colors"
            title="Stop session"
          >
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </span>
        )}
      </div>

      {/* Panel area — hidden via CSS when closed so xterm stays alive */}
      <div style={{ display: open ? "block" : "none" }}>
        <div
          className="bg-[#1e1e1e]"
          style={{ height: Math.min(height, maxHeight) }}
        >
          {!sessionActive ? (
            <div className="flex h-full items-center justify-center">
              <button
                onClick={handleStart}
                disabled={!connected}
                className="flex items-center gap-2 rounded-md border border-gray-600 bg-[#2a2a2a] px-4 py-2 text-sm text-gray-200 transition-colors hover:bg-[#353535] hover:border-gray-500 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 3l14 9-14 9V3z" />
                </svg>
                Start Claude Session
              </button>
            </div>
          ) : (
            <div
              ref={containerRef}
              className="xterm-container"
              style={{ height: "100%" }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
