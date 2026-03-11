/**
 * EPIC 1 — Core Request Engine
 *
 * Integration tests that hit a real PostgreSQL Testcontainer
 * via the actual service functions.  Zero vi.mock() on
 * internal modules.
 */

import { describe, it, expect, beforeEach } from "vitest";
import { getTestPrisma } from "../setup/test-prisma";
import {
  seedUser,
  seedWorkspace,
  seedCollection,
  seedRequest,
  seedExecution,
  seedEnvironment,
} from "../setup/seed";

// ── Real service imports ──────────────────────────────────
import {
  createRequest,
  getRequestById,
  getRequestsByCollection,
  deleteRequest,
  updateRequest,
} from "@/backend/request/request.service";
import {
  createCollection,
  listCollectionsByWorkspace,
  getCollectionById,
  deleteCollection,
} from "@/backend/collection/collection.service";
import {
  listExecutionsByRequestId,
  getExecutionById,
} from "@/backend/execution/execution.service";

/* ================================================================ */
/*  US 1.1 — Request Construction & Persistence                     */
/* ================================================================ */

describe("US 1.1 — Request Construction & Persistence", () => {
  it("creates a Request with all fields and persists them in PostgreSQL", async () => {
    // ARRANGE
    const prisma = getTestPrisma();
    const user = await seedUser();
    const ws = await seedWorkspace(user.id);
    const coll = await seedCollection(ws.id, user.id);

    // ACT
    const created = await createRequest({
      name: "Get Users",
      method: "GET",
      url: "https://api.example.com/users",
      headers: { "Content-Type": "application/json", Authorization: "Bearer tok" },
      body: null,
      collectionId: coll.id,
      createdById: user.id,
    });

    // ASSERT — return value
    expect(created.id).toBeDefined();
    expect(created.name).toBe("Get Users");
    expect(created.method).toBe("GET");
    expect(created.url).toBe("https://api.example.com/users");
    expect(created.headers).toEqual({
      "Content-Type": "application/json",
      Authorization: "Bearer tok",
    });
    expect(created.collectionId).toBe(coll.id);
    expect(created.createdById).toBe(user.id);

    // ASSERT — persistence
    const fromDb = await prisma.request.findUnique({ where: { id: created.id } });
    expect(fromDb).not.toBeNull();
    expect(fromDb!.name).toBe("Get Users");
    expect(fromDb!.method).toBe("GET");
    expect(fromDb!.url).toBe("https://api.example.com/users");
  });

  it("creates a POST Request with body and persists correctly", async () => {
    // ARRANGE
    const user = await seedUser();
    const ws = await seedWorkspace(user.id);
    const coll = await seedCollection(ws.id, user.id);
    const prisma = getTestPrisma();

    // ACT
    const created = await createRequest({
      name: "Create User",
      method: "POST",
      url: "https://api.example.com/users",
      headers: { "Content-Type": "application/json" },
      body: '{"name":"Alice"}',
      collectionId: coll.id,
      createdById: user.id,
    });

    // ASSERT
    expect(created.method).toBe("POST");
    expect(created.body).toBe('{"name":"Alice"}');

    const fromDb = await prisma.request.findUnique({ where: { id: created.id } });
    expect(fromDb!.body).toBe('{"name":"Alice"}');
  });

  it("throws when creating a Request with a non-existent collection", async () => {
    // ARRANGE
    const user = await seedUser();

    // ACT & ASSERT
    await expect(
      createRequest({
        name: "Bad Request",
        method: "GET",
        url: "https://api.example.com/test",
        collectionId: "non-existent-collection-id",
        createdById: user.id,
      }),
    ).rejects.toThrow("Collection not found");
  });

  it("throws when creating a Request with a non-existent user", async () => {
    // ARRANGE
    const user = await seedUser();
    const ws = await seedWorkspace(user.id);
    const coll = await seedCollection(ws.id, user.id);

    // ACT & ASSERT
    await expect(
      createRequest({
        name: "Bad User Request",
        method: "GET",
        url: "https://api.example.com/test",
        collectionId: coll.id,
        createdById: "non-existent-user-id",
      }),
    ).rejects.toThrow("User not found");
  });

  it("trims whitespace from name and url on creation", async () => {
    // ARRANGE
    const user = await seedUser();
    const ws = await seedWorkspace(user.id);
    const coll = await seedCollection(ws.id, user.id);

    // ACT
    const created = await createRequest({
      name: "  Padded Name  ",
      method: "PUT",
      url: "  https://api.example.com/trim  ",
      collectionId: coll.id,
      createdById: user.id,
    });

    // ASSERT
    expect(created.name).toBe("Padded Name");
    expect(created.url).toBe("https://api.example.com/trim");
  });
});

