"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import {
  MDXEditor,
  headingsPlugin,
  listsPlugin,
  quotePlugin,
  linkPlugin,
  linkDialogPlugin,
  tablePlugin,
  thematicBreakPlugin,
  codeBlockPlugin,
  codeMirrorPlugin,
  markdownShortcutPlugin,
  diffSourcePlugin,
  toolbarPlugin,
  UndoRedo,
  BoldItalicUnderlineToggles,
  BlockTypeSelect,
  CreateLink,
  InsertTable,
  InsertThematicBreak,
  ListsToggle,
  CodeToggle,
  Separator,
  DiffSourceToggleWrapper,
  ConditionalContents,
  ChangeCodeMirrorLanguage,
  InsertCodeBlock,
  type MDXEditorMethods,
  useCellValue,
  usePublisher,
  viewMode$,
} from "@mdxeditor/editor";
import "@mdxeditor/editor/style.css";

export default function MarkdownEditor({
  content,
  slug,
}: {
  content: string;
  slug: string[];
}) {
  // Trim trailing whitespace so MDXEditor's internal normalization doesn't
  // cause a phantom diff. The API route adds a final \n when saving.
  const trimmedContent = content.trimEnd();

  const router = useRouter();
  const editorRef = useRef<MDXEditorMethods>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [dirty, setDirty] = useState(false);
  const dirtyRef = useRef(false);
  const [isDark, setIsDark] = useState(false);

  // Track dark mode class on <html>
  useEffect(() => {
    const html = document.documentElement;
    setIsDark(html.classList.contains("dark"));
    const observer = new MutationObserver(() => {
      setIsDark(html.classList.contains("dark"));
    });
    observer.observe(html, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  // Auto-reload when file changes on disk (e.g. edited by Claude in terminal)
  useEffect(() => {
    const handler = () => {
      // Don't overwrite unsaved user edits
      if (dirtyRef.current) return;
      // router.refresh() re-runs server components → new content/toc props
      router.refresh();
    };
    window.addEventListener("docs-file-changed", handler);
    return () => window.removeEventListener("docs-file-changed", handler);
  }, [router]);

  // Update editor when content prop changes from server re-render
  const prevContentRef = useRef(trimmedContent);
  useEffect(() => {
    if (trimmedContent !== prevContentRef.current) {
      prevContentRef.current = trimmedContent;
      if (!dirtyRef.current && editorRef.current) {
        editorRef.current.setMarkdown(trimmedContent);
      }
    }
  }, [trimmedContent]);

  const handleSave = useCallback(async () => {
    const markdown = editorRef.current?.getMarkdown();
    if (markdown === undefined) return;

    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch("/api/docs", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, content: markdown }),
      });
      if (res.ok) {
        dirtyRef.current = false;
        setDirty(false);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    } finally {
      setSaving(false);
    }
  }, [slug]);

  // Warn on unsaved changes when leaving the page
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (dirtyRef.current) {
        e.preventDefault();
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, []);

  // Ctrl+S / Cmd+S to save
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        if (dirtyRef.current) handleSave();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleSave]);

  const handleChange = useCallback(() => {
    dirtyRef.current = true;
    setDirty(true);
  }, []);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const [fullscreenCode, setFullscreenCode] = useState<string | null>(null);

  // Inject expand buttons into code block toolbars
  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;

    const injectButtons = () => {
      const toolbars = el.querySelectorAll<HTMLElement>(
        '[class*="codeMirrorToolbar"]'
      );
      toolbars.forEach((toolbar) => {
        if (toolbar.querySelector(".diagram-expand-btn")) return;

        const btn = document.createElement("button");
        btn.className = "diagram-expand-btn";
        btn.type = "button";
        btn.title = "Fullscreen";
        btn.textContent = "⛶";
        btn.addEventListener("click", () => {
          const wrapper = toolbar.closest('[class*="codeMirrorWrapper"]');
          const lines = wrapper?.querySelectorAll(".cm-line");
          if (lines && lines.length > 0) {
            const text = Array.from(lines)
              .map((line) => line.textContent || "")
              .join("\n");
            setFullscreenCode(text);
          }
        });
        toolbar.appendChild(btn);
      });
    };

    const timer = setTimeout(injectButtons, 200);
    const observer = new MutationObserver(injectButtons);
    observer.observe(el, { childList: true, subtree: true });

    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, [content]);

  // Add IDs to headings so TOC anchor links work
  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;

    const assignIds = () => {
      const headings = el.querySelectorAll("h1, h2, h3, h4, h5, h6");
      const idCounts = new Map<string, number>();
      headings.forEach((heading) => {
        const text = heading.textContent || "";
        let id = text
          .toLowerCase()
          .replace(/[^\w\s-]/g, "")
          .replace(/\s+/g, "-");
        const count = idCounts.get(id) || 0;
        idCounts.set(id, count + 1);
        if (count > 0) id = `${id}-${count}`;
        heading.id = id;
      });
    };

    // Run once after initial render, then observe for changes
    const timer = setTimeout(assignIds, 100);
    const observer = new MutationObserver(assignIds);
    observer.observe(el, { childList: true, subtree: true, characterData: true });

    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, [content]);

  return (
    <div className="mdxeditor-wrapper" ref={wrapperRef}>
      {fullscreenCode !== null && (
        <DiagramFullscreen
          code={fullscreenCode}
          onClose={() => setFullscreenCode(null)}
        />
      )}
      <MDXEditor
        ref={editorRef}
        className={isDark ? "dark-theme" : ""}
        markdown={trimmedContent}
        onChange={handleChange}
        suppressHtmlProcessing
        contentEditableClassName="prose prose-gray max-w-4xl mx-auto"
        plugins={[
          headingsPlugin({ allowedHeadingLevels: [1, 2, 3, 4, 5, 6] }),
          listsPlugin(),
          quotePlugin(),
          linkPlugin(),
          linkDialogPlugin(),
          tablePlugin(),
          thematicBreakPlugin(),
          codeBlockPlugin({ defaultCodeBlockLanguage: "" }),
          codeMirrorPlugin({
            codeBlockLanguages: {
              "": "Plain Text",
              yaml: "YAML",
              json: "JSON",
              javascript: "JavaScript",
              typescript: "TypeScript",
              python: "Python",
              bash: "Bash",
              shell: "Shell",
              html: "HTML",
              css: "CSS",
              go: "Go",
            },
          }),
          markdownShortcutPlugin(),
          diffSourcePlugin({ diffMarkdown: trimmedContent, viewMode: "rich-text" }),
          toolbarPlugin({
            toolbarContents: () => (
              <>
                <ViewModeBroadcaster />
                <DiffSourceToggleWrapper>
                  <ConditionalContents
                    options={[
                      {
                        when: (editor) => editor?.editorType === "codeblock",
                        contents: () => <ChangeCodeMirrorLanguage />,
                      },
                      {
                        fallback: () => (
                          <>
                            <UndoRedo />
                            <Separator />
                            <BoldItalicUnderlineToggles />
                            <CodeToggle />
                            <Separator />
                            <BlockTypeSelect />
                            <Separator />
                            <ListsToggle />
                            <Separator />
                            <CreateLink />
                            <InsertTable />
                            <InsertCodeBlock />
                            <InsertThematicBreak />
                          </>
                        ),
                      },
                    ]}
                  />
                </DiffSourceToggleWrapper>
                {(dirty || saved) && (
                  <SaveButton
                    onSave={handleSave}
                    saving={saving}
                    saved={saved}
                  />
                )}
              </>
            ),
          }),
        ]}
      />
    </div>
  );
}

