import ServiceMapPanel from './ServicemapPanel';
import type { Span } from '../gantt/types';

// Mock data for now - replace with actual API call later
const mockSpans: Span[] = [
  {
    id: 1,
    trace_id: "trace-123",
    span_id: "span-1",
    parent_span_id: null,
    operation: "GET /api/users",
    service_name: "api-gateway",
    start_time: 1000,
    duration: 150,
    status: "ok",
  },
  {
    id: 2,
    trace_id: "trace-123",
    span_id: "span-2",
    parent_span_id: "span-1",
    operation: "query users",
    service_name: "user-service",
    start_time: 1020,
    duration: 80,
    status: "ok",
  },
  {
    id: 3,
    trace_id: "trace-123",
    span_id: "span-3",
    parent_span_id: "span-2",
    operation: "SELECT * FROM users",
    service_name: "postgres",
    start_time: 1030,
    duration: 60,
    status: "ok",
  },
  {
    id: 4,
    trace_id: "trace-123",
    span_id: "span-4",
    parent_span_id: "span-1",
    operation: "get user permissions",
    service_name: "auth-service",
    start_time: 1110,
    duration: 40,
    status: "ok",
  },

];

export default async function ServiceMapServer() {
  // TODO: Fetch real trace data from API
  // const spans = await fetchTraceData();

  return <ServiceMapPanel spans={mockSpans} />;
}