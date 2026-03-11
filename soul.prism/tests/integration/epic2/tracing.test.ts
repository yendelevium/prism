/**
 * EPIC 2 — Distributed Tracing
 *
 * Integration tests for span ingestion, trace-to-request
 * correlation, span drill-down, advanced filtering, and SLA
 * alerting — all against real PostgreSQL.
 */

import { describe, it, expect } from "vitest";
import { getTestPrisma } from "../setup/test-prisma";
import {
  seedUser,
  seedWorkspace,
  seedCollection,
  seedRequest,
  seedExecution,
  seedSpan,
} from "../setup/seed";

// ── Real service imports ──────────────────────────────────
import {
  listSpansByTraceId,
  getSpanById,
} from "@/backend/span/span.service";

/* ================================================================ */
/*  US 2.1 — OTLP Trace Ingestion                                  */
/* ================================================================ */

describe("US 2.1 — OTLP Trace Ingestion", () => {
  it("persists a span with correct traceId, spanId, parentSpanId, startTime, endTime, serviceName", async () => {
    // ARRANGE
    const prisma = getTestPrisma();
    const traceId = crypto.randomUUID();
    const spanId = crypto.randomUUID().slice(0, 16);
    const startTime = BigInt(Date.now() * 1_000_000);
    const duration = BigInt(250_000_000); // 250ms in ns

    // ACT — create via prisma directly (simulating ingestion service)
    const span = await prisma.span.create({
      data: {
        traceId,
        spanId,
        parentSpanId: null,
        operation: "HTTP POST /api/orders",
        serviceName: "order-service",
        startTime,
        duration,
        status: "OK",
        tags: { "http.method": "POST", "http.url": "/api/orders" },
      },
    });

    // ASSERT — return value
    expect(span.id).toBeDefined();
    expect(span.traceId).toBe(traceId);
    expect(span.spanId).toBe(spanId);
    expect(span.parentSpanId).toBeNull();
    expect(span.serviceName).toBe("order-service");
    expect(span.startTime).toBe(startTime);
    expect(span.duration).toBe(duration);
    expect(span.status).toBe("OK");

    // ASSERT — persistence
    const fromDb = await prisma.span.findUnique({ where: { id: span.id } });
    expect(fromDb).not.toBeNull();
    expect(fromDb!.traceId).toBe(traceId);
    expect(fromDb!.spanId).toBe(spanId);
    expect(fromDb!.serviceName).toBe("order-service");
    expect(fromDb!.operation).toBe("HTTP POST /api/orders");
  });

  it("rejects a span with duplicate traceId+spanId combo", async () => {
    // ARRANGE
    const prisma = getTestPrisma();
    const traceId = crypto.randomUUID();
    const spanId = "span-duplicate-01";

    await prisma.span.create({
      data: {
        traceId,
        spanId,
        operation: "first",
        serviceName: "svc",
        startTime: BigInt(0),
        duration: BigInt(100),
      },
    });

    // ACT & ASSERT — duplicate should fail due to @@unique([traceId, spanId])
    await expect(
      prisma.span.create({
        data: {
          traceId,
          spanId,
          operation: "duplicate",
          serviceName: "svc",
          startTime: BigInt(0),
          duration: BigInt(100),
        },
      }),
    ).rejects.toThrow();
  });

  it("persists span with tags (attributes) as JSON", async () => {
    // ARRANGE
    const prisma = getTestPrisma();
    const tags = {
      "http.method": "GET",
      "http.status_code": "200",
      "http.url": "/api/users",
      "custom.tag": "my-value",
    };

    // ACT
    const span = await seedSpan({ tags });

    // ASSERT
    const fromDb = await prisma.span.findUnique({ where: { id: span.id } });
    expect(fromDb!.tags).toEqual(tags);
  });
});

/* ================================================================ */
/*  US 2.2 — Trace-to-Request Correlation                          */
/* ================================================================ */

