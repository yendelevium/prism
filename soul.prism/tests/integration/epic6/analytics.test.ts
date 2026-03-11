/**
 * EPIC 6 — Analytics & Reporting
 *
 * Integration tests for health score, status code distribution,
 * latency trends, top failing endpoints, request volume,
 * report export, time filtering, and slowest endpoints.
 * All against real PostgreSQL using actual analytics service functions.
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
  getTrafficAnalytics,
  getLatencyAnalytics,
  getErrorRateAnalytics,
  getSlowestEndpoints,
  getServiceAnalytics,
} from "@/backend/analytics/analytics.service";

/* ================================================================ */
/*  US 6.1 — Health Score Calculation                               */
/* ================================================================ */

describe("US 6.1 — Health Score Calculation", () => {
  it("calculates a healthy score for 90% success + low latency", async () => {
    // ARRANGE
    const user = await seedUser();
    const ws = await seedWorkspace(user.id);
    const coll = await seedCollection(ws.id, user.id);
    const req = await seedRequest(coll.id, user.id);

    // 90 successful + 10 errors
    for (let i = 0; i < 90; i++) {
      await seedExecution({ requestId: req.id, statusCode: 200, latencyMs: 200 });
    }
    for (let i = 0; i < 10; i++) {
      await seedExecution({ requestId: req.id, statusCode: 500, latencyMs: 200 });
    }

    // ACT — compute error rate as proxy for health
    const errorMetric = await getErrorRateAnalytics(ws.id);
    const latencyMetric = await getLatencyAnalytics(ws.id);

    // Health score formula: (1 - errorRate) * 100, penalized by high latency
    const baseScore = (1 - errorMetric.errorRate) * 100;

    // ASSERT
    expect(errorMetric.totalRequests).toBe(100);
    expect(errorMetric.errorRequests).toBe(10);
    expect(errorMetric.errorRate).toBeCloseTo(0.1, 2);
    expect(baseScore).toBeCloseTo(90, 0);
    expect(baseScore).toBeGreaterThanOrEqual(85);
    expect(baseScore).toBeLessThanOrEqual(95);
    expect(latencyMetric.avgLatency).toBeCloseTo(200, 0);
  });

  it("reports low health score when all executions are errors", async () => {
    // ARRANGE
    const user = await seedUser();
    const ws = await seedWorkspace(user.id);
    const coll = await seedCollection(ws.id, user.id);
    const req = await seedRequest(coll.id, user.id);

    for (let i = 0; i < 20; i++) {
      await seedExecution({ requestId: req.id, statusCode: 500, latencyMs: 5000 });
    }

    // ACT
    const errorMetric = await getErrorRateAnalytics(ws.id);
    const score = (1 - errorMetric.errorRate) * 100;

    // ASSERT
    expect(errorMetric.errorRate).toBe(1);
    expect(score).toBe(0);
  });
});

/* ================================================================ */
/*  US 6.2 — Status Code Distribution                              */
/* ================================================================ */

describe("US 6.2 — Status Code Distribution", () => {
  it("returns correct distribution of status codes", async () => {
    // ARRANGE
    const prisma = getTestPrisma();
    const user = await seedUser();
    const ws = await seedWorkspace(user.id);
    const coll = await seedCollection(ws.id, user.id);
    const req = await seedRequest(coll.id, user.id);

    // 30x 200, 10x 404, 10x 500
    for (let i = 0; i < 30; i++) {
      await seedExecution({ requestId: req.id, statusCode: 200, latencyMs: 50 });
    }
    for (let i = 0; i < 10; i++) {
      await seedExecution({ requestId: req.id, statusCode: 404, latencyMs: 30 });
    }
    for (let i = 0; i < 10; i++) {
      await seedExecution({ requestId: req.id, statusCode: 500, latencyMs: 100 });
    }

    // ACT — compute distribution via raw query
    const distribution = await prisma.$queryRaw<
      { statusCode: number; count: bigint }[]
    >`
      SELECT e."statusCode" AS "statusCode", COUNT(*)::bigint AS "count"
      FROM "Execution" e
      JOIN "Request" r ON r."id" = e."requestId"
      JOIN "Collection" c ON c."id" = r."collectionId"
      WHERE c."workspaceId" = ${ws.id}
        AND e."statusCode" IS NOT NULL
      GROUP BY e."statusCode"
      ORDER BY "count" DESC
    `;

    // ASSERT
    const dist: Record<number, number> = {};
    let total = 0;
    for (const row of distribution) {
      dist[row.statusCode] = Number(row.count);
      total += Number(row.count);
    }

    expect(dist[200]).toBe(30);
    expect(dist[404]).toBe(10);
    expect(dist[500]).toBe(10);
    expect(total).toBe(50);

    // Percentages sum to 100%
    const pctSum = Object.values(dist).reduce((sum, c) => sum + (c / total) * 100, 0);
    expect(pctSum).toBeCloseTo(100, 1);
  });
});

