"use server";

import { requireUser, requireWorkspaceAccess } from "@/backend/auth/auth.utils";
import {
  getErrorRateAnalytics,
  getLatencyAnalytics,
  getServiceAnalytics,
  getSlowestEndpoints,
  getTrafficAnalytics,
} from "./analytics.service";
import type {
  EndpointMetric,
  ErrorRateMetric,
  LatencyMetric,
  ServiceMetric,
  TrafficMetric,
} from "./analytics.types";

export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

function validateWorkspaceId(workspaceId: string): string | null {
  if (!workspaceId || workspaceId.trim().length === 0) {
    return "workspaceId is required";
  }

  return null;
}

export async function getTrafficAnalyticsAction(
  workspaceId: string,
): Promise<ActionResult<TrafficMetric[]>> {
  const validation = validateWorkspaceId(workspaceId);
  if (validation) {
    return { success: false, error: validation };
  }

  try {
    await requireUser();
    await requireWorkspaceAccess(workspaceId);
    const data = await getTrafficAnalytics(workspaceId);
    return { success: true, data };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Failed to fetch traffic analytics", error);
    return { success: false, error: message };
  }
}

export async function getLatencyAnalyticsAction(
  workspaceId: string,
): Promise<ActionResult<LatencyMetric>> {
  const validation = validateWorkspaceId(workspaceId);
  if (validation) {
    return { success: false, error: validation };
  }

  try {
    await requireUser();
    await requireWorkspaceAccess(workspaceId);
    const data = await getLatencyAnalytics(workspaceId);
    return { success: true, data };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Failed to fetch latency analytics", error);
    return { success: false, error: message };
  }
}

export async function getErrorRateAnalyticsAction(
  workspaceId: string,
): Promise<ActionResult<ErrorRateMetric>> {
  const validation = validateWorkspaceId(workspaceId);
  if (validation) {
    return { success: false, error: validation };
  }

  try {
    await requireUser();
    await requireWorkspaceAccess(workspaceId);
    const data = await getErrorRateAnalytics(workspaceId);
    return { success: true, data };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Failed to fetch error-rate analytics", error);
    return { success: false, error: message };
  }
}

export async function getSlowestEndpointsAction(
  workspaceId: string,
): Promise<ActionResult<EndpointMetric[]>> {
  const validation = validateWorkspaceId(workspaceId);
  if (validation) {
    return { success: false, error: validation };
  }

  try {
    await requireUser();
    await requireWorkspaceAccess(workspaceId);
    const data = await getSlowestEndpoints(workspaceId);
    return { success: true, data };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Failed to fetch slowest-endpoints analytics", error);
    return { success: false, error: message };
  }
}

export async function getServiceAnalyticsAction(
  workspaceId: string,
): Promise<ActionResult<ServiceMetric[]>> {
  const validation = validateWorkspaceId(workspaceId);
  if (validation) {
    return { success: false, error: validation };
  }

  try {
    await requireUser();
    await requireWorkspaceAccess(workspaceId);
    const data = await getServiceAnalytics(workspaceId);
    return { success: true, data };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Failed to fetch service analytics", error);
    return { success: false, error: message };
  }
}
