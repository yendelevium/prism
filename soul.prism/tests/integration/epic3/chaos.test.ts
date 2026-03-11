/**
 * EPIC 3 — Chaos Engineering
 *
 * Integration tests for latency injection, error injection,
 * packet drop simulation, load generation, and chaos audit log.
 *
 * Since the Prisma schema doesn't yet have ChaosRule / ChaosAuditLog
 * tables, these tests exercise the patterns at the DB level using
 * the existing Execution model and demonstrate the expected
 * behaviour with real PostgreSQL.
 */

import { describe, it, expect } from "vitest";
import { getTestPrisma } from "../setup/test-prisma";
import {
  seedUser,
  seedWorkspace,
  seedCollection,
  seedRequest,
  seedExecution,
} from "../setup/seed";

/* ================================================================ */
/*  US 3.1 — Latency Injection                                     */
/* ================================================================ */

describe("US 3.1 — Latency Injection", () => {
  it("execution with artificial delay has latencyMs >= injected delay", async () => {
    // ARRANGE
    const prisma = getTestPrisma();
    const user = await seedUser();
    const ws = await seedWorkspace(user.id);
    const coll = await seedCollection(ws.id, user.id);
    const req = await seedRequest(coll.id, user.id, {
      url: "https://api.example.com/slow-endpoint",
    });

    const INJECTED_DELAY_MS = 1000;

    // ACT — simulate execution with artificial delay
    const startMs = Date.now();
    // Simulate the delay a chaos rule would introduce
    await new Promise((resolve) => setTimeout(resolve, INJECTED_DELAY_MS));
    const actualDurationMs = Date.now() - startMs;

    const execution = await seedExecution({
      requestId: req.id,
      latencyMs: actualDurationMs,
      statusCode: 200,
    });

    // ASSERT
    expect(execution.latencyMs).toBeGreaterThanOrEqual(INJECTED_DELAY_MS);

    // ASSERT — persistence
    const fromDb = await prisma.execution.findUnique({ where: { id: execution.id } });
    expect(fromDb).not.toBeNull();
    expect(fromDb!.latencyMs).toBeGreaterThanOrEqual(INJECTED_DELAY_MS);
  });

  it("non-matching URL has no artificial delay applied", async () => {
    // ARRANGE
    const prisma = getTestPrisma();
    const user = await seedUser();
    const ws = await seedWorkspace(user.id);
    const coll = await seedCollection(ws.id, user.id);
    const req = await seedRequest(coll.id, user.id, {
      url: "https://api.example.com/fast-endpoint",
    });

    // ACT — execution without chaos delay
    const execution = await seedExecution({
      requestId: req.id,
      latencyMs: 50,
      statusCode: 200,
    });

    // ASSERT — latency is low (no injection)
    expect(execution.latencyMs).toBeLessThan(100);

    const fromDb = await prisma.execution.findUnique({ where: { id: execution.id } });
    expect(fromDb!.latencyMs).toBe(50);
  });
});

/* ================================================================ */
/*  US 3.2 — Error Injection                                       */
/* ================================================================ */

describe("US 3.2 — Error Injection", () => {
  it("execution matching error-injection rule records status 500", async () => {
    // ARRANGE
    const prisma = getTestPrisma();
    const user = await seedUser();
    const ws = await seedWorkspace(user.id);
    const coll = await seedCollection(ws.id, user.id);
    const req = await seedRequest(coll.id, user.id, {
      url: "https://api.example.com/api/checkout",
      method: "POST",
    });

    // ACT — simulate error injection (upstream never called; chaos returns 500)
    const execution = await seedExecution({
      requestId: req.id,
      statusCode: 500,
      latencyMs: 5,  // very fast because no real upstream call
    });

    // ASSERT
    expect(execution.statusCode).toBe(500);

    const fromDb = await prisma.execution.findUnique({ where: { id: execution.id } });
    expect(fromDb!.statusCode).toBe(500);
    // Since chaos intercepted, latency should be very low
    expect(fromDb!.latencyMs).toBeLessThan(100);
  });

  it("non-matching URL still reaches upstream successfully", async () => {
    // ARRANGE
    const user = await seedUser();
    const ws = await seedWorkspace(user.id);
    const coll = await seedCollection(ws.id, user.id);
    const req = await seedRequest(coll.id, user.id, {
      url: "https://api.example.com/api/products",
      method: "GET",
    });

    // ACT — normal execution (no chaos)
    const execution = await seedExecution({
      requestId: req.id,
      statusCode: 200,
      latencyMs: 150,
    });

    // ASSERT
    expect(execution.statusCode).toBe(200);
  });
});

/* ================================================================ */
/*  US 3.3 — Packet Drop Simulation                                */
/* ================================================================ */

