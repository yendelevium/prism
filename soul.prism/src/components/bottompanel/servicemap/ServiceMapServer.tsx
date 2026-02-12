import ServiceMapPanel from './ServicemapPanel';
import type { Span } from '../gantt/types';


const mockSpans = [
  {
      id: 1,
      trace_id: 'trace-123',
      span_id: 'span-1',
      parent_span_id: null,
      operation: 'GET /api/users',
      service_name: 'api-gateway',
      start_time: 1000,
      duration: 150,
      status: 'ok'
  },
  {
      id: 2,
      trace_id: 'trace-123',
      span_id: 'span-2',
      parent_span_id: 'span-1',
      operation: 'query users',
      service_name: 'user-service',
      start_time: 1020,
      duration: 80,
      status: 'ok'
  },
  {
      id: 3,
      trace_id: 'trace-123',
      span_id: 'span-3',
      parent_span_id: 'span-2',
      operation: 'SELECT * FROM users',
      service_name: 'postgres',
      start_time: 1030,
      duration: 60,
      status: 'ok'
  },
  {
      id: 4,
      trace_id: 'trace-123',
      span_id: 'span-4',
      parent_span_id: 'span-1',
      operation: 'get user permissions',
      service_name: 'auth-service',
      start_time: 1110,
      duration: 40,
      status: 'ok'
  },
  {
      id: 5,
      trace_id: 'trace-456',
      span_id: 'span-5',
      parent_span_id: null,
      operation: 'POST /api/orders',
      service_name: 'api-gateway',
      start_time: 2000,
      duration: 200,
      status: 'ok'
  },
  {
      id: 6,
      trace_id: 'trace-456',
      span_id: 'span-6',
      parent_span_id: 'span-5',
      operation: 'create order',
      service_name: 'order-service',
      start_time: 2010,
      duration: 120,
      status: 'ok'
  },
  {
      id: 7,
      trace_id: 'trace-456',
      span_id: 'span-7',
      parent_span_id: 'span-6',
      operation: 'INSERT INTO orders',
      service_name: 'postgres',
      start_time: 2020,
      duration: 80,
      status: 'ok'
  },
  {
      id: 8,
      trace_id: 'trace-456',
      span_id: 'span-8',
      parent_span_id: 'span-6',
      operation: 'send notification',
      service_name: 'notification-service',
      start_time: 2140,
      duration: 50,
      status: 'ok'
  }
];

async function fetchSpans(): Promise<Span[]> {
  try {

    // TODO: get data from backend action

    return mockSpans as Span[];
  } catch (error) {
    console.error('Error fetching spans:', error);
    return [];
  }
}

export default async function ServiceMapServer() {
  const spans = await fetchSpans();
  return <ServiceMapPanel spans={spans} />;
}