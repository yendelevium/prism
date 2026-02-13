import "dotenv/config";
import { Pool } from "pg";
import type { CreateSpanInput, Span } from "./span.types";

const globalForPg = globalThis as typeof globalThis & {
  __prismPgPool?: Pool;
};

function getPool(): Pool {
  if (globalForPg.__prismPgPool) {
    return globalForPg.__prismPgPool;
  }

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }

  const pool = new Pool({ connectionString });

  if (process.env.NODE_ENV !== "production") {
    globalForPg.__prismPgPool = pool;
  }

  return pool;
}

export async function listSpansByTraceId(
  traceId: string,
): Promise<Span[]> {
  const pool = getPool();

  const result = await pool.query<{
    id: string;
    traceId: string;
    spanId: string;
    parentSpanId: string | null;
    operation: string;
    serviceName: string;
    startTime: string;
    duration: string;
    status: string | null;
    tags: unknown;
    createdAt: Date;
  }>(
    `SELECT "id","traceId","spanId","parentSpanId","operation","serviceName",
            "startTime","duration","status","tags","createdAt"
     FROM "Span"
     WHERE "traceId" = $1
     ORDER BY "startTime" ASC`,
    [traceId],
  );

  return result.rows.map((row) => ({
    id: row.id,
    traceId: row.traceId,
    spanId: row.spanId,
    parentSpanId: row.parentSpanId,
    operation: row.operation,
    serviceName: row.serviceName,
    startTime: BigInt(row.startTime),
    duration: BigInt(row.duration),
    status: row.status,
    tags: row.tags,
    createdAt: new Date(row.createdAt),
  }));
}

export async function getSpanById(
  id: string,
): Promise<Span | undefined> {
  const pool = getPool();

  const result = await pool.query<{
    id: string;
    traceId: string;
    spanId: string;
    parentSpanId: string | null;
    operation: string;
    serviceName: string;
    startTime: string;
    duration: string;
    status: string | null;
    tags: unknown;
    createdAt: Date;
  }>(
    `SELECT "id","traceId","spanId","parentSpanId","operation","serviceName",
            "startTime","duration","status","tags","createdAt"
     FROM "Span"
     WHERE "id" = $1
     LIMIT 1`,
    [id],
  );

  const row = result.rows[0];
  if (!row) return undefined;

  return {
    id: row.id,
    traceId: row.traceId,
    spanId: row.spanId,
    parentSpanId: row.parentSpanId,
    operation: row.operation,
    serviceName: row.serviceName,
    startTime: BigInt(row.startTime),
    duration: BigInt(row.duration),
    status: row.status,
    tags: row.tags,
    createdAt: new Date(row.createdAt),
  };
}
