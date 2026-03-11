/**
 * Seed helpers for integration tests.
 *
 * Every helper inserts real rows into the Testcontainer DB
 * via Prisma and returns the created record with its real ID.
 */

import type { HttpMethod } from "@prisma/client";
import { getTestPrisma } from "./test-prisma";

/* ------------------------------------------------------------------ */
/*  seedUser                                                          */
/* ------------------------------------------------------------------ */

export async function seedUser(
  overrides: { id?: string; email?: string; name?: string } = {},
): Promise<{ id: string; email: string; name: string | null; createdAt: Date }> {
  const prisma = getTestPrisma();
  const id = overrides.id ?? crypto.randomUUID();
  return prisma.user.create({
    data: {
      id,
      email: overrides.email ?? `${id}@test.local`,
      name: overrides.name ?? null,
    },
  });
}

/* ------------------------------------------------------------------ */
/*  seedWorkspace                                                     */
/* ------------------------------------------------------------------ */

export async function seedWorkspace(
  userId: string,
  overrides: { name?: string } = {},
): Promise<{
  id: string;
  name: string;
  createdAt: Date;
  userWorkspaceId: string;
}> {
  const prisma = getTestPrisma();
  const workspace = await prisma.workspace.create({
    data: {
      name: overrides.name ?? `workspace-${crypto.randomUUID().slice(0, 8)}`,
    },
  });

  const uw = await prisma.userWorkspace.create({
    data: {
      userId,
      workspaceId: workspace.id,
      role: "admin",
    },
  });

  return {
    id: workspace.id,
    name: workspace.name,
    createdAt: workspace.createdAt,
    userWorkspaceId: uw.id,
  };
}

/* ------------------------------------------------------------------ */
/*  seedCollection                                                    */
/* ------------------------------------------------------------------ */

export async function seedCollection(
  workspaceId: string,
  userId: string,
  overrides: { name?: string } = {},
): Promise<{ id: string; name: string; workspaceId: string; createdById: string; createdAt: Date }> {
  const prisma = getTestPrisma();
  return prisma.collection.create({
    data: {
      name: overrides.name ?? `collection-${crypto.randomUUID().slice(0, 8)}`,
      workspaceId,
      createdById: userId,
    },
  });
}

/* ------------------------------------------------------------------ */
/*  seedRequest                                                       */
/* ------------------------------------------------------------------ */

export async function seedRequest(
  collectionId: string,
  userId: string,
  overrides: {
    name?: string;
    method?: HttpMethod;
    url?: string;
    headers?: Record<string, string> | null;
    body?: string | null;
  } = {},
): Promise<{
  id: string;
  name: string;
  method: HttpMethod;
  url: string;
  headers: unknown;
  body: string | null;
  collectionId: string;
  createdById: string;
  createdAt: Date;
}> {
  const prisma = getTestPrisma();
  return prisma.request.create({
    data: {
      name: overrides.name ?? `req-${crypto.randomUUID().slice(0, 8)}`,
      method: overrides.method ?? "GET",
      url: overrides.url ?? "https://httpbin.org/get",
      headers: overrides.headers ?? null,
      body: overrides.body ?? null,
      collectionId,
      createdById: userId,
    },
  });
}

/* ------------------------------------------------------------------ */
/*  seedExecution                                                     */
/* ------------------------------------------------------------------ */

export async function seedExecution(
  overrides: {
    requestId?: string | null;
    traceId?: string;
    statusCode?: number | null;
    latencyMs?: number | null;
    executedAt?: Date;
  } = {},
): Promise<{
  id: string;
  requestId: string | null;
  traceId: string;
  statusCode: number | null;
  latencyMs: number | null;
  executedAt: Date;
}> {
  const prisma = getTestPrisma();
  return prisma.execution.create({
    data: {
      requestId: "requestId" in overrides ? (overrides.requestId as string | null) : null,
      traceId: overrides.traceId ?? crypto.randomUUID(),
      statusCode: "statusCode" in overrides ? (overrides.statusCode as number | null) : 200,
      latencyMs: "latencyMs" in overrides ? (overrides.latencyMs as number | null) : 100,
      executedAt: overrides.executedAt ?? new Date(),
    },
  });
}

