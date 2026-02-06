import type { Execution as PrismaExecution } from "@prisma/client";

export type Execution = PrismaExecution;

export interface ExecutionResponse {
  data: Execution | Execution[];
}
