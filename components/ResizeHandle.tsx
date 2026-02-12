"use client";

import { useCallback, useEffect, useRef } from "react";

export default function ResizeHandle({
  side,
  onResize,
  onAutoFit,
}: {
  side: "left" | "right";
  onResize: (delta: number) => void;
  onAutoFit?: () => void;
}) {
  const dragging = useRef(false);
  const lastX = useRef(0);

  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      dragging.current = true;
      lastX.current = e.clientX;
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    },
    []
  );

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!dragging.current) return;
      const delta = e.clientX - lastX.current;
      lastX.current = e.clientX;
      onResize(side === "left" ? delta : -delta);
    };

    const onMouseUp = () => {
      dragging.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [onResize, side]);

  return (
    <div
      onMouseDown={onMouseDown}
      onDoubleClick={onAutoFit}
      className="w-1 shrink-0 cursor-col-resize hover:bg-blue-300 active:bg-blue-400 transition-colors"
    />
  );
}
