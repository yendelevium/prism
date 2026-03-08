// src/types/intercept.ts
export type Protocol = "REST" | "GRAPHQL" | "GRPC";

export interface InterceptRequest {
  body: string | null;
  collection_id: string;
  created_by_id: string;
  headers: Record<string, string>;
  method: string;
  url: string;
  protocol: Protocol;
}

export interface GraphQLInterceptRequest {
  url: string;
  query: string;
  variables: Record<string, unknown> | null;
  operation_name: string | null;
  headers: Record<string, string>;
  request_id: string;
  collection_id: string;
  created_by_id: string;
}

export interface GRPCInterceptRequest {
  server_address: string;
  service: string;
  method: string;
  body: string;
  proto_file: string;
  metadata: Record<string, string>;
  use_tls: boolean;
  request_id: string;
  collection_id: string;
  created_by_id: string;
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

export interface GraphQLInterceptorResponse {
  body: string;
  error_msg: string;
  execution_id: string;
  headers: Record<string, string>;
  request_duration: string;
  request_id: string;
  request_size: number;
  response_size: number;
  span_id: string;
  spans: InterceptorSpan[];
  status: number;
  trace_id: string;
}

export interface GRPCInterceptorResponse {
  body: string;
  error_msg: string;
  execution_id: string;
  response_headers: Record<string, string>;
  response_trailers: Record<string, string>;
  request_duration: string;
  request_id: string;
  request_size: number;
  response_size: number;
  span_id: string;
  spans: InterceptorSpan[];
  status_code: number;
  status_name: string;
  trace_id: string;
}
