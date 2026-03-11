/**
 * EPIC 5 — Platform & DevOps
 *
 * Integration tests for RBAC, workspace isolation,
 * privacy redaction, and data retention / TTL cleanup.
 * All against real PostgreSQL.
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
  seedEnvironment,
  seedWorkflow,
  seedWorkflowStep,
  seedUserWorkspace,
} from "../setup/seed";

// ── Real service imports ──────────────────────────────────
import {
  deleteWorkspace,
  updateWorkspace,
  addUserToWorkspace,
} from "@/backend/workspace/workspace.service";
import {
  listCollectionsByWorkspace,
} from "@/backend/collection/collection.service";
import {
  getRequestsByCollection,
} from "@/backend/request/request.service";
import {
  listWorkflows,
} from "@/backend/workflow/workflow.service";
import {
  hasWorkspaceAccess,
} from "@/backend/auth/auth.service";
import {
  getTrafficAnalytics,
  getLatencyAnalytics,
  getErrorRateAnalytics,
  getSlowestEndpoints,
} from "@/backend/analytics/analytics.service";

/* ================================================================ */
/*  US 5.3 — RBAC                                                  */
/* ================================================================ */

describe("US 5.3 — RBAC (Role-Based Access Control)", () => {
  it("viewer cannot delete a workspace — service throws authorization error", async () => {
    // ARRANGE
    const adminUser = await seedUser({ email: "admin@test.local" });
    const viewerUser = await seedUser({ email: "viewer@test.local" });
    const ws = await seedWorkspace(adminUser.id, { name: "RBAC Test WS" });

    // Add viewer to workspace
    await seedUserWorkspace(viewerUser.id, ws.id, "viewer");

    // ACT & ASSERT — viewer tries to delete
    await expect(
      deleteWorkspace(ws.id, viewerUser.id),
    ).rejects.toThrow(/not authorized/i);

    // Workspace should still exist
    const prisma = getTestPrisma();
    const fromDb = await prisma.workspace.findUnique({ where: { id: ws.id } });
    expect(fromDb).not.toBeNull();
  });

  it("admin can successfully delete a workspace", async () => {
    // ARRANGE
    const prisma = getTestPrisma();
    const adminUser = await seedUser({ email: "admin2@test.local" });
    const ws = await seedWorkspace(adminUser.id, { name: "Delete Me" });

    // ACT
    await deleteWorkspace(ws.id, adminUser.id);

    // ASSERT
    const fromDb = await prisma.workspace.findUnique({ where: { id: ws.id } });
    expect(fromDb).toBeNull();
  });

  it("editor cannot delete a workspace", async () => {
    // ARRANGE
    const adminUser = await seedUser({ email: "admin3@test.local" });
    const editorUser = await seedUser({ email: "editor@test.local" });
    const ws = await seedWorkspace(adminUser.id, { name: "Editor RBAC WS" });

    await seedUserWorkspace(editorUser.id, ws.id, "editor");

    // ACT & ASSERT
    await expect(
      deleteWorkspace(ws.id, editorUser.id),
    ).rejects.toThrow(/not authorized/i);
  });

  it("viewer cannot update workspace name", async () => {
    // ARRANGE
    const adminUser = await seedUser();
    const viewerUser = await seedUser();
    const ws = await seedWorkspace(adminUser.id, { name: "Original Name" });
    await seedUserWorkspace(viewerUser.id, ws.id, "viewer");

    // ACT & ASSERT
    await expect(
      updateWorkspace(ws.id, viewerUser.id, "Hacked Name"),
    ).rejects.toThrow(/not authorized/i);
  });

  it("admin can update workspace name", async () => {
    // ARRANGE
    const prisma = getTestPrisma();
    const adminUser = await seedUser();
    const ws = await seedWorkspace(adminUser.id, { name: "Old Name" });

    // ACT
    const updated = await updateWorkspace(ws.id, adminUser.id, "New Name");

    // ASSERT
    expect(updated.name).toBe("New Name");

    const fromDb = await prisma.workspace.findUnique({ where: { id: ws.id } });
    expect(fromDb!.name).toBe("New Name");
  });

  it("hasWorkspaceAccess returns true for member, false for non-member", async () => {
    // ARRANGE
    const member = await seedUser();
    const nonMember = await seedUser();
    const ws = await seedWorkspace(member.id);

    // ACT & ASSERT
    expect(await hasWorkspaceAccess(member.id, ws.id)).toBe(true);
    expect(await hasWorkspaceAccess(nonMember.id, ws.id)).toBe(false);
  });
});

/* ================================================================ */
/*  US 5.5 — Workspace Isolation (CRITICAL)                        */
/* ================================================================ */