describe("US 2.2 — Trace-to-Request Correlation", () => {
  it("correlates Execution with Spans via shared traceId", async () => {
    // ARRANGE
    const prisma = getTestPrisma();
    const user = await seedUser();
    const ws = await seedWorkspace(user.id);
    const coll = await seedCollection(ws.id, user.id);
    const req = await seedRequest(coll.id, user.id);

    const sharedTraceId = crypto.randomUUID();

    // Execution with known traceId
    const execution = await seedExecution({
      requestId: req.id,
      traceId: sharedTraceId,
      statusCode: 200,
      latencyMs: 150,
    });

    // Spans with the same traceId
    const rootSpan = await seedSpan({
      traceId: sharedTraceId,
      spanId: "root-span-001",
      operation: "HTTP GET /users",
      serviceName: "api-gateway",
    });
    const childSpan = await seedSpan({
      traceId: sharedTraceId,
      spanId: "child-span-001",
      parentSpanId: "root-span-001",
      operation: "DB SELECT users",
      serviceName: "user-db",
    });

    // ACT — query spans by trace
    const spans = await listSpansByTraceId(sharedTraceId);

    // ASSERT — both spans returned
    expect(spans).toHaveLength(2);
    const spanIds = spans.map((s) => s.spanId);
    expect(spanIds).toContain("root-span-001");
    expect(spanIds).toContain("child-span-001");

    // ASSERT — Execution → Trace linkage
    const exec = await prisma.execution.findUnique({
      where: { id: execution.id },
    });
    expect(exec!.traceId).toBe(sharedTraceId);

    // ASSERT — bidirectional: Trace → Execution
    const executions = await prisma.execution.findMany({
      where: { traceId: sharedTraceId },
    });
    expect(executions).toHaveLength(1);
    expect(executions[0].id).toBe(execution.id);
  });

  it("returns empty spans for a traceId with no associated spans", async () => {
    // ARRANGE
    const unknownTraceId = crypto.randomUUID();

    // ACT
    const spans = await listSpansByTraceId(unknownTraceId);

    // ASSERT
    expect(spans).toHaveLength(0);
  });
});

/* ================================================================ */
/*  US 2.5 — Span Drill-Down                                       */
/* ================================================================ */

describe("US 2.5 — Span Drill-Down", () => {
  it("returns span details including tags (attributes)", async () => {
    // ARRANGE
    const span = await seedSpan({
      operation: "HTTP POST /checkout",
      serviceName: "checkout-service",
      status: "ERROR",
      tags: {
        "http.method": "POST",
        "http.status_code": "500",
        "error.message": "Payment declined",
      },
    });

    // ACT
    const detail = await getSpanById(span.id);

    // ASSERT
    expect(detail).toBeDefined();
    expect(detail!.operation).toBe("HTTP POST /checkout");
    expect(detail!.serviceName).toBe("checkout-service");
    expect(detail!.status).toBe("ERROR");
    expect(detail!.tags).toEqual({
      "http.method": "POST",
      "http.status_code": "500",
      "error.message": "Payment declined",
    });
  });

  it("child spans are nested under parent spans via parentSpanId", async () => {
    // ARRANGE
    const traceId = crypto.randomUUID();

    const root = await seedSpan({
      traceId,
      spanId: "root",
      parentSpanId: null,
      operation: "HTTP GET /",
      serviceName: "gateway",
      startTime: BigInt(1000),
    });

    const child1 = await seedSpan({
      traceId,
      spanId: "child-1",
      parentSpanId: "root",
      operation: "Auth Check",
      serviceName: "auth",
      startTime: BigInt(2000),
    });

    const child2 = await seedSpan({
      traceId,
      spanId: "child-2",
      parentSpanId: "root",
      operation: "DB Query",
      serviceName: "db",
      startTime: BigInt(3000),
    });

    const grandchild = await seedSpan({
      traceId,
      spanId: "grandchild-1",
      parentSpanId: "child-2",
      operation: "Index Scan",
      serviceName: "db",
      startTime: BigInt(3500),
    });

    // ACT
    const spans = await listSpansByTraceId(traceId);

    // ASSERT — all 4 spans returned, ordered by startTime
    expect(spans).toHaveLength(4);
    expect(spans[0].spanId).toBe("root");
    expect(spans[0].parentSpanId).toBeNull();
    expect(spans[1].spanId).toBe("child-1");
    expect(spans[1].parentSpanId).toBe("root");
    expect(spans[2].spanId).toBe("child-2");
    expect(spans[2].parentSpanId).toBe("root");
    expect(spans[3].spanId).toBe("grandchild-1");
    expect(spans[3].parentSpanId).toBe("child-2");
  });

  it("returns undefined for non-existent span ID", async () => {
    // ACT
    const detail = await getSpanById("non-existent-id");

    // ASSERT
    expect(detail).toBeUndefined();
  });
});

/* ================================================================ */
/*  US 2.6 — Advanced Filtering                                    */
/* ================================================================ */

