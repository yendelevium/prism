"use client";

import { useEffect, useRef } from "react";

export type LogViewerProps = {
  logs: string[];
};

export default function LogViewerPanel({ logs }: LogViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    containerRef.current?.scrollTo({
      top: containerRef.current.scrollHeight,
    });
  }, [logs]);

  return (
    <div
      ref={containerRef}
      className="
        h-full w-full overflow-auto
        bg-[var(--bg-primary)]
        border border-[var(--border-color)]
        p-3
        font-mono text-xs
        text-[var(--text-secondary)]
        whitespace-pre-wrap
      "
    >
      {logs.length === 0 ? (
        <span className="opacity-60">No logs found.</span>
      ) : (
        logs.map((line, i) => <div key={i}>{line}</div>)
      )}
    </div>
  );
}