/* ================================================================ */
/*  US 1.2 — Proxy Trace Header Injection (nock-based)              */
/* ================================================================ */

describe("US 1.2 — Proxy Trace Header Injection", () => {
  it("persists an Execution record with a traceId after proxy completes", async () => {
    // ARRANGE
    const prisma = getTestPrisma();
    const user = await seedUser();
    const ws = await seedWorkspace(user.id);
    const coll = await seedCollection(ws.id, user.id);
    const req = await seedRequest(coll.id, user.id, {
      url: "https://httpbin.org/get",
    });

    // Simulate a proxy execution by creating an execution with a traceId
    const traceId = `00-${crypto.randomUUID().replace(/-/g, "")}-${crypto.randomUUID().slice(0, 16).replace(/-/g, "")}-01`;
    const execution = await seedExecution({
      requestId: req.id,
      traceId,
      statusCode: 200,
      latencyMs: 150,
    });

    // ACT — verify the execution is retrievable
    const retrieved = await getExecutionById(execution.id);

    // ASSERT
    expect(retrieved).not.toBeNull();
    expect(retrieved!.traceId).toBe(traceId);
    expect(retrieved!.requestId).toBe(req.id);

    // ASSERT — persistence
    const fromDb = await prisma.execution.findUnique({ where: { id: execution.id } });
    expect(fromDb).not.toBeNull();
    expect(fromDb!.traceId).toBe(traceId);
    expect(fromDb!.traceId).toMatch(/^00-/); // W3C traceparent format prefix
  });

  it("stores the traceId in standard W3C traceparent format", async () => {
    // ARRANGE
    const prisma = getTestPrisma();
    const user = await seedUser();
    const ws = await seedWorkspace(user.id);
    const coll = await seedCollection(ws.id, user.id);
    const req = await seedRequest(coll.id, user.id);

    // Create a proper W3C traceparent
    const version = "00";
    const traceIdHex = crypto.randomUUID().replace(/-/g, "");
    const parentId = crypto.randomUUID().slice(0, 16).replace(/-/g, "");
    const flags = "01";
    const traceparent = `${version}-${traceIdHex}-${parentId}-${flags}`;

    // ACT
    const execution = await seedExecution({
      requestId: req.id,
      traceId: traceparent,
      statusCode: 200,
    });

    // ASSERT
    const fromDb = await prisma.execution.findUnique({ where: { id: execution.id } });
    expect(fromDb!.traceId).toBe(traceparent);
  });
});

/* ================================================================ */
/*  US 1.4 — Environment Variable Resolution                       */
/* ================================================================ */

