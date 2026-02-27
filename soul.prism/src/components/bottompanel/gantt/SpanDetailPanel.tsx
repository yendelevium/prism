"use client";

import React from "react";
import { X } from "lucide-react";
import type { Span } from "@/@types/spanItem";
import { formatDuration } from "./GanttChartPanel";

const NORD = {
  bgPrimary: "#2E3440",
  bgSecondary: "#3B4252",
  bgPanel: "#434C5E",
  border: "#4C566A",
  textPrimary: "#ECEFF4",
  textSecondary: "#D8DEE9",
  accent: "#88C0D0",
  success: "#A3BE8C",
  error: "#BF616A",
};

interface SpanDetailPanelProps {
  span: Span;
  onClose: () => void;
}

const SpanDetailPanel: React.FC<SpanDetailPanelProps> = ({ span, onClose }) => {
  const statusColor =
    span.status === "error"
      ? NORD.error
      : span.status === "ok"
        ? NORD.success
        : NORD.textSecondary;

  return (
    <>
      {/* Overlay */}

      {/* Side Panel */}
      <div
        className="fixed right-0 top-0 h-full w-96 shadow-2xl z-50 flex flex-col animate-slide-in"
        style={{
          backgroundColor: NORD.bgPanel,
          borderLeft: `1px solid ${NORD.border}`,
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between p-4 border-b"
          style={{ borderColor: NORD.border }}
        >
          <h2 className="text-lg font-bold" style={{ color: NORD.textPrimary }}>
            Span Details
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-opacity-20 hover:bg-white transition-colors"
            style={{ color: NORD.textSecondary }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Service & Operation */}
          <div>
            <label
              className="text-xs uppercase font-bold tracking-wider"
              style={{ color: NORD.textSecondary }}
            >
              Service
            </label>
            <p
              className="text-sm font-mono mt-1"
              style={{ color: NORD.accent }}
            >
              {span.service_name}
            </p>
          </div>

          <div>
            <label
              className="text-xs uppercase font-bold tracking-wider"
              style={{ color: NORD.textSecondary }}
            >
              Operation
            </label>
            <p
              className="text-sm font-mono mt-1"
              style={{ color: NORD.textPrimary }}
            >
              {span.operation}
            </p>
          </div>

          {/* Status */}
          <div>
            <label
              className="text-xs uppercase font-bold tracking-wider"
              style={{ color: NORD.textSecondary }}
            >
              Status
            </label>
            <div className="flex items-center gap-2 mt-1">
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: statusColor }}
              />
              <p
                className="text-sm font-mono uppercase"
                style={{ color: statusColor }}
              >
                {span.status}
              </p>
            </div>
          </div>

          {/* Timing */}
          <div>
            <label
              className="text-xs uppercase font-bold tracking-wider"
              style={{ color: NORD.textSecondary }}
            >
              Duration
            </label>
            <p
              className="text-sm font-mono mt-1"
              style={{ color: NORD.textPrimary }}
            >
              {formatDuration(span.duration)}
            </p>
          </div>

          <div>
            <label
              className="text-xs uppercase font-bold tracking-wider"
              style={{ color: NORD.textSecondary }}
            >
              Start Time
            </label>
            <p
              className="text-sm font-mono mt-1"
              style={{ color: NORD.textPrimary }}
            >
              {span.start_time}
            </p>
          </div>

          {/* IDs */}
          <div className="pt-4 border-t" style={{ borderColor: NORD.border }}>
            <label
              className="text-xs uppercase font-bold tracking-wider"
              style={{ color: NORD.textSecondary }}
            >
              Trace ID
            </label>
            <p
              className="text-xs font-mono mt-1 break-all"
              style={{ color: NORD.textSecondary }}
            >
              {span.trace_id}
            </p>
          </div>

          <div>
            <label
              className="text-xs uppercase font-bold tracking-wider"
              style={{ color: NORD.textSecondary }}
            >
              Span ID
            </label>
            <p
              className="text-xs font-mono mt-1 break-all"
              style={{ color: NORD.textSecondary }}
            >
              {span.span_id}
            </p>
          </div>

          {span.parent_span_id && (
            <div>
              <label
                className="text-xs uppercase font-bold tracking-wider"
                style={{ color: NORD.textSecondary }}
              >
                Parent Span ID
              </label>
              <p
                className="text-xs font-mono mt-1 break-all"
                style={{ color: NORD.textSecondary }}
              >
                {span.parent_span_id}
              </p>
            </div>
          )}

          {/* Tags */}
          {span.tags && Object.keys(span.tags).length > 0 && (
            <div className="pt-4 border-t" style={{ borderColor: NORD.border }}>
              <label
                className="text-xs uppercase font-bold tracking-wider mb-2 block"
                style={{ color: NORD.textSecondary }}
              >
                Tags
              </label>
              <div className="space-y-2">
                {Object.entries(span.tags).map(([key, value]) => (
                  <div key={key} className="flex justify-between text-xs">
                    <span className="font-mono" style={{ color: NORD.accent }}>
                      {key}:
                    </span>
                    <span
                      className="font-mono"
                      style={{ color: NORD.textPrimary }}
                    >
                      {String(value)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes slide-in {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0);
          }
        }
        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
      `}</style>
    </>
  );
};

export default SpanDetailPanel;
