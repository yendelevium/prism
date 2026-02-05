"use client";

import React, { useMemo } from "react";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import {
  ComposedChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { Span, GanttData } from "./types";

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
  const dataItem = fullData.find(
    (d: GanttData) => d.span_id === payload.value
  );

  // Recharts may invoke tick renderers during layout passes
  if (!dataItem) return null;

  // Indentation depth (in pixels) per hierarchy level
  const indent = dataItem.depth * 16;

  return (
    <g transform={`translate(${x},${y})`}>
      {/* Hierarchy guide line connecting this span to its parent */}
      {dataItem.depth > 0 && (
        <path
          d={`M ${-190 + (dataItem.depth - 1) * 16} ${-20} V 0 H ${
            -185 + indent
          }`}
          fill="none"
          stroke="var(--border-color)"
          strokeWidth="1"
        />
      )}

      {/* Primary label: span operation */}
      <text
        x={-180 + indent}
        y={-2}
        fill="var(--text-primary)"
        fontSize={11}
        fontFamily="ui-monospace, monospace"
        textAnchor="start"
      >
        {dataItem.operation}
      </text>

      {/* Secondary label: service name */}
      <text
        x={-180 + indent}
        y={10}
        fill="var(--accent)"
        fontSize={9}
        textAnchor="start"
        style={{ opacity: 0.8 }}
      >
        {dataItem.service_name}
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
  const { x, y, width, height, payload, dataKey } = props;

  // Offset bars exist purely for layout and should not be rendered
  if (dataKey === "offset" || !payload) return null;

  const fill =
    payload.status === "error"
      ? "var(--error)"
      : "var(--success)";

  return (
    <rect
      x={x}
      y={y}
      width={width}
      height={height}
      fill={fill}
      rx={2}
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

    return spans
      .sort((a, b) => a.start_time - b.start_time)
      .map((span, index) => ({
        ...span,
        offset: span.start_time - minStart,
        yIndex: index,
        depth: getDepth(span.parent_span_id),
      }));
  }, [spans]);

  /**
   * Chart dimensions are derived from data density to preserve readability.
   */
  const totalDuration = Math.max(
    ...data.map((d) => d.offset + d.duration)
  );

  const chartWidth = Math.max(1200, totalDuration * 1.5);
  const chartHeight = data.length * 60 + 100;

  return (
    <div
      className="w-full h-[600px] border overflow-hidden relative"
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
            >
              <div
                style={{
                  width: chartWidth,
                  height: chartHeight,
                  padding: "80px 40px",
                  backgroundColor: "var(--bg-primary)",
                }}
              >
                <ComposedChart
                  width={chartWidth - 80}
                  height={chartHeight - 160}
                  layout="vertical"
                  data={data}
                  margin={{ left: 200 }}
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
                    width={1}
                    tick={(props) => (
                      <TreeTick {...props} fullData={data} />
                    )}
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
                              border:
                                "1px solid var(--border-color)",
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
                              Duration: {d.duration}ms
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
                    shape={<CustomBarShape />}
                  />
                  <Bar
                    dataKey="duration"
                    stackId="a"
                    barSize={22}
                    isAnimationActive={false}
                    shape={<CustomBarShape />}
                  />
                </ComposedChart>
              </div>
            </TransformComponent>
          </>
        )}
      </TransformWrapper>
    </div>
  );
};

export default TraceGanttClient;
