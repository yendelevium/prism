import type {
  GraphQLRequest,
  GRPCRequest,
  Request,
  WorkflowRequestProtocol,
} from "@prisma/client";
import { getCollectionById } from "@/backend/collection/collection.service";
import { getGraphQLRequestById } from "@/backend/graphql-request/graphql-request.service";
import { getGRPCRequestById } from "@/backend/grpc-request/grpc-request.service";
import { getRequestById } from "@/backend/request/request.service";
import {
  createWorkflowRunStep,
  getWorkflowById,
  getWorkflowSteps,
  updateWorkflowRunStatus,
  updateWorkflowRunStep,
} from "./workflow.service";
import type {
  WorkflowExecutionContext,
  WorkflowExecutionResult,
  WorkflowInterceptResponse,
  WorkflowRequestResolution,
  WorkflowRunStepResult,
  WorkflowStep,
} from "./workflow.types";

function parseDurationMs(value?: string): number | undefined {
  if (!value) {
    return undefined;
  }

  const normalized = value.trim().replace(/ms$/i, "");
  const durationMs = Number(normalized);
  return Number.isFinite(durationMs) ? durationMs : undefined;
}

function buildInterceptUrl(baseUrl: string): string {
  return new URL("/api/intercept", baseUrl).toString();
}