// Runs inside the MDXEditor context to broadcast view mode changes
// and handle ESC to return to rich-text view
function ViewModeBroadcaster() {
  const viewMode = useCellValue(viewMode$);
  const setViewMode = usePublisher(viewMode$);
  const lastMode = useRef(viewMode);

  useEffect(() => {
    if (viewMode !== lastMode.current) {
      lastMode.current = viewMode;
      window.dispatchEvent(new CustomEvent("editorModeChange", { detail: viewMode }));
    }
  }, [viewMode]);

  // Also broadcast on mount
  useEffect(() => {
    window.dispatchEvent(new CustomEvent("editorModeChange", { detail: viewMode }));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ESC switches back to rich-text when in source or diff mode
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && viewMode !== "rich-text") {
        e.preventDefault();
        setViewMode("rich-text");
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [viewMode, setViewMode]);

  return null;
}

function SaveButton({
  onSave,
  saving,
  saved,
}: {
  onSave: () => void;
  saving: boolean;
  saved: boolean;
}) {
  return (
    <button
      onClick={onSave}
      disabled={saving}
      className="ml-auto flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-1 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
    >
      {saving ? "Saving..." : saved ? "Saved" : "Save"}
    </button>
  );
}

function DiagramFullscreen({
  code,
  onClose,
}: {
  code: string;
  onClose: () => void;
}) {
  const [zoom, setZoom] = useState(100);
  const contentRef = useRef<HTMLDivElement>(null);

  const zoomIn = useCallback(() => setZoom((z) => Math.min(z + 20, 300)), []);
  const zoomOut = useCallback(() => setZoom((z) => Math.max(z - 20, 40)), []);
  const zoomReset = useCallback(() => setZoom(100), []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if ((e.ctrlKey || e.metaKey) && (e.key === "=" || e.key === "+")) {
        e.preventDefault();
        zoomIn();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "-") {
        e.preventDefault();
        zoomOut();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "0") {
        e.preventDefault();
        zoomReset();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose, zoomIn, zoomOut, zoomReset]);

  // Ctrl/Cmd + scroll wheel to zoom
  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    const handler = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        if (e.deltaY < 0) zoomIn();
        else zoomOut();
      }
    };
    el.addEventListener("wheel", handler, { passive: false });
    return () => el.removeEventListener("wheel", handler);
  }, [zoomIn, zoomOut]);

  return createPortal(
    <div className="diagram-fullscreen-overlay" onClick={onClose}>
      <div
        className="diagram-fullscreen-content"
        ref={contentRef}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="diagram-fullscreen-toolbar">
          <button onClick={zoomOut} title="Zoom out (Ctrl+-)">−</button>
          <span className="diagram-fullscreen-zoom">{zoom}%</span>
          <button onClick={zoomIn} title="Zoom in (Ctrl++)">+</button>
          <button onClick={zoomReset} title="Reset (Ctrl+0)">1:1</button>
          <button
            className="diagram-fullscreen-close"
            onClick={onClose}
            title="Close (ESC)"
          >
            ✕
          </button>
        </div>
        <pre
          className="diagram-fullscreen-pre"
          style={{ fontSize: `${zoom}%` }}
        >
          {code}
        </pre>
      </div>
    </div>,
    document.body
  );
}
