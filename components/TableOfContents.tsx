"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import ResizeHandle from "./ResizeHandle";
import type { TocItem } from "@/lib/toc";

export default function TableOfContents({ items }: { items: TocItem[] }) {
  const [width, setWidth] = useState(280);
  const [collapsed, setCollapsed] = useState(false);
  const savedManualState = useRef(false);
  const isAutoCollapsed = useRef(false);
  const asideRef = useRef<HTMLElement>(null);

  // Auto-collapse on editor mode change
  useEffect(() => {
    const handler = (e: Event) => {
      const mode = (e as CustomEvent).detail;
      if (mode === "source" || mode === "diff") {
        if (!isAutoCollapsed.current) {
          savedManualState.current = collapsed;
          isAutoCollapsed.current = true;
        }
        setCollapsed(true);
      } else if (isAutoCollapsed.current) {
        isAutoCollapsed.current = false;
        setCollapsed(savedManualState.current);
      }
    };
    window.addEventListener("editorModeChange", handler);
    return () => window.removeEventListener("editorModeChange", handler);
  }, [collapsed]);

  const onResize = useCallback((delta: number) => {
    setWidth((w) => Math.min(500, Math.max(180, w + delta)));
  }, []);

  const onAutoFit = useCallback(() => {
    const aside = asideRef.current;
    if (!aside) return;
    aside.style.width = "max-content";
    const natural = aside.scrollWidth + 32;
    aside.style.width = "";
    setWidth(Math.min(500, Math.max(180, natural)));
  }, []);

  if (items.length === 0) return null;

  return (
    <div className="hidden xl:flex shrink-0">
      {collapsed ? (
        <div className="relative w-10 bg-gray-50/80 border-l border-gray-200 dark:bg-gray-800/80 dark:border-gray-700">
          <div className="sticky top-14 pt-2 flex justify-center">
            <button
              onClick={() => { setCollapsed(false); isAutoCollapsed.current = false; }}
              className="rounded p-1 text-gray-400 hover:bg-gray-200/50 hover:text-gray-600 dark:hover:bg-gray-700/50 dark:hover:text-gray-300"
              aria-label="Expand table of contents"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 19l-7-7 7-7M19 19l-7-7 7-7" />
              </svg>
            </button>
          </div>
        </div>
      ) : (
        <>
          <ResizeHandle side="right" onResize={onResize} onAutoFit={onAutoFit} />
          <aside
            ref={asideRef}
            className="relative bg-gray-50/80 border-l border-gray-200 dark:bg-gray-800/80 dark:border-gray-700"
            style={{ width }}
          >
            <button
              onClick={() => setCollapsed(true)}
              className="absolute top-2 left-2 rounded p-1 text-gray-400 hover:bg-gray-200/50 hover:text-gray-600 z-10"
              aria-label="Collapse table of contents"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
              </svg>
            </button>
            <div className="sticky top-14 h-full overflow-y-auto p-4 pt-8">
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                On this page
              </h3>
              <ul className="space-y-1.5 text-sm">
                {items.map((item) => (
                  <li key={item.id}>
                    <a
                      href={`#${item.id}`}
                      className="block text-gray-500 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
                      style={{ paddingLeft: `${(item.level - 2) * 12}px` }}
                    >
                      {item.text}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </>
      )}
    </div>
  );
}
