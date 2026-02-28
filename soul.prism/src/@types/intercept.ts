// src/types/intercept.ts
export interface InterceptRequest {
  body: string | null;
  collection_id: string;
  created_by_id: string;
  headers: Record<string, string>;
  method: string;
  url: string;
}

export interface InterceptorSpan {
  id: string;
  duration: number;
  operation: string;
  parent_span_id: string;
  service_name: string;
  span_id: string;
  start_time: number;
  status: string;
  tags: Record<string, string>;
  trace_id: string;
}

export interface InterceptorResponse {
  body: string;
  error_msg: string;
  execution_id: string;
  headers: Record<string, string>;
  request_duration: string; // keep as string for now
  request_id: string;
  request_size: number;
  response_size: number;
  span_id: string;
  spans: InterceptorSpan[];
  status: number; // HTTP status from target
  trace_id: string;
}