describe("US 2.6 — Advanced Filtering", () => {
  it("filters spans by status=error", async () => {
    // ARRANGE
    const prisma = getTestPrisma();
    const traceId = crypto.randomUUID();

    // Seed 10 spans: 3 errors, 7 OK
    for (let i = 0; i < 7; i++) {
      await seedSpan({
        traceId,
        spanId: `ok-span-${i}`,
        status: "OK",
        duration: BigInt(100_000_000),
      });
    }
    for (let i = 0; i < 3; i++) {
      await seedSpan({
        traceId,
        spanId: `error-span-${i}`,
        status: "ERROR",
        duration: BigInt(500_000_000),
      });
    }

    // ACT — filter by status=ERROR using raw query
    const errorSpans = await prisma.span.findMany({
      where: { traceId, status: "ERROR" },
    });

    // ASSERT
    expect(errorSpans).toHaveLength(3);
    for (const span of errorSpans) {
      expect(span.status).toBe("ERROR");
    }
  });

  it("filters spans by duration > 2000ms", async () => {
    // ARRANGE
    const prisma = getTestPrisma();
    const traceId = crypto.randomUUID();
    const slowThreshold = BigInt(2_000_000_000); // 2000ms in ns

    // 5 fast spans (100ms)
    for (let i = 0; i < 5; i++) {
      await seedSpan({
        traceId,
        spanId: `fast-${i}`,
        duration: BigInt(100_000_000),
      });
    }
    // 3 slow spans (3000ms)
    for (let i = 0; i < 3; i++) {
      await seedSpan({
        traceId,
        spanId: `slow-${i}`,
        duration: BigInt(3_000_000_000),
      });
    }
    // 2 very slow spans (5000ms)
    for (let i = 0; i < 2; i++) {
      await seedSpan({
        traceId,
        spanId: `vslow-${i}`,
        duration: BigInt(5_000_000_000),
      });
    }

    // ACT
    const slowSpans = await prisma.span.findMany({
      where: { traceId, duration: { gt: slowThreshold } },
    });

    // ASSERT — only the 5 slow/very-slow spans
    expect(slowSpans).toHaveLength(5);
    for (const span of slowSpans) {
      expect(span.duration).toBeGreaterThan(slowThreshold);
    }
  });

  it("combines status=error AND duration filters with AND logic", async () => {
    // ARRANGE
    const prisma = getTestPrisma();
    const traceId = crypto.randomUUID();

    // Fast OK
    await seedSpan({ traceId, spanId: "fast-ok", status: "OK", duration: BigInt(100_000_000) });
    // Slow OK
    await seedSpan({ traceId, spanId: "slow-ok", status: "OK", duration: BigInt(3_000_000_000) });
    // Fast ERROR
    await seedSpan({ traceId, spanId: "fast-err", status: "ERROR", duration: BigInt(50_000_000) });
    // Slow ERROR (this is the one we want)
    await seedSpan({ traceId, spanId: "slow-err", status: "ERROR", duration: BigInt(3_000_000_000) });

    // ACT — combined filter
    const results = await prisma.span.findMany({
      where: {
        traceId,
        status: "ERROR",
        duration: { gt: BigInt(2_000_000_000) },
      },
    });

    // ASSERT — only the slow error
    expect(results).toHaveLength(1);
    expect(results[0].spanId).toBe("slow-err");
    expect(results[0].status).toBe("ERROR");
    expect(results[0].duration).toBeGreaterThan(BigInt(2_000_000_000));
  });
});

/* ================================================================ */
/*  US 2.7 — SLA Alerting                                          */
/* ================================================================ */

describe("US 2.7 — SLA Alerting (latency-based threshold checks)", () => {
  it("detects executions exceeding SLA threshold", async () => {
    // ARRANGE
    const prisma = getTestPrisma();
    const user = await seedUser();
    const ws = await seedWorkspace(user.id);
    const coll = await seedCollection(ws.id, user.id);
    const req = await seedRequest(coll.id, user.id);

    const SLA_THRESHOLD_MS = 2000;

    // Execution that violates SLA (5000ms)
    const slowExec = await seedExecution({
      requestId: req.id,
      latencyMs: 5000,
      statusCode: 200,
    });

    // Execution within SLA (500ms)
    const fastExec = await seedExecution({
      requestId: req.id,
      latencyMs: 500,
      statusCode: 200,
    });

    // ACT — query for SLA violations
    const violations = await prisma.execution.findMany({
      where: {
        requestId: req.id,
        latencyMs: { gt: SLA_THRESHOLD_MS },
      },
    });

    // ASSERT — only the slow execution violates
    expect(violations).toHaveLength(1);
    expect(violations[0].id).toBe(slowExec.id);
    expect(violations[0].latencyMs).toBe(5000);
  });

  it("no alert for executions within SLA", async () => {
    // ARRANGE
    const prisma = getTestPrisma();
    const user = await seedUser();
    const ws = await seedWorkspace(user.id);
    const coll = await seedCollection(ws.id, user.id);
    const req = await seedRequest(coll.id, user.id);

    const SLA_THRESHOLD_MS = 2000;

    await seedExecution({ requestId: req.id, latencyMs: 100, statusCode: 200 });
    await seedExecution({ requestId: req.id, latencyMs: 500, statusCode: 200 });
    await seedExecution({ requestId: req.id, latencyMs: 1999, statusCode: 200 });

    // ACT
    const violations = await prisma.execution.findMany({
      where: {
        requestId: req.id,
        latencyMs: { gt: SLA_THRESHOLD_MS },
      },
    });

    // ASSERT — none
    expect(violations).toHaveLength(0);
  });
});