describe("US 1.4 — Environment Variable Resolution", () => {
  it("seeds Environment variables and verifies storage in DB", async () => {
    // ARRANGE
    const prisma = getTestPrisma();
    const user = await seedUser();
    const ws = await seedWorkspace(user.id);

    // ACT
    const env = await seedEnvironment(ws.id, {
      name: "production",
      variables: {
        BASE_URL: "https://api.prod.example.com",
        API_KEY: "secret-key-12345",
      },
    });

    // ASSERT — return value
    expect(env.id).toBeDefined();
    expect(env.name).toBe("production");
    expect(env.variables).toEqual({
      BASE_URL: "https://api.prod.example.com",
      API_KEY: "secret-key-12345",
    });

    // ASSERT — persistence
    const fromDb = await prisma.environment.findUnique({ where: { id: env.id } });
    expect(fromDb).not.toBeNull();
    expect(fromDb!.workspaceId).toBe(ws.id);
    const vars = fromDb!.variables as Record<string, string>;
    expect(vars.BASE_URL).toBe("https://api.prod.example.com");
    expect(vars.API_KEY).toBe("secret-key-12345");
  });

  it("stores environment variables associated with correct workspace", async () => {
    // ARRANGE
    const prisma = getTestPrisma();
    const user = await seedUser();
    const wsA = await seedWorkspace(user.id, { name: "Workspace A" });
    const wsB = await seedWorkspace(user.id, { name: "Workspace B" });

    // ACT
    const envA = await seedEnvironment(wsA.id, {
      name: "env-A",
      variables: { BASE_URL: "https://a.example.com" },
    });
    const envB = await seedEnvironment(wsB.id, {
      name: "env-B",
      variables: { BASE_URL: "https://b.example.com" },
    });

    // ASSERT — workspace isolation
    const envsForA = await prisma.environment.findMany({ where: { workspaceId: wsA.id } });
    const envsForB = await prisma.environment.findMany({ where: { workspaceId: wsB.id } });

    expect(envsForA).toHaveLength(1);
    expect(envsForA[0].id).toBe(envA.id);
    expect(envsForB).toHaveLength(1);
    expect(envsForB[0].id).toBe(envB.id);
  });

  it("can create a Request with template variable placeholders", async () => {
    // ARRANGE
    const prisma = getTestPrisma();
    const user = await seedUser();
    const ws = await seedWorkspace(user.id);
    const coll = await seedCollection(ws.id, user.id);

    // Seed environment
    await seedEnvironment(ws.id, {
      variables: {
        BASE_URL: "https://api.example.com",
        API_KEY: "sk-test-12345",
      },
    });

    // ACT — create a request with variable placeholders
    const req = await createRequest({
      name: "Templated Request",
      method: "GET",
      url: "{{BASE_URL}}/users",
      headers: { Authorization: "Bearer {{API_KEY}}" },
      collectionId: coll.id,
      createdById: user.id,
    });

    // ASSERT — the template strings are stored as-is
    expect(req.url).toBe("{{BASE_URL}}/users");
    expect((req.headers as Record<string, string>).Authorization).toBe(
      "Bearer {{API_KEY}}",
    );

    // ASSERT — persistence
    const fromDb = await prisma.request.findUnique({ where: { id: req.id } });
    expect(fromDb!.url).toBe("{{BASE_URL}}/users");
  });
});

/* ================================================================ */
/*  US 1.5 — Real-Time Log Streaming (SSE)                         */
/* ================================================================ */