/* ------------------------------------------------------------------ */
/*  seedSpan                                                          */
/* ------------------------------------------------------------------ */

export async function seedSpan(
  overrides: {
    traceId?: string;
    spanId?: string;
    parentSpanId?: string | null;
    operation?: string;
    serviceName?: string;
    startTime?: bigint;
    duration?: bigint;
    status?: string | null;
    tags?: Record<string, string> | null;
  } = {},
): Promise<{
  id: string;
  traceId: string;
  spanId: string;
  parentSpanId: string | null;
  operation: string;
  serviceName: string;
  startTime: bigint;
  duration: bigint;
  status: string | null;
  tags: unknown;
  createdAt: Date;
}> {
  const prisma = getTestPrisma();
  return prisma.span.create({
    data: {
      traceId: overrides.traceId ?? crypto.randomUUID(),
      spanId: overrides.spanId ?? crypto.randomUUID().slice(0, 16),
      parentSpanId: overrides.parentSpanId ?? null,
      operation: overrides.operation ?? "HTTP GET",
      serviceName: overrides.serviceName ?? "test-service",
      startTime: overrides.startTime ?? BigInt(Date.now() * 1_000_000),
      duration: overrides.duration ?? BigInt(100_000_000),
      status: overrides.status ?? "OK",
      tags: overrides.tags ?? null,
    },
  });
}

/* ------------------------------------------------------------------ */
/*  seedEnvironment                                                   */
/* ------------------------------------------------------------------ */

export async function seedEnvironment(
  workspaceId: string,
  overrides: {
    name?: string;
    variables?: Record<string, string>;
  } = {},
): Promise<{
  id: string;
  name: string;
  variables: unknown;
  workspaceId: string;
  createdAt: Date;
}> {
  const prisma = getTestPrisma();
  return prisma.environment.create({
    data: {
      name: overrides.name ?? "test-env",
      variables: overrides.variables ?? {},
      workspaceId,
    },
  });
}

/* ------------------------------------------------------------------ */
/*  seedWorkflow (with optional inline steps)                         */
/* ------------------------------------------------------------------ */

export async function seedWorkflow(
  workspaceId: string,
  userId: string,
  overrides: {
    name?: string;
    description?: string | null;
  } = {},
): Promise<{
  id: string;
  workspaceId: string;
  name: string;
  description: string | null;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}> {
  const prisma = getTestPrisma();
  return prisma.workflow.create({
    data: {
      workspaceId,
      name: overrides.name ?? `wf-${crypto.randomUUID().slice(0, 8)}`,
      description: overrides.description ?? null,
      createdBy: userId,
    },
  });
}

/* ------------------------------------------------------------------ */
/*  seedWorkflowStep                                                  */
/* ------------------------------------------------------------------ */

export async function seedWorkflowStep(
  workflowId: string,
  requestId: string,
  stepOrder: number,
  overrides: {
    protocol?: "REST" | "GRAPHQL" | "GRPC";
    retryCount?: number;
    timeoutMs?: number | null;
    condition?: string | null;
  } = {},
) {
  const prisma = getTestPrisma();
  return prisma.workflowStep.create({
    data: {
      workflowId,
      requestId,
      protocol: overrides.protocol ?? "REST",
      stepOrder,
      retryCount: overrides.retryCount ?? 0,
      timeoutMs: overrides.timeoutMs ?? null,
      condition: overrides.condition ?? null,
    },
  });
}

/* ------------------------------------------------------------------ */
/*  seedUserWorkspace (for adding extra members / roles)               */
/* ------------------------------------------------------------------ */

export async function seedUserWorkspace(
  userId: string,
  workspaceId: string,
  role: "admin" | "editor" | "viewer" = "viewer",
) {
  const prisma = getTestPrisma();
  return prisma.userWorkspace.create({
    data: { userId, workspaceId, role },
  });
}