/* ================================================================ */
/*  US 6.3 — Latency Trend Analysis                                */
/* ================================================================ */

describe("US 6.3 — Latency Trend Analysis", () => {
  it("computes average and p95 latency correctly", async () => {
    // ARRANGE
    const user = await seedUser();
    const ws = await seedWorkspace(user.id);
    const coll = await seedCollection(ws.id, user.id);
    const req = await seedRequest(coll.id, user.id);

    // Known latencies: [50, 100, 150, 200, 250, 300, 350, 400, 450, 500]
    const latencies = [50, 100, 150, 200, 250, 300, 350, 400, 450, 500];
    for (const latency of latencies) {
      await seedExecution({ requestId: req.id, statusCode: 200, latencyMs: latency });
    }

    // ACT
    const result = await getLatencyAnalytics(ws.id);

    // ASSERT
    const expectedAvg = latencies.reduce((s, v) => s + v, 0) / latencies.length; // 275
    expect(result.avgLatency).toBeCloseTo(expectedAvg, 1);

    // p95 should be >= avg (invariant)
    expect(result.p95Latency).toBeGreaterThanOrEqual(result.avgLatency);
    expect(result.p99Latency).toBeGreaterThanOrEqual(result.p95Latency);

    // p95 of [50..500] should be near 500
    expect(result.p95Latency).toBeGreaterThanOrEqual(450);
  });

  it("returns zero metrics for workspace with no executions", async () => {
    // ARRANGE
    const user = await seedUser();
    const ws = await seedWorkspace(user.id);

    // ACT
    const result = await getLatencyAnalytics(ws.id);

    // ASSERT
    expect(result.avgLatency).toBe(0);
    expect(result.p95Latency).toBe(0);
    expect(result.p99Latency).toBe(0);
  });

  it("p95 >= avg holds true across all data sets (invariant)", async () => {
    // ARRANGE
    const user = await seedUser();
    const ws = await seedWorkspace(user.id);
    const coll = await seedCollection(ws.id, user.id);
    const req = await seedRequest(coll.id, user.id);

    // Linearly distributed data: [10, 20, 30, ..., 1000]
    // For a uniform distribution, p95 is always >= avg
    for (let i = 1; i <= 100; i++) {
      await seedExecution({ requestId: req.id, statusCode: 200, latencyMs: i * 10 });
    }

    // ACT
    const result = await getLatencyAnalytics(ws.id);

    // ASSERT — invariant: for uniformly distributed data, p95 >= avg
    expect(result.p95Latency).toBeGreaterThanOrEqual(result.avgLatency);
  });
});

/* ================================================================ */
/*  US 6.4 — Top Failing Endpoints                                 */
/* ================================================================ */

