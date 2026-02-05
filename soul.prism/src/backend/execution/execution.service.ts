import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import type { CreateExecutionInput, Execution } from "./execution.types";

const globalForPrisma = globalThis as typeof globalThis & {
  __prismPrismaClient?: PrismaClient;
};

function getPrisma(): PrismaClient {
  if (globalForPrisma.__prismPrismaClient) {
    return globalForPrisma.__prismPrismaClient;
  }

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }

  const adapter = new PrismaPg({ connectionString });
  const client = new PrismaClient({ adapter });

  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.__prismPrismaClient = client;
  }

  return client;
}

export async function createExecution(
  input: CreateExecutionInput,
): Promise<Execution> {
  const prisma = getPrisma();

  const request = await prisma.request.findUnique({
    where: { id: input.requestId },
    select: { id: true },
  });

  if (!request) {
    throw new Error("Request not found");
  }

  return prisma.execution.create({
    data: {
      requestId: input.requestId,
      traceId: input.traceId,
      statusCode: input.statusCode ?? null,
      latencyMs: input.latencyMs ?? null,
    },
  });
}

export async function listExecutionsByRequestId(
  requestId: string,
): Promise<Execution[]> {
  const prisma = getPrisma();

  return prisma.execution.findMany({
    where: { requestId },
    orderBy: { executedAt: "desc" },
  });
}

export async function listExecutionsByWorkspace(
  workspaceId: string,
): Promise<Execution[]> {
  const prisma = getPrisma();

  return prisma.execution.findMany({
    where: {
      request: {
        collection: {
          workspaceId,
        },
      },
    },
    orderBy: { executedAt: "desc" },
  });
}

export async function getExecutionById(
  executionId: string,
): Promise<Execution | null> {
  const prisma = getPrisma();

  return prisma.execution.findUnique({
    where: { id: executionId },
  });
}
