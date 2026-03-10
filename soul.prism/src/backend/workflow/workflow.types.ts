import type {
  GraphQLRequest as PrismaGraphQLRequest,
  GRPCRequest as PrismaGRPCRequest,
  Request as PrismaRequest,
  Workflow as PrismaWorkflow,
  WorkflowRequestProtocol,
  WorkflowRun as PrismaWorkflowRun,
  WorkflowRunStep as PrismaWorkflowRunStep,
  WorkflowStatus,
  WorkflowStep as PrismaWorkflowStep,
  WorkflowStepStatus,
} from "@prisma/client";

export interface WorkflowDefinition {
  id: string;
  workspaceId: string;
  name: string;
  description?: string;
}

export interface WorkflowStepDefinition {
  id: string;
  workflowId: string;
  requestId: string;
  protocol: "REST" | "GRAPHQL" | "GRPC";
  stepOrder: number;
  retryCount: number;
}

export interface WorkflowRunResult {
  id: string;
  workflowId: string;
  status: string;
  startedAt?: Date;
  endedAt?: Date;
}

export interface WorkflowRunStepResult {
  stepId: string;
  executionId?: string;
  status: string;
  durationMs?: number;
}

export interface WorkflowExecutionResult {
  workflowRunId: string;
  steps: WorkflowRunStepResult[];
}

export type Workflow = PrismaWorkflow;
export type WorkflowStep = PrismaWorkflowStep;
export type WorkflowRun = PrismaWorkflowRun;
export type WorkflowRunStep = PrismaWorkflowRunStep;
export type WorkflowWithSteps = PrismaWorkflow & {
  steps: PrismaWorkflowStep[];
};

export interface WorkflowInterceptResponse {
  execution_id?: string;
  trace_id?: string;
  status?: number;
  status_code?: number;
  request_duration?: string;
  error?: string;
  error_msg?: string;
}

export interface WorkflowExecutionContext {
  interceptBaseUrl: string;
  triggeredBy: string;
  workflowWorkspaceId: string;
}

export interface WorkflowRequestResolution {
  collectionId: string;
  request: PrismaRequest | PrismaGraphQLRequest | PrismaGRPCRequest;
}

export type WorkflowRunStatusValue = WorkflowStatus;
export type WorkflowRunStepStatusValue = WorkflowStepStatus;
export type WorkflowProtocol = WorkflowRequestProtocol;
