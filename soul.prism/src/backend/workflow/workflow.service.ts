import type {
  WorkflowRequestProtocol,
  WorkflowStatus,
  WorkflowStepStatus,
} from "@prisma/client";
import { getPrisma } from "@/backend/prisma";
import type {
  Workflow,
  WorkflowRun,
  WorkflowRunStep,
  WorkflowStep,
  WorkflowWithSteps,
} from "./workflow.types";

export async function createWorkflow(
  workspaceId: string,
  name: string,
  description: string | null | undefined,
  createdBy: string,
): Promise<Workflow> {
  const prisma = getPrisma();

  return prisma.workflow.create({
    data: {
      workspaceId,
      name: name.trim(),
      description: description?.trim() || null,
      createdBy,
    },
  });
}

export async function listWorkflows(workspaceId: string): Promise<Workflow[]> {
  const prisma = getPrisma();

  return prisma.workflow.findMany({
    where: { workspaceId },
    orderBy: { createdAt: "desc" },
  });
}

export async function getWorkflowById(
  workflowId: string,
): Promise<WorkflowWithSteps | null> {
  const prisma = getPrisma();

  return prisma.workflow.findUnique({
    where: { id: workflowId },
    include: {
      steps: {
        orderBy: { stepOrder: "asc" },
      },
    },
  });
}

export async function createWorkflowStep(
  workflowId: string,
  requestId: string,
  protocol: WorkflowRequestProtocol,
  stepOrder: number,
  retryCount: number,
): Promise<WorkflowStep> {
  const prisma = getPrisma();

  return prisma.workflowStep.create({
    data: {
      workflowId,
      requestId,
      protocol,
      stepOrder,
      retryCount,
    },
  });
}

export async function getWorkflowSteps(
  workflowId: string,
): Promise<WorkflowStep[]> {
  const prisma = getPrisma();

  return prisma.workflowStep.findMany({
    where: { workflowId },
    orderBy: { stepOrder: "asc" },
  });
}

export async function createWorkflowRun(
  workflowId: string,
  triggeredBy: string,
): Promise<WorkflowRun> {
  const prisma = getPrisma();

  return prisma.workflowRun.create({
    data: {
      workflowId,
      triggeredBy,
      status: "RUNNING",
      startedAt: new Date(),
    },
  });
}

export async function updateWorkflowRunStatus(
  workflowRunId: string,
  status: WorkflowStatus,
): Promise<WorkflowRun> {
  const prisma = getPrisma();

  return prisma.workflowRun.update({
    where: { id: workflowRunId },
    data: {
      status,
      endedAt: status === "RUNNING" ? null : new Date(),
    },
  });
}

export async function createWorkflowRunStep(
  workflowRunId: string,
  workflowStepId: string,
): Promise<WorkflowRunStep> {
  const prisma = getPrisma();

  return prisma.workflowRunStep.create({
    data: {
      workflowRunId,
      workflowStepId,
      status: "RUNNING",
      startedAt: new Date(),
    },
  });
}

export async function updateWorkflowRunStep(
  workflowRunStepId: string,
  status: WorkflowStepStatus,
  executionId?: string,
  durationMs?: number,
): Promise<WorkflowRunStep> {
  const prisma = getPrisma();

  return prisma.workflowRunStep.update({
    where: { id: workflowRunStepId },
    data: {
      status,
      executionId: executionId ?? null,
      durationMs: durationMs ?? null,
      endedAt: new Date(),
    },
  });
}
