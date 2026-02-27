import { Span } from "@/@types/spanItem";
/**
 * Enriched span data used specifically for Gantt chart rendering.
 *
 * This interface extends {@link Span} with layout and hierarchy metadata
 * derived at render time on the client.
 */
export interface GanttData extends Span {
  /**
   * Time offset from the earliest span start, in milliseconds.
   *
   * Implemented as an invisible stacked bar to position the visible
   * duration bar correctly on the horizontal timeline.
   */
  offset: number;

  /**
   * Stable vertical index of the span within the chart.
   *
   * Used internally by Recharts to maintain consistent row ordering.
   */
  yIndex: number;

  /**
   * Hierarchical depth of the span within the trace.
   *
   * Computed recursively by following `parent_span_id` links and used
   * to visually indent labels and draw tree guide lines.
   */
  depth: number;

  durationMs: number;
}
