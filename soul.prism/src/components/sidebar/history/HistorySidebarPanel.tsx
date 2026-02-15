"use client";

import React from "react";
import { Clock } from "lucide-react";
import { HistoryItem } from "./types";

/**
 * Props for {@link HistorySidebar}.
 */
export type HistorySidebarProps = {
  /**
   * List of historical request executions.
   *
   * Items are expected to be ordered with the most recent
   * request first.
   */
  history: HistoryItem[];
};

/**
 * Maps HTTP methods to CSS color variables.
 *
 * @remarks
 * This mapping provides consistent visual semantics for request
 * history entries and is intentionally aligned with other sidebar
 * components (e.g. collections).
 */
export const methodColorMap: Record<string, string> = {
  GET: "var(--success)",
  POST: "var(--warning)",
  PUT: "var(--accent)",
  PATCH: "var(--accent)",
  DELETE: "var(--error)",
};

/**
 * Sidebar panel displaying recent request activity.
 *
 * @remarks
 * Responsibilities:
 * - Present a chronological list of executed requests
 * - Visually distinguish request methods
 * - Provide compact contextual information (method, time, URL)
 *
 * This component is read-only and does not perform routing,
 * execution, or persistence.
 */
export function HistorySidebar({ history }: HistorySidebarProps) {
  return (
    <aside
      className="w-full h-full flex flex-col border-r select-none overflow-hidden"
      style={{
        backgroundColor: "var(--bg-primary)",
        borderColor: "var(--border-color)",
      }}
    >
      {/* Header */}
      <div
        className="p-4 flex items-center justify-between border-b shrink-0"
        style={{ borderColor: "var(--border-color)" }}
      >
        <h2
          className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-2"
          style={{ color: "var(--text-secondary)" }}
        >
          <Clock size={12} />
          History
        </h2>
      </div>

      {/* History List */}
      <div className="flex-1 overflow-y-auto scrollbar-hide py-2">
        {history.length === 0 ? (
          <div className="p-4 text-center text-[var(--text-secondary)] text-xs opacity-50 italic">
            No recent activity
          </div>
        ) : (
          history.map((req) => (
            <div
              key={req.id}
              className="group mx-2 mb-1 px-3 py-2 rounded border border-transparent hover:border-[var(--border-color)] hover:bg-[var(--bg-secondary)] transition-all cursor-pointer"
            >
              {/* Method + timestamp */}
              <div className="flex justify-between items-baseline mb-1">
                <span
                  className="font-mono text-[9px] font-bold px-1.5 py-0.5 rounded bg-[var(--bg-panel)]"
                  style={{
                    color:
                      methodColorMap[req.method.toUpperCase()] ||
                      "var(--text-secondary)",
                  }}
                >
                  {req.method.toUpperCase()}
                </span>

                <span
                  className="text-[9px] font-mono opacity-40 group-hover:opacity-100 transition-opacity"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {new Date(req.timestamp).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: false,
                  })}
                </span>
              </div>

              {/* Request URL / path */}
              <div className="flex items-center justify-between gap-2">
                <div
                  className="text-xs truncate font-mono tracking-tight"
                  style={{ color: "var(--text-primary)" }}
                  title={req.url}
                >
                  {/* Prefer path-only display for readability */}
                  {req.url.replace(/^https?:\/\/[^\/]+/, "") || req.url}
                </div>

                {/* Passive status indicator */}
                <div
                  className="w-1 h-1 rounded-full shrink-0"
                  style={{
                    backgroundColor: "var(--border-color)",
                  }}
                />
              </div>
            </div>
          ))
        )}
      </div>
    </aside>
  );
}

export default HistorySidebar;
