"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import ResizeHandle from "./ResizeHandle";
import type { NavItem } from "@/lib/docs";

function NavLink({ item, depth = 0 }: { item: NavItem; depth?: number }) {
  const pathname = usePathname();
  const isActive = pathname === item.href;
  const hasChildren = item.children && item.children.length > 0;
  const isChildActive =
    hasChildren && item.children!.some((c) => pathname === c.href || (c.children && c.children.some((gc) => pathname === gc.href)));
  const [isOpen, setIsOpen] = useState(hasChildren ? true : isActive || isChildActive);

  return (
    <li>
      <div className="flex items-center">
        <Link
          href={item.href}
          className={`flex-1 block rounded-md px-3 py-1.5 text-sm transition-colors ${
            isActive
              ? "bg-blue-100/60 font-medium text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
              : "text-gray-600 hover:bg-gray-200/50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700/50 dark:hover:text-gray-200"
          }`}
          style={{ paddingLeft: `${depth * 12 + 12}px` }}
        >
          {item.title}
        </Link>
        {hasChildren && (
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="mr-1 rounded p-1 text-gray-400 hover:bg-gray-200/50 hover:text-gray-600 dark:hover:bg-gray-700/50 dark:hover:text-gray-300"
            aria-label={isOpen ? "Collapse" : "Expand"}
          >
            <svg
              className={`h-3.5 w-3.5 transition-transform ${isOpen ? "rotate-90" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}
      </div>
      {hasChildren && isOpen && (
        <ul className="mt-0.5">
          {item.children!.map((child) => (
            <NavLink key={child.href} item={child} depth={depth + 1} />
          ))}
        </ul>
      )}
    </li>
  );
}

function CollapseButton({ collapsed, onClick }: { collapsed: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="absolute top-2 right-2 rounded p-1 text-gray-400 hover:bg-gray-200/50 hover:text-gray-600 dark:hover:bg-gray-700/50 dark:hover:text-gray-300 z-10"
      aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
    >
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        {collapsed ? (
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
        ) : (
          <path strokeLinecap="round" strokeLinejoin="round" d="M11 19l-7-7 7-7M19 19l-7-7 7-7" />
        )}
      </svg>
    </button>
  );
}

export default function Sidebar({ navTree }: { navTree: NavItem[] }) {
  const [width, setWidth] = useState(320);
  const [collapsed, setCollapsed] = useState(false);
  const savedManualState = useRef(false);
  const isAutoCollapsed = useRef(false);
  const navRef = useRef<HTMLElement>(null);

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
    setWidth((w) => Math.min(500, Math.max(200, w + delta)));
  }, []);

  const onAutoFit = useCallback(() => {
    const nav = navRef.current;
    if (!nav) return;
    nav.style.width = "max-content";
    const natural = nav.scrollWidth + 32;
    nav.style.width = "";
    setWidth(Math.min(500, Math.max(200, natural)));
  }, []);

  return (
    <div className="hidden lg:flex shrink-0">
      {collapsed ? (
        <div className="relative w-10 bg-gray-50/80 border-r border-gray-200 dark:bg-gray-800/80 dark:border-gray-700">
          <div className="sticky top-14 pt-2 flex justify-center">
            <button
              onClick={() => { setCollapsed(false); isAutoCollapsed.current = false; }}
              className="rounded p-1 text-gray-400 hover:bg-gray-200/50 hover:text-gray-600"
              aria-label="Expand sidebar"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      ) : (
        <>
          <nav
            ref={navRef}
            className="relative bg-gray-50/80 border-r border-gray-200 dark:bg-gray-800/80 dark:border-gray-700"
            style={{ width }}
          >
            <CollapseButton collapsed={false} onClick={() => setCollapsed(true)} />
            <div className="sticky top-14 h-full overflow-y-auto p-4 pt-8">
              <ul className="space-y-0.5">
                {navTree.map((item) => (
                  <NavLink key={item.href} item={item} />
                ))}
              </ul>
            </div>
          </nav>
          <ResizeHandle side="left" onResize={onResize} onAutoFit={onAutoFit} />
        </>
      )}
    </div>
  );
}