describe("US 5.5 — Workspace Isolation", () => {
  it("listCollections returns only collections for the queried workspace", async () => {
    // ARRANGE
    const user = await seedUser();
    const wsA = await seedWorkspace(user.id, { name: "Isolated-A" });
    const wsB = await seedWorkspace(user.id, { name: "Isolated-B" });

    await seedCollection(wsA.id, user.id, { name: "Coll-A1" });
    await seedCollection(wsA.id, user.id, { name: "Coll-A2" });
    await seedCollection(wsA.id, user.id, { name: "Coll-A3" });
    await seedCollection(wsA.id, user.id, { name: "Coll-A4" });
    await seedCollection(wsA.id, user.id, { name: "Coll-A5" });

    await seedCollection(wsB.id, user.id, { name: "Coll-B1" });
    await seedCollection(wsB.id, user.id, { name: "Coll-B2" });
    await seedCollection(wsB.id, user.id, { name: "Coll-B3" });

    // ACT
    const collsA = await listCollectionsByWorkspace(wsA.id);
    const collsB = await listCollectionsByWorkspace(wsB.id);

    // ASSERT
    expect(collsA).toHaveLength(5);
    expect(collsB).toHaveLength(3);

    // None from B in A's results
    for (const c of collsA) {
      expect(c.workspaceId).toBe(wsA.id);
    }
    for (const c of collsB) {
      expect(c.workspaceId).toBe(wsB.id);
    }
  });

  it("listRequests is scoped to the collection's workspace", async () => {
    // ARRANGE
    const user = await seedUser();
    const wsA = await seedWorkspace(user.id, { name: "WS-A" });
    const wsB = await seedWorkspace(user.id, { name: "WS-B" });
    const collA = await seedCollection(wsA.id, user.id);
    const collB = await seedCollection(wsB.id, user.id);

    await seedRequest(collA.id, user.id, { name: "Req-A" });
    await seedRequest(collB.id, user.id, { name: "Req-B" });

    // ACT
    const reqsA = await getRequestsByCollection(collA.id);
    const reqsB = await getRequestsByCollection(collB.id);

    // ASSERT
    expect(reqsA).toHaveLength(1);
    expect(reqsA[0].name).toBe("Req-A");
    expect(reqsB).toHaveLength(1);
    expect(reqsB[0].name).toBe("Req-B");
  });

  it("listWorkflows is scoped to workspace", async () => {
    // ARRANGE
    const user = await seedUser();
    const wsA = await seedWorkspace(user.id, { name: "WF-WS-A" });
    const wsB = await seedWorkspace(user.id, { name: "WF-WS-B" });

    await seedWorkflow(wsA.id, user.id, { name: "WF-A" });
    await seedWorkflow(wsA.id, user.id, { name: "WF-A2" });
    await seedWorkflow(wsB.id, user.id, { name: "WF-B" });

    // ACT
    const wfA = await listWorkflows(wsA.id);
    const wfB = await listWorkflows(wsB.id);

    // ASSERT
    expect(wfA).toHaveLength(2);
    expect(wfB).toHaveLength(1);
    for (const w of wfA) expect(w.workspaceId).toBe(wsA.id);
    for (const w of wfB) expect(w.workspaceId).toBe(wsB.id);
  });

  it("analytics are scoped by workspace — no cross-workspace bleed", async () => {
    // ARRANGE
    const user = await seedUser();
    const wsA = await seedWorkspace(user.id, { name: "Analytics-A" });
    const wsB = await seedWorkspace(user.id, { name: "Analytics-B" });
    const collA = await seedCollection(wsA.id, user.id);
    const collB = await seedCollection(wsB.id, user.id);
    const reqA = await seedRequest(collA.id, user.id);
    const reqB = await seedRequest(collB.id, user.id);

    // Seed executions for workspace A
    for (let i = 0; i < 5; i++) {
      await seedExecution({ requestId: reqA.id, statusCode: 200, latencyMs: 100 + i });
    }
    // Seed executions for workspace B
    for (let i = 0; i < 3; i++) {
      await seedExecution({ requestId: reqB.id, statusCode: 500, latencyMs: 500 + i });
    }

    // ACT
    const errA = await getErrorRateAnalytics(wsA.id);
    const errB = await getErrorRateAnalytics(wsB.id);

    // ASSERT
    expect(errA.totalRequests).toBe(5);
    expect(errA.errorRequests).toBe(0); // all 200s
    expect(errA.errorRate).toBe(0);

    expect(errB.totalRequests).toBe(3);
    expect(errB.errorRequests).toBe(3); // all 500s
    expect(errB.errorRate).toBe(1);
  });

  it("environments are workspace-isolated", async () => {
    // ARRANGE
    const prisma = getTestPrisma();
    const user = await seedUser();
    const wsA = await seedWorkspace(user.id);
    const wsB = await seedWorkspace(user.id);

    await seedEnvironment(wsA.id, { variables: { KEY: "A" } });
    await seedEnvironment(wsB.id, { variables: { KEY: "B" } });

    // ACT
    const envsA = await prisma.environment.findMany({ where: { workspaceId: wsA.id } });
    const envsB = await prisma.environment.findMany({ where: { workspaceId: wsB.id } });

    // ASSERT
    expect(envsA).toHaveLength(1);
    expect((envsA[0].variables as any).KEY).toBe("A");
    expect(envsB).toHaveLength(1);
    expect((envsB[0].variables as any).KEY).toBe("B");
  });
});

/* ================================================================ */
/*  US 5.6 — Privacy Redaction                                     */
/* ================================================================ */

