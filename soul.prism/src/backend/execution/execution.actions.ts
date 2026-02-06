"use server";

import {
  getExecutionById,
  listExecutionsByRequestId,
} from "@/backend/execution/execution.service";
import type { Execution } from "@/backend/execution/execution.types";
import { getRequestById } from "@/backend/request/request.service";
import { getCollectionById } from "@/backend/collection/collection.service";
import { requireWorkspaceAccess } from "@/backend/auth/auth.utils";

export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

export async function listExecutionsByRequestIdAction(
  requestId: string,
): Promise<ActionResult<Execution[]>> {
  if (!requestId || requestId.trim().length === 0) {
    return { success: false, error: "requestId is required" };
  }

  try {
    const request = await getRequestById(requestId);
    if (!request) {
      return { success: false, error: "request not found" };
    }
    const collection = await getCollectionById(request.collectionId);
    if (!collection) {
      return { success: false, error: "Collection not found" };
    }
    await requireWorkspaceAccess(collection.workspaceId);
    const executions = await listExecutionsByRequestId(requestId);
    return { success: true, data: executions };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Failed to list executions", error);
    return { success: false, error: message };
  }
}

export async function getExecutionByIdAction(
  executionId: string,
): Promise<ActionResult<Execution | null>> {
  if (!executionId || executionId.trim().length === 0) {
    return { success: false, error: "executionId is required" };
  }

  try {
    const execution = await getExecutionById(executionId);
    if (execution) {
      const request = await getRequestById(execution.requestId);
      if (!request) {
        return { success: false, error: "request not found" };
      }
      const collection = await getCollectionById(request.collectionId);
      if (!collection) {
        return { success: false, error: "Collection not found" };
      }
      await requireWorkspaceAccess(collection.workspaceId);
    }
    return { success: true, data: execution };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Failed to get execution", error);
    return { success: false, error: message };
  }
}
