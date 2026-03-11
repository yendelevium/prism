import { request } from "@playwright/test";

/**
 * Wraps the test-only API endpoint for E2E fast database manipulation 
 * without requiring direct Prisma access inside Playwright worker nodes.
 */

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

async function getApi() {
  return await request.newContext({ baseURL: BASE_URL });
}

/**
 * Absolutely clear out all E2E artifacts to start fresh.
 */
export async function resetDatabase() {
  const api = await getApi();
  const resp = await api.post("/api/test/seed?action=reset");
  if (!resp.ok()) {
    throw new Error(`Failed to reset database: ${resp.status()}`);
  }
}

export async function seedWorkspace(
  userId: string,
  role: "admin" | "editor" | "viewer" = "admin",
) {
  const api = await getApi();
  const resp = await api.post("/api/test/seed?action=workspace", {
    data: { userId, role },
  });
  const data = await resp.json();
  return data;
}

export async function seedFlowSegment(
  workspaceId: string,
  userId: string,
) {
  const api = await getApi();
  const resp = await api.post("/api/test/seed?action=collection", {
    data: { workspaceId, userId },
  });
  const data = await resp.json();
  return data as { collectionId: string };
}

export async function seedRequest(
  collectionId: string,
  userId: string,
  overrides?: { name?: string; url?: string; method?: string },
) {
  const api = await getApi();
  const resp = await api.post("/api/test/seed?action=request", {
    data: { collectionId, userId, ...overrides },
  });
  const data = await resp.json();
  return data as { requestId: string };
}

export async function seedExecution(
  requestId: string,
  statusCode: number | null = 200,
  latencyMs: number | null = 100,
) {
  const api = await getApi();
  const resp = await api.post("/api/test/seed?action=execution", {
    data: { requestId, statusCode, latencyMs },
  });
  const data = await resp.json();
  return data;
}

export async function seedWorkflow(
  workspaceId: string,
  userId: string,
) {
  const api = await getApi();
  const resp = await api.post("/api/test/seed?action=workflow", {
    data: { workspaceId, userId },
  });
  const data = await resp.json();
  return data as { workflowId: string };
}

export async function seedChaosRule(
  type: "latency" | "error" | "drop",
  urlPattern: string,
  overrides?: { delayMs?: number; statusCode?: number },
) {
  const api = await getApi();
  const resp = await api.post("/api/test/seed?action=chaos", {
    data: { type, urlPattern, ...overrides },
  });
  const data = await resp.json();
  return data;
}