async function executeInterceptRequest(
  interceptBaseUrl: string,
  payload: Record<string, unknown>,
): Promise<WorkflowInterceptResponse> {
  const response = await fetch(buildInterceptUrl(interceptBaseUrl), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  const data = (await response.json()) as WorkflowInterceptResponse;
  if (!response.ok) {
    throw new Error(
      data.error || data.error_msg || "Interceptor request failed",
    );
  }

  return data;
}

type WorkflowRequestLoader<
  TRequest extends { id: string; collectionId: string },
> = (requestId: string) => Promise<TRequest | null>;

type WorkflowRequestResolver = {
  resolveRequestType: WorkflowRequestProtocol;
  loadRequest: WorkflowRequestLoader<Request | GraphQLRequest | GRPCRequest>;
  buildInterceptPayload: (requestId: string) => Record<string, string>;
};

const workflowRequestResolvers: Record<
  WorkflowRequestProtocol,
  WorkflowRequestResolver
> = {
  REST: {
    resolveRequestType: "REST",
    loadRequest: getRequestById,
    buildInterceptPayload: (requestId) => ({
      protocol: "REST",
      request_id: requestId,
    }),
  },
  GRAPHQL: {
    resolveRequestType: "GRAPHQL",
    loadRequest: getGraphQLRequestById,
    buildInterceptPayload: (requestId) => ({
      protocol: "GRAPHQL",
      graphql_request_id: requestId,
    }),
  },
  GRPC: {
    resolveRequestType: "GRPC",
    loadRequest: getGRPCRequestById,
    buildInterceptPayload: (requestId) => ({
      protocol: "GRPC",
      grpc_request_id: requestId,
    }),
  },
};

function resolveRequestType(step: WorkflowStep): WorkflowRequestResolver {
  return workflowRequestResolvers[step.protocol];
}

async function validateRequestWorkspace(
  resolution: WorkflowRequestResolution,
  workflowWorkspaceId: string,
): Promise<void> {
  const collection = await getCollectionById(resolution.collectionId);
  if (!collection) {
    throw new Error(
      `Collection not found for request ${resolution.request.id}`,
    );
  }

  if (collection.workspaceId !== workflowWorkspaceId) {
    throw new Error(
      `Request ${resolution.request.id} is outside the workflow workspace`,
    );
  }
}

async function loadStepRequest(
  step: WorkflowStep,
  workflowWorkspaceId: string,
): Promise<WorkflowRequestResolution> {
  const resolver = resolveRequestType(step);
  const request = await resolver.loadRequest(step.requestId);

  if (!request) {
    throw new Error(
      `${resolver.resolveRequestType} request not found for workflow step ${step.id}`,
    );
  }

  const resolution = {
    request,
    collectionId: request.collectionId,
  };
  await validateRequestWorkspace(resolution, workflowWorkspaceId);
  return resolution;
}

function buildInterceptPayload(step: WorkflowStep): Record<string, string> {
  const resolver = resolveRequestType(step);
  return resolver.buildInterceptPayload(step.requestId);
}

function getStepStatus(statusCode: number | undefined): "SUCCESS" | "FAILED" {
  return statusCode !== undefined && statusCode < 400 ? "SUCCESS" : "FAILED";
}

async function executeStepWithRetry(
  step: WorkflowStep,
  workflowRunId: string,
  context: WorkflowExecutionContext,
): Promise<WorkflowRunStepResult> {
  const workflowRunStep = await createWorkflowRunStep(workflowRunId, step.id);
  const maxAttempts = Math.max(0, step.retryCount) + 1;

  let finalExecutionId: string | undefined;
  let finalDurationMs: number | undefined;
  let finalStatus: "SUCCESS" | "FAILED" = "FAILED";
  let lastError: Error | undefined;

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    try {
      await loadStepRequest(step, context.workflowWorkspaceId);
      const payload = buildInterceptPayload(step);
      const response = await executeInterceptRequest(
        context.interceptBaseUrl,
        payload,
      );
      const statusCode = response.status ?? response.status_code;

      finalExecutionId = response.execution_id;
      finalDurationMs = parseDurationMs(response.request_duration);
      finalStatus = getStepStatus(statusCode);

      if (finalStatus === "SUCCESS") {
        await updateWorkflowRunStep(
          workflowRunStep.id,
          "SUCCESS",
          finalExecutionId,
          finalDurationMs,
        );

        return {
          stepId: step.id,
          executionId: finalExecutionId,
          status: "SUCCESS",
          durationMs: finalDurationMs,
        };
      }

      lastError = new Error(
        response.error_msg ||
          response.error ||
          `Workflow step ${step.id} failed with status ${statusCode ?? "unknown"}`,
      );
    } catch (error) {
      lastError =
        error instanceof Error
          ? error
          : new Error("Workflow step execution failed");
    }
  }

  await updateWorkflowRunStep(
    workflowRunStep.id,
    "FAILED",
    finalExecutionId,
    finalDurationMs,
  );

  if (lastError) {
    throw Object.assign(lastError, {
      workflowStepResult: {
        stepId: step.id,
        executionId: finalExecutionId,
        status: finalStatus,
        durationMs: finalDurationMs,
      } satisfies WorkflowRunStepResult,
    });
  }

  return {
    stepId: step.id,
    executionId: finalExecutionId,
    status: finalStatus,
    durationMs: finalDurationMs,
  };
}

export async function executeWorkflow(
  workflowId: string,
  workflowRunId: string,
  context: WorkflowExecutionContext,
): Promise<WorkflowExecutionResult> {
  const workflow = await getWorkflowById(workflowId);
  if (!workflow) {
    throw new Error("Workflow not found");
  }

  const steps = await getWorkflowSteps(workflowId);
  const results: WorkflowRunStepResult[] = [];

  for (const step of steps) {
    try {
      const result = await executeStepWithRetry(step, workflowRunId, context);
      results.push(result);
    } catch (error) {
      const failedStepResult =
        error &&
        typeof error === "object" &&
        "workflowStepResult" in error &&
        error.workflowStepResult
          ? (error.workflowStepResult as WorkflowRunStepResult)
          : {
              stepId: step.id,
              status: "FAILED",
            };

      results.push(failedStepResult);
      await updateWorkflowRunStatus(workflowRunId, "FAILED");
      return {
        workflowRunId,
        steps: results,
      };
    }
  }

  await updateWorkflowRunStatus(workflowRunId, "SUCCESS");
  return {
    workflowRunId,
    steps: results,
  };
}
