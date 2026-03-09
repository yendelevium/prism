export interface TrafficMetric {
  time: string;
  requestCount: number;
}

export interface LatencyMetric {
  avgLatency: number;
  p95Latency: number;
  p99Latency: number;
}

export interface ErrorRateMetric {
  totalRequests: number;
  errorRequests: number;
  errorRate: number;
}

export interface EndpointMetric {
  requestId: string;
  avgLatency: number;
  requestCount: number;
}

export interface ServiceMetric {
  serviceName: string;
  avgDuration: number;
  spanCount: number;
}