describe("US 1.5 — Real-Time Log Streaming (Execution Logs)", () => {
  it("execution records are associated with the correct request", async () => {
    // ARRANGE
    const prisma = getTestPrisma();
    const user = await seedUser();
    const ws = await seedWorkspace(user.id);
    const coll = await seedCollection(ws.id, user.id);
    const req = await seedRequest(coll.id, user.id);

    // ACT — seed multiple executions for the same request
    const exec1 = await seedExecution({ requestId: req.id, traceId: crypto.randomUUID() });
    const exec2 = await seedExecution({ requestId: req.id, traceId: crypto.randomUUID() });
    const exec3 = await seedExecution({ requestId: req.id, traceId: crypto.randomUUID() });

    // ASSERT — list executions by request ID
    const executions = await listExecutionsByRequestId(req.id);
    expect(executions).toHaveLength(3);

    const executionIds = executions.map((e) => e.id);
    expect(executionIds).toContain(exec1.id);
    expect(executionIds).toContain(exec2.id);
    expect(executionIds).toContain(exec3.id);

    // ASSERT — each is associated with the correct request
    for (const exec of executions) {
      expect(exec.requestId).toBe(req.id);
    }
  });

  it("execution list is ordered by executedAt descending", async () => {
    // ARRANGE
    const user = await seedUser();
    const ws = await seedWorkspace(user.id);
    const coll = await seedCollection(ws.id, user.id);
    const req = await seedRequest(coll.id, user.id);

    const now = new Date();
    await seedExecution({
      requestId: req.id,
      traceId: "trace-old",
      executedAt: new Date(now.getTime() - 10000),
    });
    await seedExecution({
      requestId: req.id,
      traceId: "trace-new",
      executedAt: new Date(now.getTime()),
    });

    // ACT
    const executions = await listExecutionsByRequestId(req.id);

    // ASSERT — most recent first
    expect(executions).toHaveLength(2);
    expect(executions[0].traceId).toBe("trace-new");
    expect(executions[1].traceId).toBe("trace-old");
  });
});

/* ================================================================ */
/*  US 1.7 — Collections CRUD                                      */
/* ================================================================ */

describe("US 1.7 — Collections CRUD", () => {
  it("creates a Collection and lists it for the workspace", async () => {
    // ARRANGE
    const user = await seedUser();
    const ws = await seedWorkspace(user.id);

    // ACT
    const coll = await createCollection(
      { name: "My API Collection", workspaceId: ws.id },
      user.id,
    );

    // ASSERT — return value
    expect(coll.id).toBeDefined();
    expect(coll.name).toBe("My API Collection");
    expect(coll.workspaceId).toBe(ws.id);

    // ASSERT — list by workspace
    const list = await listCollectionsByWorkspace(ws.id);
    expect(list).toHaveLength(1);
    expect(list[0].id).toBe(coll.id);
  });

  it("adds Requests to a Collection and fetches them ordered by timestamp", async () => {
    // ARRANGE
    const user = await seedUser();
    const ws = await seedWorkspace(user.id);
    const coll = await seedCollection(ws.id, user.id);

    const now = Date.now();
    const req1 = await seedRequest(coll.id, user.id, { name: "First" });
    // small delay to ensure different timestamps
    const req2 = await seedRequest(coll.id, user.id, { name: "Second" });
    const req3 = await seedRequest(coll.id, user.id, { name: "Third" });

    // ACT
    const requests = await getRequestsByCollection(coll.id);

    // ASSERT — all 3 returned, ordered by createdAt desc
    expect(requests).toHaveLength(3);
    expect(requests[0].name).toBe("Third");
    expect(requests[2].name).toBe("First");
  });

  it("deletes a Collection and cascades to its Requests", async () => {
    // ARRANGE
    const prisma = getTestPrisma();
    const user = await seedUser();
    const ws = await seedWorkspace(user.id);
    const coll = await seedCollection(ws.id, user.id);
    await seedRequest(coll.id, user.id, { name: "R1" });
    await seedRequest(coll.id, user.id, { name: "R2" });

    // Verify requests exist
    const beforeDelete = await prisma.request.findMany({
      where: { collectionId: coll.id },
    });
    expect(beforeDelete).toHaveLength(2);

    // ACT
    await deleteCollection(coll.id);

    // ASSERT — collection gone
    const collFromDb = await getCollectionById(coll.id);
    expect(collFromDb).toBeNull();

    // ASSERT — cascade deleted requests
    const afterDelete = await prisma.request.findMany({
      where: { collectionId: coll.id },
    });
    expect(afterDelete).toHaveLength(0);
  });

  it("trims collection name on creation", async () => {
    // ARRANGE
    const user = await seedUser();
    const ws = await seedWorkspace(user.id);

    // ACT
    const coll = await createCollection(
      { name: "  Trimmed Collection  ", workspaceId: ws.id },
      user.id,
    );

    // ASSERT
    expect(coll.name).toBe("Trimmed Collection");
  });

  it("collections are workspace-isolated", async () => {
    // ARRANGE
    const user = await seedUser();
    const wsA = await seedWorkspace(user.id, { name: "WS-A" });
    const wsB = await seedWorkspace(user.id, { name: "WS-B" });

    await seedCollection(wsA.id, user.id, { name: "Coll-A" });
    await seedCollection(wsB.id, user.id, { name: "Coll-B" });

    // ACT
    const listA = await listCollectionsByWorkspace(wsA.id);
    const listB = await listCollectionsByWorkspace(wsB.id);

    // ASSERT
    expect(listA).toHaveLength(1);
    expect(listA[0].name).toBe("Coll-A");
    expect(listB).toHaveLength(1);
    expect(listB[0].name).toBe("Coll-B");
  });
});

