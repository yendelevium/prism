"use client";

import React, { useMemo, useRef } from "react";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import {
  ComposedChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { GanttData } from "./types";
import { Span } from "@/@types/spanItem";
import { useState } from "react";
import SpanDetailPanel from "./SpanDetailPanel";
import { pointer } from "@testing-library/user-event/dist/cjs/pointer/index.js";

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

/**
 * Props for {@link TraceGanttClient}.
 */
export interface TraceGanttClientProps {
  /**
   * Flat list of spans belonging to a single distributed trace.
   *
   * Each span is expected to include timing information (`start_time`,
   * `duration`) as well as hierarchical relationships via
   * `parent_span_id`.
   */
  spans: Span[];
}

/**
 * @internal
 *
 * Custom Y-axis tick renderer that displays spans as a hierarchical tree.
 *
 * This renderer resolves the full span record using the tick's `span_id`,
 * applies indentation based on computed depth, and draws subtle guide lines
 * to visually reinforce parent/child relationships.
 *
 * Recharts does not expose full row data to tick renderers by default,
 * so `fullData` is injected explicitly.
 */
export const TreeTick = (props: any) => {
  const { x, y, payload, fullData } = props;

  // Resolve the full span object from the tick value (span_id)
  const dataItem = fullData.find((d: GanttData) => d.span_id === payload.value);

  // Recharts may invoke tick renderers during layout passes
  if (!dataItem) return null;

  // Helper to keep labels under control
  const truncate = (str: string, n: number) => {
    return str.length > n ? str.slice(0, n - 1) + "…" : str;
  };

  // Indentation logic: We subtract indent from a right-aligned base
  const indent = dataItem.depth * 16;
  const baseLabelX = -20; // Distance from the start of the bar area

  return (
    <g transform={`translate(${x},${y})`}>
      {/* Hierarchy guide line connecting this span to its parent */}
      {dataItem.depth > 0 && (
        <path
          d={`M ${-250 + (dataItem.depth - 1) * 16} ${-20} V 0 H ${
            -245 + indent
          }`}
          fill="none"
          stroke="var(--border-color)"
          strokeWidth="1"
        />
      )}
      {/* Primary label: span operation */}
      <text
        x={baseLabelX}
        y={-2}
        fill="var(--text-primary)"
        fontSize={11}
        fontFamily="ui-monospace, monospace"
        textAnchor="end"
      >
        <title>{dataItem.operation}</title>
        {truncate(dataItem.operation, 25)}
      </text>

      {/* Secondary label: service name */}
      <text
        x={baseLabelX}
        y={10}
        fill="var(--accent)"
        fontSize={9}
        textAnchor="end"
        style={{ opacity: 0.8 }}
      >
        <title>{dataItem.service_name}</title>
        {truncate(dataItem.service_name, 30)}
      </text>
    </g>
  );
};

/**
 * @internal
 *
 * Custom bar renderer for Gantt spans.
 *
 * Recharts models Gantt positioning using stacked bars:
 * - `offset` (invisible spacer)
 * - `duration` (actual visible span)
 *
 * This shape intentionally renders only the duration bar and applies
 * semantic coloring based on span execution status.
 */
export const CustomBarShape = (props: any) => {
  const { x, y, width, height, payload, dataKey, onClick } = props;

  if (dataKey === "offset" || !payload) return null;

  const fill = payload.status === "error" ? NORD.error : NORD.success;

  return (
    <rect
      x={x}
      y={y}
      width={width}
      height={height}
      fill={fill}
      rx={2}
      onClick={() => onClick?.(payload)}
    />
  );
};

/**
 * Client-side Gantt chart for visualizing distributed trace spans.
 *
 * @remarks
 * Responsibilities:
 * - Normalize span timing to a zero-based timeline
 * - Compute parent/child depth relationships
 * - Dynamically size the chart based on trace duration and span count
 * - Provide interactive zoom and pan controls
 *
 * This component performs no data fetching and assumes all span data
 * is provided synchronously by the caller.
 *
 * The component is intentionally client-only due to its reliance on
 * DOM-based charting libraries and interactive gesture handling.
 *
 */
export const TraceGanttClient: React.FC<TraceGanttClientProps> = ({
  spans,
}) => {
  const [selectedSpan, setSelectedSpan] = useState<Span | null>(null);
  const pannedRef = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });

  /**
   * Normalize and enrich raw span data for chart rendering.
   *
   * This memoized transformation:
   * - Aligns all spans to the earliest start time
   * - Computes hierarchical depth via recursive parent traversal
   * - Produces a stable vertical ordering for Recharts
   *
   * Depth computation is recursive but bounded by trace depth,
   * which is typically shallow in practice.
   */
  const data = useMemo(() => {
    const minStart = Math.min(...spans.map((s) => s.start_time));
    const spanMap = new Map(spans.map((s) => [s.span_id, s]));

    const getDepth = (id: string | null): number => {
      if (!id) return 0;
      const parent = spanMap.get(id);
      return parent ? 1 + getDepth(parent.parent_span_id) : 0;
    };

    const newSpans = spans
      .sort((a, b) => a.start_time - b.start_time)
      .map((span, index) => ({
        ...span,
        offset: (span.start_time - minStart) / 1000,
        durationMs: span.duration / 1000,
        yIndex: index,
        depth: getDepth(span.parent_span_id),
      }));

    return newSpans;
  }, [spans]);

  /**
   * Chart dimensions are derived from data density to preserve readability.
   */
  const totalDuration = Math.max(...data.map((d) => d.offset + d.durationMs));

  const MICROSECONDS_PER_PIXEL = 1000; // 1 pixel = 1ms
  const chartWidth = Math.max(1200, totalDuration / MICROSECONDS_PER_PIXEL);
  const chartHeight = data.length * 60 + 100;

  const handleSpanClick = (span: Span) => {
    if (pannedRef.current) return; // Block if we moved more than 5px
    setSelectedSpan(span);
  };

  return (
    <div
      className="w-full h-full border overflow-hidden relative"
      style={{
        backgroundColor: "var(--bg-primary)",
        borderColor: "var(--border-color)",
      }}
    >
      <TransformWrapper
        initialScale={1}
        minScale={0.1}
        maxScale={8}
        limitToBounds={false}
        centerOnInit={true}
        onPanningStart={(ref, event) => {
          pannedRef.current = false; // Reset on every new press
          const e =
            "touches" in event ? event.touches[0] : (event as MouseEvent);
          dragStart.current = { x: e.clientX, y: e.clientY };
        }}
        onPanning={(ref, event) => {
          if (pannedRef.current) return; // If already flagged as panned, do nothing

          // Only consider it a "drag" if they moved more than 5 pixels
          const e =
            "touches" in event ? event.touches[0] : (event as MouseEvent);
          const distance = Math.sqrt(
            Math.pow(e.clientX - dragStart.current.x, 2) +
              Math.pow(e.clientY - dragStart.current.y, 2),
          );

          if (distance > 5) {
            pannedRef.current = true;
          }
        }}
      >
        {({ zoomIn, zoomOut, resetTransform }) => (
          <>
            {/* Zoom and reset controls */}
            <div className="absolute top-4 right-4 z-20 flex gap-1 opacity-70 hover:opacity-100 transition-opacity">
              <button
                onClick={() => zoomIn()}
                className="w-8 h-8 flex items-center justify-center rounded border"
                style={{
                  backgroundColor: "var(--bg-panel)",
                  color: "var(--text-primary)",
                  borderColor: "var(--border-color)",
                }}
              >
                +
              </button>

              <button
                onClick={() => zoomOut()}
                className="w-8 h-8 flex items-center justify-center rounded border"
                style={{
                  backgroundColor: "var(--bg-panel)",
                  color: "var(--text-primary)",
                  borderColor: "var(--border-color)",
                }}
              >
                −
              </button>

              <button
                onClick={() => resetTransform()}
                className="px-2 h-8 text-[10px] uppercase font-bold rounded border"
                style={{
                  backgroundColor: "var(--bg-panel)",
                  color: "var(--text-primary)",
                  borderColor: "var(--border-color)",
                }}
              >
                Reset
              </button>
            </div>

            <TransformComponent
              wrapperStyle={{
                width: "100%",
                height: "100%",
                cursor: "grab",
              }}
              contentStyle={{
                width: chartWidth,
                height: chartHeight,
              }}
            >
              <div
                style={{
                  width: chartWidth,
                  height: chartHeight,
                  padding: "80px 40px",
                  backgroundColor: "var(--bg-primary)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <ComposedChart
                  width={chartWidth - 40}
                  height={chartHeight - 40}
                  layout="vertical"
                  data={data}
                  margin={{ left: 200, right: 200, bottom: 100 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    horizontal={false}
                    stroke="var(--border-color)"
                  />

                  <XAxis
                    type="number"
                    domain={[0, totalDuration]}
                    orientation="top"
                    axisLine={{ stroke: "var(--border-color)" }}
                    tick={{
                      fontSize: 10,
                      fill: "var(--text-secondary)",
                    }}
                  />

                  <YAxis
                    type="category"
                    dataKey="span_id"
                    width={100}
                    tick={(props) => <TreeTick {...props} fullData={data} />}
                    axisLine={{ stroke: "var(--border-color)" }}
                  />

                  <Tooltip
                    cursor={{ fill: "var(--bg-secondary)" }}
                    content={({ active, payload }) => {
                      if (active && payload?.[0]) {
                        const d = payload[0].payload;
                        return (
                          <div
                            style={{
                              background: "var(--bg-panel)",
                              border: "1px solid var(--border-color)",
                              padding: "8px",
                              borderRadius: "4px",
                              color: "var(--text-primary)",
                            }}
                          >
                            <div
                              style={{
                                fontSize: "10px",
                                color: "var(--accent)",
                              }}
                            >
                              {d.service_name}
                            </div>
                            <div style={{ fontWeight: "bold" }}>
                              {d.operation}
                            </div>
                            <div
                              style={{
                                fontSize: "11px",
                                marginTop: "4px",
                              }}
                            >
                              Duration: {formatDuration(d.duration)}
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />

                  <Bar
                    dataKey="offset"
                    stackId="a"
                    isAnimationActive={false}
                    fill="transparent"
                  />
                  <Bar
                    dataKey="durationMs"
                    stackId="a"
                    barSize={22}
                    isAnimationActive={false}
                    shape={<CustomBarShape onClick={handleSpanClick} />}
                  />
                </ComposedChart>
              </div>
            </TransformComponent>
          </>
        )}
      </TransformWrapper>

      {selectedSpan && (
        <SpanDetailPanel
          span={selectedSpan}
          onClose={() => setSelectedSpan(null)}
        />
      )}
    </div>
  );
};

export default TraceGanttClient;

/*
 * Helper function to format duration string in tooltips to show duration in reasonable time scales
 *
 * @param The duration in microseconds
 * @return The duration in the apt time scale up to 2 decimals as a string (with units appended)
 */
export function formatDuration(microseconds: number): string {
  if (microseconds < 1000) {
    return `${microseconds}µs`;
  } else if (microseconds < 1_000_000) {
    return `${(microseconds / 1000).toFixed(2)} ms`;
  } else {
    return `${(microseconds / 1_000_000).toFixed(2)} s`;
  }
}
