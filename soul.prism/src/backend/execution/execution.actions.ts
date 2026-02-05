"use server";

import {
  getExecutionById,
  listExecutionsByRequestId,
} from "@/backend/execution/execution.service";
import type { Execution } from "@/backend/execution/execution.types";

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
    return { success: true, data: execution };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Failed to get execution", error);
    return { success: false, error: message };
  }
}
