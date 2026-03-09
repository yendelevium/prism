import { getPrisma } from "@/backend/prisma";
import type {
  EndpointMetric,
  ErrorRateMetric,
  LatencyMetric,
  ServiceMetric,
  TrafficMetric,
} from "./analytics.types";

interface TrafficRow {
  bucket: Date;
  requestCount: bigint;
}

interface ServiceRow {
  serviceName: string;
  avgDuration: number;
  spanCount: bigint;
}

interface SlowEndpointRow {
  requestId: string;
  avgLatency: number;
  requestCount: bigint;
}

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) {
    return 0;
  }

  const index = Math.ceil((p / 100) * sorted.length) - 1;
  const clamped = Math.max(0, Math.min(index, sorted.length - 1));
  return sorted[clamped];
}

export async function getTrafficAnalytics(
  workspaceId: string,
): Promise<TrafficMetric[]> {
  const prisma = getPrisma();

  const rows = await prisma.$queryRaw<TrafficRow[]>`
    SELECT
      date_trunc('hour', e."executedAt") AS bucket,
      COUNT(*)::bigint AS "requestCount"
    FROM "Execution" e
    JOIN "Request" r ON r."id" = e."requestId"
    JOIN "Collection" c ON c."id" = r."collectionId"
    WHERE c."workspaceId" = ${workspaceId}
    GROUP BY bucket
    ORDER BY bucket ASC
  `;

  return rows.map((row) => ({
    time: row.bucket.toISOString(),
    requestCount: Number(row.requestCount),
  }));
}

export async function getLatencyAnalytics(
  workspaceId: string,
): Promise<LatencyMetric> {
  const prisma = getPrisma();

  const rows = await prisma.execution.findMany({
    where: {
      latencyMs: { not: null },
      request: {
        collection: {
          workspaceId,
        },
      },
    },
    select: {
      latencyMs: true,
    },
  });

  const values = rows
    .map((row) => row.latencyMs)
    .filter((value): value is number => typeof value === "number")
    .sort((a, b) => a - b);

  if (values.length === 0) {
    return {
      avgLatency: 0,
      p95Latency: 0,
      p99Latency: 0,
    };
  }

  const total = values.reduce((sum, value) => sum + value, 0);

  return {
    avgLatency: total / values.length,
    p95Latency: percentile(values, 95),
    p99Latency: percentile(values, 99),
  };
}

export async function getErrorRateAnalytics(
  workspaceId: string,
): Promise<ErrorRateMetric> {
  const prisma = getPrisma();

  const where = {
    request: {
      collection: {
        workspaceId,
      },
    },
  };

  const [totalRequests, errorRequests] = await Promise.all([
    prisma.execution.count({ where }),
    prisma.execution.count({
      where: {
        ...where,
        statusCode: { gte: 400 },
      },
    }),
  ]);

  return {
    totalRequests,
    errorRequests,
    errorRate: totalRequests === 0 ? 0 : errorRequests / totalRequests,
  };
}

export async function getSlowestEndpoints(
  workspaceId: string,
): Promise<EndpointMetric[]> {
  const prisma = getPrisma();

  const rows = await prisma.$queryRaw<SlowEndpointRow[]>`
    SELECT
      e."requestId" AS "requestId",
      AVG(e."latencyMs")::float8 AS "avgLatency",
      COUNT(*)::bigint AS "requestCount"
    FROM "Execution" e
    JOIN "Request" r ON r."id" = e."requestId"
    JOIN "Collection" c ON c."id" = r."collectionId"
    WHERE c."workspaceId" = ${workspaceId}
      AND e."latencyMs" IS NOT NULL
    GROUP BY e."requestId"
    ORDER BY "avgLatency" DESC
    LIMIT 10
  `;

  return rows.map((row) => ({
    requestId: row.requestId,
    avgLatency: Number(row.avgLatency),
    requestCount: Number(row.requestCount),
  }));
}

export async function getServiceAnalytics(
  workspaceId: string,
): Promise<ServiceMetric[]> {
  const prisma = getPrisma();

  const rows = await prisma.$queryRaw<ServiceRow[]>`
    SELECT
      s."serviceName" AS "serviceName",
      AVG(s."duration")::float8 AS "avgDuration",
      COUNT(*)::bigint AS "spanCount"
    FROM "Span" s
    JOIN "Execution" e ON e."traceId" = s."traceId"
    JOIN "Request" r ON r."id" = e."requestId"
    JOIN "Collection" c ON c."id" = r."collectionId"
    WHERE c."workspaceId" = ${workspaceId}
    GROUP BY s."serviceName"
    ORDER BY "avgDuration" DESC
  `;

  return rows.map((row) => ({
    serviceName: row.serviceName,
    avgDuration: Number(row.avgDuration),
    spanCount: Number(row.spanCount),
  }));
}
