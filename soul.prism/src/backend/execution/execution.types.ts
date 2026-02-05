import type { Execution as PrismaExecution } from "@prisma/client";

export type Execution = PrismaExecution;

export interface CreateExecutionInput {
  requestId: string;
  traceId: string;
  statusCode?: number | null;
  latencyMs?: number | null;
}

export interface ExecutionResponse {
  data: Execution | Execution[];
}
