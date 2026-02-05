"use server";

import {
  createExecution,
  getExecutionById,
  listExecutionsByRequestId,
  listExecutionsByWorkspace,
} from "@/backend/execution/execution.service";
import type {
  CreateExecutionInput,
  Execution,
} from "@/backend/execution/execution.types";

export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

export async function createExecutionAction(
  input: CreateExecutionInput,
): Promise<ActionResult<Execution>> {
  const requestId =
    typeof input.requestId === "string" ? input.requestId.trim() : "";
  const traceId = typeof input.traceId === "string" ? input.traceId.trim() : "";

  if (!requestId) {
    return { success: false, error: "requestId is required" };
  }

  if (!traceId) {
    return { success: false, error: "traceId is required" };
  }

  if (input.statusCode !== undefined && input.statusCode !== null) {
    if (!Number.isInteger(input.statusCode) || input.statusCode < 0) {
      return { success: false, error: "statusCode must be a non-negative integer" };
    }
  }

  if (input.latencyMs !== undefined && input.latencyMs !== null) {
    if (!Number.isInteger(input.latencyMs) || input.latencyMs < 0) {
      return { success: false, error: "latencyMs must be a non-negative integer" };
    }
  }

  try {
    const execution = await createExecution({
      requestId,
      traceId,
      statusCode: input.statusCode ?? null,
      latencyMs: input.latencyMs ?? null,
    });
    return { success: true, data: execution };
  } catch (error) {
    if (error instanceof Error && error.message === "Request not found") {
      return { success: false, error: error.message };
    }
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Failed to create execution", error);
    return { success: false, error: message };
  }
}

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

export async function listExecutionsByWorkspaceAction(
  workspaceId: string,
): Promise<ActionResult<Execution[]>> {
  if (!workspaceId || workspaceId.trim().length === 0) {
    return { success: false, error: "workspaceId is required" };
  }

  try {
    const executions = await listExecutionsByWorkspace(workspaceId);
    return { success: true, data: executions };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Failed to list executions by workspace", error);
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
