import type { Node } from 'reactflow';
export interface ServiceMetrics {
  totalCalls: number;
  avgLatency: number;
  errorRate: number;
  p95Latency: number;
}

export interface ServiceNode extends Node {
  data: {
    label: string;
    serviceName: string;
    metrics: ServiceMetrics;
  };
}

export interface ServiceEdge {
  id: string;
  source: string;
  target: string;
  type?: string;
  animated?: boolean;
  label?: string;
  data?: {
    callCount: number;
  };
}
export interface ServiceMapData {
  nodes: ServiceNode[];
  edges: ServiceEdge[];
}