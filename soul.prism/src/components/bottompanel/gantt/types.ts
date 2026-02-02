export interface Span {
  id: number;
  trace_id: string;
  span_id: string;
  parent_span_id: string | null;
  operation: string;
  service_name: string;
  start_time: number; // For simplicity in JS, treated as numbers/ms
  duration: number;
  status: 'ok' | 'error' | 'unset';
  tags?: Record<string, any>;
  created_at?: string;
}

export interface GanttData extends Span {
  offset: number;
  yIndex: number;
  depth: number;
}