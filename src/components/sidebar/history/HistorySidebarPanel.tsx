'use client';

import { HistoryItem } from "./types";

type Props = {
  history: HistoryItem[];
};

export default function HistorySidebar({ history }: Props) {
  return (
    <div className="h-full bg-[var(--bg-panel)] border-r border-[var(--border-color)] p-2 flex flex-col">
      <h2 className="text-[var(--text-primary)] font-semibold mb-2">History</h2>
      <div className="flex-1 overflow-y-auto">
        {history.length === 0 ? (
          <div className="text-[var(--text-secondary)] text-sm opacity-60">No history</div>
        ) : (
          history.map((req) => (
            <div
              key={req.id}
              className="mb-1 p-2 rounded hover:bg-[var(--bg-secondary)] cursor-pointer"
            >
              <div className="flex text-sm">
                <span className="font-mono text-[var(--accent)]">{req.method}</span>
                <span className="text-[var(--text-secondary)]">{req.timestamp}</span>
              </div>
              <div className="text-[var(--text-primary)] truncate">{req.url}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
