export interface Span {
  id: string;
  traceId: string;
  spanId: string;
  parentSpanId?: string | null;
  operation: string;
  serviceName: string;
  startTime: bigint;
  duration: bigint;
  status?: string | null;
  tags?: unknown;
  createdAt: Date;
}

export interface CreateSpanInput {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  operation: string;
  serviceName: string;
  startTime: bigint;
  duration: bigint;
  status?: string;
  tags?: unknown;
}

export interface SpanResponse {
  data: Span | Span[];
}