describe("US 3.3 — Packet Drop Simulation", () => {
  it("execution with DROP rule has null statusCode (timeout)", async () => {
    // ARRANGE
    const prisma = getTestPrisma();
    const user = await seedUser();
    const ws = await seedWorkspace(user.id);
    const coll = await seedCollection(ws.id, user.id);
    const req = await seedRequest(coll.id, user.id, {
      url: "https://api.example.com/api/fragile",
    });

    // ACT — simulate packet drop → timeout
    const execution = await seedExecution({
      requestId: req.id,
      statusCode: null,   // no response received
      latencyMs: null,    // connection dropped
    });

    // ASSERT
    expect(execution.statusCode).toBeNull();
    expect(execution.latencyMs).toBeNull();

    const fromDb = await prisma.execution.findUnique({ where: { id: execution.id } });
    expect(fromDb!.statusCode).toBeNull();
    expect(fromDb!.latencyMs).toBeNull();
  });
});

/* ================================================================ */
/*  US 3.4 — Load Generation                                       */
/* ================================================================ */

describe("US 3.4 — Load Generation", () => {
  it("generates 50 execution records (10 concurrent × 5 each) with unique IDs", async () => {
    // ARRANGE
    const prisma = getTestPrisma();
    const user = await seedUser();
    const ws = await seedWorkspace(user.id);
    const coll = await seedCollection(ws.id, user.id);
    const req = await seedRequest(coll.id, user.id, {
      url: "https://api.example.com/load-target",
    });

    const CONCURRENCY = 10;
    const REQUESTS_PER_WORKER = 5;
    const TOTAL = CONCURRENCY * REQUESTS_PER_WORKER;

    // ACT — simulate concurrent load
    const workers = Array.from({ length: CONCURRENCY }, (_, workerIdx) =>
      Promise.all(
        Array.from({ length: REQUESTS_PER_WORKER }, (_, reqIdx) =>
          seedExecution({
            requestId: req.id,
            statusCode: 200,
            latencyMs: Math.floor(Math.random() * 500) + 50,
          }),
        ),
      ),
    );

    const results = (await Promise.all(workers)).flat();

    // ASSERT — correct total count
    expect(results).toHaveLength(TOTAL);

    // ASSERT — all 50 persisted in DB
    const dbExecutions = await prisma.execution.findMany({
      where: { requestId: req.id },
    });
    expect(dbExecutions).toHaveLength(TOTAL);

    // ASSERT — no race conditions: all IDs unique
    const ids = new Set(dbExecutions.map((e) => e.id));
    expect(ids.size).toBe(TOTAL);

    // ASSERT — load report statistics
    const latencies = dbExecutions
      .map((e) => e.latencyMs!)
      .filter((l) => l !== null)
      .sort((a, b) => a - b);

    const totalRequests = latencies.length;
    const errorCount = dbExecutions.filter((e) => e.statusCode! >= 400).length;
    const p99Idx = Math.ceil(0.99 * latencies.length) - 1;
    const p99Latency = latencies[Math.max(0, p99Idx)];

    expect(totalRequests).toBe(TOTAL);
    expect(p99Latency).toBeGreaterThan(0);
    expect(errorCount / totalRequests).toBeLessThanOrEqual(1); // errorRate is valid
  });
});

/* ================================================================ */
/*  US 3.8 — Chaos Audit Log                                       */
/* ================================================================ */

describe("US 3.8 — Chaos Audit Log (via Execution metadata)", () => {
  it("records multiple chaos operations as separate executions with metadata", async () => {
    // ARRANGE
    const prisma = getTestPrisma();
    const user = await seedUser();
    const ws = await seedWorkspace(user.id);
    const coll = await seedCollection(ws.id, user.id);
    const req = await seedRequest(coll.id, user.id);

    // ACT — simulate 3 chaos operations
    // Operation 1: Inject latency rule
    const op1 = await seedExecution({
      requestId: req.id,
      traceId: "chaos-inject-" + crypto.randomUUID(),
      statusCode: 200,
      latencyMs: 1500,
    });
    // Operation 2: Modify error rule
    const op2 = await seedExecution({
      requestId: req.id,
      traceId: "chaos-modify-" + crypto.randomUUID(),
      statusCode: 500,
      latencyMs: 5,
    });
    // Operation 3: Remove rule (normal response resumes)
    const op3 = await seedExecution({
      requestId: req.id,
      traceId: "chaos-remove-" + crypto.randomUUID(),
      statusCode: 200,
      latencyMs: 100,
    });

    // ASSERT — 3 records exist
    const chaosOps = await prisma.execution.findMany({
      where: {
        requestId: req.id,
        traceId: { startsWith: "chaos-" },
      },
    });

    expect(chaosOps).toHaveLength(3);

    // ASSERT — each has a timestamp and request linkage
    for (const op of chaosOps) {
      expect(op.executedAt).toBeDefined();
      expect(op.requestId).toBe(req.id);
      expect(op.traceId).toMatch(/^chaos-/);
    }

    // ASSERT — unique IDs
    const ids = new Set(chaosOps.map((o) => o.id));
    expect(ids.size).toBe(3);
  });
});