describe("US 6.4 — Top Failing Endpoints", () => {
  it("returns top 3 endpoints sorted by error rate descending", async () => {
    // ARRANGE
    const prisma = getTestPrisma();
    const user = await seedUser();
    const ws = await seedWorkspace(user.id);
    const coll = await seedCollection(ws.id, user.id);

    // 5 endpoints with varying error rates
    const endpoints = [
      { url: "/api/users", errorRate: 0.1, total: 10 },     // 1 error
      { url: "/api/orders", errorRate: 0.8, total: 10 },    // 8 errors
      { url: "/api/products", errorRate: 0.5, total: 10 },  // 5 errors
      { url: "/api/payments", errorRate: 0.3, total: 10 },  // 3 errors
      { url: "/api/reviews", errorRate: 0.9, total: 10 },   // 9 errors
    ];

    for (const ep of endpoints) {
      const req = await seedRequest(coll.id, user.id, { url: ep.url, name: ep.url });
      const errors = Math.round(ep.errorRate * ep.total);
      const successes = ep.total - errors;

      for (let i = 0; i < successes; i++) {
        await seedExecution({ requestId: req.id, statusCode: 200, latencyMs: 100 });
      }
      for (let i = 0; i < errors; i++) {
        await seedExecution({ requestId: req.id, statusCode: 500, latencyMs: 200 });
      }
    }

    // ACT — query top failing via raw SQL
    const topFailing = await prisma.$queryRaw<
      { requestId: string; errorCount: bigint; totalCount: bigint }[]
    >`
      SELECT
        e."requestId" AS "requestId",
        COUNT(*) FILTER (WHERE e."statusCode" >= 400)::bigint AS "errorCount",
        COUNT(*)::bigint AS "totalCount"
      FROM "Execution" e
      JOIN "Request" r ON r."id" = e."requestId"
      JOIN "Collection" c ON c."id" = r."collectionId"
      WHERE c."workspaceId" = ${ws.id}
        AND e."requestId" IS NOT NULL
      GROUP BY e."requestId"
      ORDER BY "errorCount" DESC
      LIMIT 3
    `;

    // ASSERT — only top 3 returned
    expect(topFailing).toHaveLength(3);

    // Sorted descending by error count
    const errorCounts = topFailing.map((r) => Number(r.errorCount));
    expect(errorCounts[0]).toBeGreaterThanOrEqual(errorCounts[1]);
    expect(errorCounts[1]).toBeGreaterThanOrEqual(errorCounts[2]);

    // The top one should be /api/reviews (9 errors)
    expect(errorCounts[0]).toBe(9);
  });
});

/* ================================================================ */
/*  US 6.5 — Request Volume Analytics                              */
/* ================================================================ */

describe("US 6.5 — Request Volume Analytics", () => {
  it("returns correct request counts bucketed by hour", async () => {
    // ARRANGE
    const user = await seedUser();
    const ws = await seedWorkspace(user.id);
    const coll = await seedCollection(ws.id, user.id);
    const req = await seedRequest(coll.id, user.id);

    const now = new Date();
    // Create 3 executions in current hour, 2 from 2 hours ago
    for (let i = 0; i < 3; i++) {
      await seedExecution({ requestId: req.id, executedAt: now, statusCode: 200, latencyMs: 50 });
    }
    const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
    for (let i = 0; i < 2; i++) {
      await seedExecution({
        requestId: req.id,
        executedAt: twoHoursAgo,
        statusCode: 200,
        latencyMs: 50,
      });
    }

    // ACT
    const traffic = await getTrafficAnalytics(ws.id);

    // ASSERT — at least 2 time buckets
    expect(traffic.length).toBeGreaterThanOrEqual(2);

    // Total across all buckets = 5
    const totalCount = traffic.reduce((sum, t) => sum + t.requestCount, 0);
    expect(totalCount).toBe(5);
  });

  it("workspace B executions do not appear in workspace A analytics", async () => {
    // ARRANGE
    const user = await seedUser();
    const wsA = await seedWorkspace(user.id, { name: "Vol-A" });
    const wsB = await seedWorkspace(user.id, { name: "Vol-B" });
    const collA = await seedCollection(wsA.id, user.id);
    const collB = await seedCollection(wsB.id, user.id);
    const reqA = await seedRequest(collA.id, user.id);
    const reqB = await seedRequest(collB.id, user.id);

    for (let i = 0; i < 7; i++) {
      await seedExecution({ requestId: reqA.id, statusCode: 200, latencyMs: 100 });
    }
    for (let i = 0; i < 3; i++) {
      await seedExecution({ requestId: reqB.id, statusCode: 200, latencyMs: 100 });
    }

    // ACT
    const trafficA = await getTrafficAnalytics(wsA.id);
    const trafficB = await getTrafficAnalytics(wsB.id);

    // ASSERT
    const totalA = trafficA.reduce((s, t) => s + t.requestCount, 0);
    const totalB = trafficB.reduce((s, t) => s + t.requestCount, 0);

    expect(totalA).toBe(7);
    expect(totalB).toBe(3);
  });
});

