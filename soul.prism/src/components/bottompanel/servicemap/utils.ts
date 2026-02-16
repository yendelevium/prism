import type { Span } from "../gantt/types";
import type {
  ServiceMapData,
  ServiceNode,
  ServiceEdge,
  ServiceMetrics,
} from "./types";

/**
 * Builds a service dependency graph from trace spans
 * @param addTestNodes - If true, adds isolated test nodes to verify hover behavior
 */
export function buildServiceGraph(
  spans: Span[],
  addTestNodes = false,
): ServiceMapData {
  if (!spans || spans.length === 0) {
    return { nodes: [], edges: [] };
  }

  // Group spans by service
  const serviceMap = new Map<string, Span[]>();
  const edgeMap = new Map<string, number>(); // key: "serviceA->serviceB", value: call count

  for (const span of spans) {
    const serviceName = span.service_name;

    if (!serviceMap.has(serviceName)) {
      serviceMap.set(serviceName, []);
    }
    serviceMap.get(serviceName)?.push(span);

    // Track service-to-service calls
    if (span.parent_span_id) {
      const parentSpan = spans.find((s) => s.span_id === span.parent_span_id);
      if (parentSpan && parentSpan.service_name !== serviceName) {
        const edgeKey = `${parentSpan.service_name}->${serviceName}`;
        edgeMap.set(edgeKey, (edgeMap.get(edgeKey) || 0) + 1);
      }
    }
  }

  // Create nodes
  const nodes: ServiceNode[] = [];
  let yPosition = 0;

  for (const [serviceName, serviceSpans] of serviceMap.entries()) {
    const metrics = calculateServiceMetrics(serviceSpans);

    nodes.push({
      id: serviceName,
      type: "default",
      position: { x: 250, y: yPosition },
      data: {
        label: serviceName,
        serviceName,
        metrics,
      },
    });

    yPosition += 150;
  }

  // Add test nodes if requested (unrelated services)
  if (addTestNodes) {
    // Test nodes removed
  }

  // Create edges
  const edges: ServiceEdge[] = [];
  for (const [edgeKey, callCount] of edgeMap.entries()) {
    const [source, target] = edgeKey.split("->");
    edges.push({
      id: edgeKey,
      source,
      target,
      type: "smoothstep",
      animated: true,
      data: { callCount },
      label: `${callCount} calls`,
    });
  }

  return { nodes, edges };
}

/**
 * Calculate metrics for a service based on its spans
 */
function calculateServiceMetrics(spans: Span[]): ServiceMetrics {
  if (spans.length === 0) {
    return {
      totalCalls: 0,
      avgLatency: 0,
      errorRate: 0,
      p95Latency: 0,
    };
  }

  const durations = spans.map((s) => s.duration).sort((a, b) => a - b);
  const errorCount = spans.filter((s) => s.status === "error").length;
  const p95Index = Math.floor(durations.length * 0.95);

  return {
    totalCalls: spans.length,
    avgLatency: Math.round(
      durations.reduce((a, b) => a + b, 0) / durations.length,
    ),
    errorRate: Math.round((errorCount / spans.length) * 100),
    p95Latency: durations[p95Index] || 0,
  };
}