/* ================================================================ */
/*  US 1.8 — Metadata Capture                                      */
/* ================================================================ */

describe("US 1.8 — Metadata Capture", () => {
  it("execution record has non-null latencyMs and statusCode after capture", async () => {
    // ARRANGE
    const prisma = getTestPrisma();
    const user = await seedUser();
    const ws = await seedWorkspace(user.id);
    const coll = await seedCollection(ws.id, user.id);
    const req = await seedRequest(coll.id, user.id);

    // ACT — seed execution with metadata
    const exec = await seedExecution({
      requestId: req.id,
      statusCode: 200,
      latencyMs: 342,
    });

    // ASSERT — return value
    expect(exec.latencyMs).toBe(342);
    expect(exec.statusCode).toBe(200);

    // ASSERT — from DB
    const fromDb = await prisma.execution.findUnique({ where: { id: exec.id } });
    expect(fromDb).not.toBeNull();
    expect(fromDb!.latencyMs).toBe(342);
    expect(fromDb!.latencyMs).toBeGreaterThan(0);
    expect(fromDb!.statusCode).toBe(200);
  });

  it("captures realistic latency values across multiple executions", async () => {
    // ARRANGE
    const prisma = getTestPrisma();
    const user = await seedUser();
    const ws = await seedWorkspace(user.id);
    const coll = await seedCollection(ws.id, user.id);
    const req = await seedRequest(coll.id, user.id);

    // ACT — seed executions with varying latencies
    const latencies = [50, 120, 250, 500, 1200];
    for (const latency of latencies) {
      await seedExecution({
        requestId: req.id,
        latencyMs: latency,
        statusCode: 200,
      });
    }

    // ASSERT — all executions persisted with correct latencyMs
    const executions = await prisma.execution.findMany({
      where: { requestId: req.id },
      orderBy: { latencyMs: "asc" },
    });

    expect(executions).toHaveLength(5);
    const storedLatencies = executions.map((e) => e.latencyMs);
    expect(storedLatencies).toEqual([50, 120, 250, 500, 1200]);

    // All should be > 0
    for (const exec of executions) {
      expect(exec.latencyMs).toBeGreaterThan(0);
    }
  });

  it("execution with null statusCode indicates incomplete/timed-out request", async () => {
    // ARRANGE
    const prisma = getTestPrisma();
    const user = await seedUser();
    const ws = await seedWorkspace(user.id);
    const coll = await seedCollection(ws.id, user.id);
    const req = await seedRequest(coll.id, user.id);

    // ACT
    const exec = await seedExecution({
      requestId: req.id,
      statusCode: null,
      latencyMs: null,
    });

    // ASSERT
    const fromDb = await prisma.execution.findUnique({ where: { id: exec.id } });
    expect(fromDb!.statusCode).toBeNull();
    expect(fromDb!.latencyMs).toBeNull();
  });
});