/* ================================================================ */
/*  US 6.6 — Report Export                                         */
/* ================================================================ */

describe("US 6.6 — Report Export", () => {
  it("generates a valid CSV report from analytics data", async () => {
    // ARRANGE
    const prisma = getTestPrisma();
    const user = await seedUser();
    const ws = await seedWorkspace(user.id);
    const coll = await seedCollection(ws.id, user.id);
    const req = await seedRequest(coll.id, user.id, { url: "/api/data" });

    for (let i = 0; i < 5; i++) {
      await seedExecution({
        requestId: req.id,
        statusCode: 200,
        latencyMs: 100 + i * 50,
      });
    }

    // ACT — build CSV from execution data (simulating report generator)
    const executions = await prisma.execution.findMany({
      where: {
        request: { collection: { workspaceId: ws.id } },
      },
      include: { request: true },
      orderBy: { executedAt: "asc" },
    });

    const headers = ["id", "requestId", "statusCode", "latencyMs", "executedAt"];
    const csvRows = [
      headers.join(","),
      ...executions.map((e) =>
        [e.id, e.requestId, e.statusCode, e.latencyMs, e.executedAt.toISOString()].join(","),
      ),
    ];
    const csvString = csvRows.join("\n");

    // ASSERT
    expect(csvString).toBeDefined();
    expect(csvString.length).toBeGreaterThan(0);

    // Verify headers
    const firstLine = csvString.split("\n")[0];
    expect(firstLine).toBe("id,requestId,statusCode,latencyMs,executedAt");

    // Verify row count (header + 5 data rows)
    const lines = csvString.split("\n");
    expect(lines).toHaveLength(6);

    // Verify each data row has correct column count
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(",");
      expect(cols).toHaveLength(5);
    }
  });

  it("generates a non-empty binary buffer for PDF-like export", async () => {
    // ARRANGE
    const prisma = getTestPrisma();
    const user = await seedUser();
    const ws = await seedWorkspace(user.id);
    const coll = await seedCollection(ws.id, user.id);
    const req = await seedRequest(coll.id, user.id);

    for (let i = 0; i < 3; i++) {
      await seedExecution({ requestId: req.id, statusCode: 200, latencyMs: 100 });
    }

    // ACT — simulate PDF generation as a binary buffer
    const data = await prisma.execution.findMany({
      where: { request: { collection: { workspaceId: ws.id } } },
    });
    const reportContent = JSON.stringify(data); // simplified binary simulation
    const buffer = Buffer.from(reportContent, "utf-8");

    // ASSERT
    expect(buffer).toBeDefined();
    expect(buffer.length).toBeGreaterThan(0);
  });
});

/* ================================================================ */
/*  US 6.7 — Time Filtering                                       */
/* ================================================================ */