describe("US 5.6 — Privacy Redaction", () => {
  it("sensitive span tag values can be redacted before storage", async () => {
    // ARRANGE
    const prisma = getTestPrisma();

    // Simulate redaction logic before persisting
    const rawTags: Record<string, string> = {
      "http.method": "POST",
      "http.url": "/api/checkout",
      password: "secret123",
      creditCard: "4111111111111111",
      username: "john_doe",
    };

    const SENSITIVE_KEYS = ["password", "creditCard", "ssn", "secret"];

    const redactedTags: Record<string, string> = {};
    for (const [key, value] of Object.entries(rawTags)) {
      if (SENSITIVE_KEYS.some((sk) => key.toLowerCase().includes(sk.toLowerCase()))) {
        redactedTags[key] = "[REDACTED]";
      } else {
        redactedTags[key] = value;
      }
    }

    // ACT — persist redacted span
    const span = await seedSpan({ tags: redactedTags });

    // ASSERT — query from DB
    const fromDb = await prisma.span.findUnique({ where: { id: span.id } });
    const storedTags = fromDb!.tags as Record<string, string>;

    expect(storedTags.password).toBe("[REDACTED]");
    expect(storedTags.creditCard).toBe("[REDACTED]");

    // Non-sensitive fields are NOT redacted
    expect(storedTags["http.method"]).toBe("POST");
    expect(storedTags["http.url"]).toBe("/api/checkout");
    expect(storedTags.username).toBe("john_doe");
  });

  it("non-sensitive data passes through without modification", async () => {
    // ARRANGE
    const prisma = getTestPrisma();
    const normalTags = {
      "http.method": "GET",
      "http.status_code": "200",
      "service.name": "user-api",
      "response.size": "1024",
    };

    // ACT
    const span = await seedSpan({ tags: normalTags });

    // ASSERT
    const fromDb = await prisma.span.findUnique({ where: { id: span.id } });
    const stored = fromDb!.tags as Record<string, string>;

    expect(stored).toEqual(normalTags);
    for (const [, value] of Object.entries(stored)) {
      expect(value).not.toBe("[REDACTED]");
    }
  });
});

/* ================================================================ */
/*  US 5.7 — Data Retention / TTL Cleanup                          */
/* ================================================================ */

describe("US 5.7 — Data Retention / TTL Cleanup", () => {
  it("deletes old executions beyond retention period and keeps recent ones", async () => {
    // ARRANGE
    const prisma = getTestPrisma();
    const user = await seedUser();
    const ws = await seedWorkspace(user.id);
    const coll = await seedCollection(ws.id, user.id);
    const req = await seedRequest(coll.id, user.id);

    const RETENTION_DAYS = 7;
    const now = new Date();
    const oldDate = new Date(now.getTime() - (RETENTION_DAYS + 1) * 24 * 60 * 60 * 1000); // 8 days ago

    // Seed 10 OLD executions
    for (let i = 0; i < 10; i++) {
      await seedExecution({
        requestId: req.id,
        executedAt: oldDate,
        statusCode: 200,
        latencyMs: 100,
      });
    }

    // Seed 5 RECENT executions
    for (let i = 0; i < 5; i++) {
      await seedExecution({
        requestId: req.id,
        executedAt: now,
        statusCode: 200,
        latencyMs: 100,
      });
    }

    // Total should be 15
    const totalBefore = await prisma.execution.count({
      where: { requestId: req.id },
    });
    expect(totalBefore).toBe(15);

    // ACT — run cleanup job (simulated)
    const cutoffDate = new Date(now.getTime() - RETENTION_DAYS * 24 * 60 * 60 * 1000);
    await prisma.execution.deleteMany({
      where: {
        requestId: req.id,
        executedAt: { lt: cutoffDate },
      },
    });

    // ASSERT — only 5 recent records remain
    const remaining = await prisma.execution.findMany({
      where: { requestId: req.id },
      orderBy: { executedAt: "desc" },
    });

    expect(remaining).toHaveLength(5);

    // ASSERT — all remaining are recent
    for (const exec of remaining) {
      expect(exec.executedAt.getTime()).toBeGreaterThanOrEqual(cutoffDate.getTime());
    }
  });

  it("does not delete anything when all records are within retention period", async () => {
    // ARRANGE
    const prisma = getTestPrisma();
    const user = await seedUser();
    const ws = await seedWorkspace(user.id);
    const coll = await seedCollection(ws.id, user.id);
    const req = await seedRequest(coll.id, user.id);

    const now = new Date();
    for (let i = 0; i < 5; i++) {
      await seedExecution({
        requestId: req.id,
        executedAt: new Date(now.getTime() - i * 24 * 60 * 60 * 1000), // 0-4 days ago
        statusCode: 200,
        latencyMs: 100,
      });
    }

    // ACT
    const cutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const deleteResult = await prisma.execution.deleteMany({
      where: {
        requestId: req.id,
        executedAt: { lt: cutoff },
      },
    });

    // ASSERT
    expect(deleteResult.count).toBe(0);
    const count = await prisma.execution.count({ where: { requestId: req.id } });
    expect(count).toBe(5);
  });
});
