"use server";

import { headers } from "next/headers";
import { requireUser, requireWorkspaceAccess } from "@/backend/auth/auth.utils";
import {
  createWorkflow,
  createWorkflowRun,
  getWorkflowById,
  listWorkflows,
} from "./workflow.service";
import { executeWorkflow } from "./workflow.executor";
import type {
  Workflow,
  WorkflowExecutionResult,
  WorkflowWithSteps,
} from "./workflow.types";

export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

function resolveBaseUrlFromEnv(): string | null {
  const candidates = [
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.APP_URL,
    process.env.NEXTAUTH_URL,
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null,
  ];

  for (const candidate of candidates) {
    if (candidate && candidate.trim().length > 0) {
      return candidate;
    }
  }

  return null;
}

async function resolveRequestBaseUrl(): Promise<string> {
  const envBaseUrl = resolveBaseUrlFromEnv();
  if (envBaseUrl) {
    return envBaseUrl;
  }

  const requestHeaders = await headers();
  const host =
    requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
  const protocol = requestHeaders.get("x-forwarded-proto") ?? "http";

  if (!host) {
    return "http://localhost:3000";
  }

  return `${protocol}://${host}`;
}

function validateRequiredString(
  value: string,
  fieldName: string,
): string | null {
  if (!value || value.trim().length === 0) {
    return `${fieldName} is required`;
  }

  return null;
}

export async function createWorkflowAction(
  workspaceId: string,
  name: string,
  description?: string,
): Promise<ActionResult<Workflow>> {
  const workspaceValidation = validateRequiredString(
    workspaceId,
    "workspaceId",
  );
  if (workspaceValidation) {
    return { success: false, error: workspaceValidation };
  }

  const nameValidation = validateRequiredString(name, "name");
  if (nameValidation) {
    return { success: false, error: nameValidation };
  }

  try {
    const user = await requireUser();
    await requireWorkspaceAccess(workspaceId);

    const workflow = await createWorkflow(
      workspaceId,
      name,
      description,
      user.id,
    );

    return { success: true, data: workflow };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Failed to create workflow", error);
    return { success: false, error: message };
  }
}

export async function listWorkflowsAction(
  workspaceId: string,
): Promise<ActionResult<Workflow[]>> {
  const workspaceValidation = validateRequiredString(
    workspaceId,
    "workspaceId",
  );
  if (workspaceValidation) {
    return { success: false, error: workspaceValidation };
  }

  try {
    await requireUser();
    await requireWorkspaceAccess(workspaceId);
    const workflows = await listWorkflows(workspaceId);
    return { success: true, data: workflows };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Failed to list workflows", error);
    return { success: false, error: message };
  }
}

export async function getWorkflowAction(
  workflowId: string,
  workspaceId: string,
): Promise<ActionResult<WorkflowWithSteps | null>> {
  const workflowValidation = validateRequiredString(workflowId, "workflowId");
  if (workflowValidation) {
    return { success: false, error: workflowValidation };
  }

  const workspaceValidation = validateRequiredString(
    workspaceId,
    "workspaceId",
  );
  if (workspaceValidation) {
    return { success: false, error: workspaceValidation };
  }

  try {
    await requireUser();
    await requireWorkspaceAccess(workspaceId);

    const workflow = await getWorkflowById(workflowId);
    if (!workflow) {
      return { success: true, data: null };
    }

    if (workflow.workspaceId !== workspaceId) {
      return { success: false, error: "Forbidden" };
    }

    return { success: true, data: workflow };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Failed to get workflow", error);
    return { success: false, error: message };
  }
}

export async function runWorkflowAction(
  workflowId: string,
  workspaceId: string,
): Promise<ActionResult<WorkflowExecutionResult>> {
  const workflowValidation = validateRequiredString(workflowId, "workflowId");
  if (workflowValidation) {
    return { success: false, error: workflowValidation };
  }

  const workspaceValidation = validateRequiredString(
    workspaceId,
    "workspaceId",
  );
  if (workspaceValidation) {
    return { success: false, error: workspaceValidation };
  }

  try {
    const user = await requireUser();
    await requireWorkspaceAccess(workspaceId);

    const workflow = await getWorkflowById(workflowId);
    if (!workflow) {
      return { success: false, error: "Workflow not found" };
    }

    if (workflow.workspaceId !== workspaceId) {
      return { success: false, error: "Forbidden" };
    }

    const workflowRun = await createWorkflowRun(workflowId, user.id);
    const interceptBaseUrl = await resolveRequestBaseUrl();
    const result = await executeWorkflow(workflowId, workflowRun.id, {
      interceptBaseUrl,
      triggeredBy: user.id,
      workflowWorkspaceId: workflow.workspaceId,
    });

    return { success: true, data: result };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Failed to run workflow", error);
    return { success: false, error: message };
  }
}