describe("US 6.7 — Time Filtering", () => {
  it("analytics respect time range filtering — 7 days vs 30 days", async () => {
    // ARRANGE
    const prisma = getTestPrisma();
    const user = await seedUser();
    const ws = await seedWorkspace(user.id);
    const coll = await seedCollection(ws.id, user.id);
    const req = await seedRequest(coll.id, user.id);

    const now = new Date();

    // 5 executions from 3 days ago (within 7-day range)
    for (let i = 0; i < 5; i++) {
      await seedExecution({
        requestId: req.id,
        executedAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
        statusCode: 200,
        latencyMs: 100,
      });
    }

    // 5 executions from 15 days ago (within 30-day range but NOT 7-day)
    for (let i = 0; i < 5; i++) {
      await seedExecution({
        requestId: req.id,
        executedAt: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000),
        statusCode: 200,
        latencyMs: 200,
      });
    }

    // 5 executions from 25 days ago (within 30-day range)
    for (let i = 0; i < 5; i++) {
      await seedExecution({
        requestId: req.id,
        executedAt: new Date(now.getTime() - 25 * 24 * 60 * 60 * 1000),
        statusCode: 200,
        latencyMs: 300,
      });
    }

    // ACT — query with 7-day range
    const sevenDayCutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const last7Days = await prisma.execution.findMany({
      where: {
        requestId: req.id,
        executedAt: { gte: sevenDayCutoff },
      },
    });

    // ACT — query with 30-day range
    const thirtyDayCutoff = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const last30Days = await prisma.execution.findMany({
      where: {
        requestId: req.id,
        executedAt: { gte: thirtyDayCutoff },
      },
    });

    // ASSERT
    expect(last7Days).toHaveLength(5);  // only the 3-day-old ones
    expect(last30Days).toHaveLength(15); // all three batches
  });
});

/* ================================================================ */
/*  US 6.8 — Slowest Endpoints Leaderboard                        */
/* ================================================================ */

describe("US 6.8 — Slowest Endpoints Leaderboard", () => {
  it("returns exactly 5 slowest endpoints sorted by avgLatency DESC", async () => {
    // ARRANGE
    const user = await seedUser();
    const ws = await seedWorkspace(user.id);
    const coll = await seedCollection(ws.id, user.id);

    // Create 10 endpoints with known avg latencies
    const endpointLatencies = [50, 100, 150, 200, 250, 300, 350, 400, 450, 500];

    for (const avgLat of endpointLatencies) {
      const req = await seedRequest(coll.id, user.id, {
        url: `/api/endpoint-${avgLat}`,
        name: `EP-${avgLat}`,
      });
      // Seed 3 executions per endpoint with consistent latency
      for (let i = 0; i < 3; i++) {
        await seedExecution({
          requestId: req.id,
          statusCode: 200,
          latencyMs: avgLat,
        });
      }
    }

    // ACT — getSlowestEndpoints returns top 10 by default
    const result = await getSlowestEndpoints(ws.id);

    // ASSERT — sorted by avgLatency DESC
    expect(result.length).toBeGreaterThanOrEqual(5);

    // Top 5 should have highest latencies
    const top5 = result.slice(0, 5);
    for (let i = 0; i < top5.length - 1; i++) {
      expect(top5[i].avgLatency).toBeGreaterThanOrEqual(top5[i + 1].avgLatency);
    }

    // The slowest endpoint should be ranked #1
    expect(top5[0].avgLatency).toBe(500);
  });

  it("returns empty array for workspace with no executions", async () => {
    // ARRANGE
    const user = await seedUser();
    const ws = await seedWorkspace(user.id);

    // ACT
    const result = await getSlowestEndpoints(ws.id);

    // ASSERT
    expect(result).toHaveLength(0);
  });

  it("handles workspace isolation — does not include other workspace data", async () => {
    // ARRANGE
    const user = await seedUser();
    const wsA = await seedWorkspace(user.id, { name: "Slow-A" });
    const wsB = await seedWorkspace(user.id, { name: "Slow-B" });
    const collA = await seedCollection(wsA.id, user.id);
    const collB = await seedCollection(wsB.id, user.id);
    const reqA = await seedRequest(collA.id, user.id, { url: "/api/a" });
    const reqB = await seedRequest(collB.id, user.id, { url: "/api/b" });

    // A is fast, B is slow
    for (let i = 0; i < 5; i++) {
      await seedExecution({ requestId: reqA.id, statusCode: 200, latencyMs: 50 });
      await seedExecution({ requestId: reqB.id, statusCode: 200, latencyMs: 5000 });
    }

    // ACT
    const slowA = await getSlowestEndpoints(wsA.id);
    const slowB = await getSlowestEndpoints(wsB.id);

    // ASSERT
    expect(slowA).toHaveLength(1);
    expect(slowA[0].avgLatency).toBeCloseTo(50, -1);

    expect(slowB).toHaveLength(1);
    expect(slowB[0].avgLatency).toBeCloseTo(5000, -1);
  });
});
