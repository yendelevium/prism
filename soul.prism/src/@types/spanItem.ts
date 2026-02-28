import { Span as BackendSpan } from "@/backend/span/span.types";
/**
 * Represents a single span within a distributed trace.
 *
 * A span models one timed operation performed by a service and may be
 * hierarchically related to other spans via a parent/child relationship.
 *
 * This interface is intentionally backend-agnostic and aligns with common
 * tracing systems (e.g. OpenTelemetry, Jaeger, Zipkin).
 */
export interface Span {
  /**
   * Internal numeric identifier for the span.
   *
   * This is typically database-generated and is not used for trace
   * correlation or hierarchy resolution in the UI.
   */
  id: string;

  /**
   * Identifier of the trace this span belongs to.
   *
   * All spans rendered together in a Gantt chart share the same `trace_id`.
   */
  trace_id: string;

  /**
   * Unique identifier for this span within the trace.
   *
   * Used as the primary key for hierarchical lookups and chart row mapping.
   */
  span_id: string;

  /**
   * Identifier of the parent span, if any.
   *
   * A `null` value indicates a root span. Parent relationships are used
   * to compute visual nesting depth in the Gantt chart.
   */
  parent_span_id: string | null;

  /**
   * Human-readable name of the operation being executed.
   *
   * Displayed as the primary label in the Gantt chart.
   */
  operation: string;

  /**
   * Name of the service that produced this span.
   *
   * Rendered as a secondary label and used to visually distinguish
   * spans across services.
   */
  service_name: string;

  /**
   * Start time of the span in milliseconds.
   *
   * For simplicity in JavaScript, this value is treated as a numeric
   * timestamp and normalized relative to the earliest span in the trace.
   */
  start_time: number;

  /**
   * Duration of the span in milliseconds.
   *
   * This value directly determines the rendered bar width in the Gantt chart.
   */
  duration: number;

  /**
   * Execution status of the span.
   *
   * Used to apply semantic coloring (e.g. success vs error) in the chart.
   */
  status: "ok" | "error" | "unset";

  /**
   * Arbitrary key/value metadata associated with the span.
   *
   * Tags are not rendered directly but may be surfaced via tooltips
   * or extended visualizations.
   */
  tags?: Record<string, any>;

  /**
   * Timestamp indicating when the span record was created.
   *
   * This field is optional and not currently used for visualization.
   */
  created_at?: string;
}

export const spanToSpanItem = (span: BackendSpan) => {
  return {
    id: span.id,
    trace_id: span.traceId,
    span_id: span.spanId,
    parent_span_id: span.parentSpanId,
    operation: span.operation,
    service_name: span.serviceName,
    start_time: Number(span.startTime),
    duration: Number(span.duration),
    status: span.status,
    tags: span.tags,
    created_at: span.createdAt.toISOString(),
  } as Span;
};
