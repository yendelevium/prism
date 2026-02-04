import "dotenv/config";
import { PrismaClient, type HttpMethod } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import type { CreateRequestInput, Request } from "./request.types";

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


function normalizeHeaders(
  headers: Record<string, string> | null | undefined,
): Record<string, string> | null {
  if (!headers) {
    return null;
  }

  const normalized: Record<string, string> = {};
  for (const [key, value] of Object.entries(headers)) {
    if (typeof key === "string" && typeof value === "string") {
      const trimmedKey = key.trim();
      if (trimmedKey.length > 0) {
        normalized[trimmedKey] = value;
      }
    }
  }

  return Object.keys(normalized).length > 0 ? normalized : null;
}

export async function createRequest(
  input: CreateRequestInput,
): Promise<Request> {
  const prisma = getPrisma();

  const collection = await prisma.collection.findUnique({
    where: { id: input.collectionId },
    select: { id: true },
  });

  if (!collection) {
    throw new Error("Collection not found");
  }

  const user = await prisma.user.findUnique({
    where: { id: input.createdById },
    select: { id: true },
  });

  if (!user) {
    throw new Error("User not found");
  }

  const headers = normalizeHeaders(input.headers);

  return prisma.request.create({
    data: {
      name: input.name.trim(),
      method: input.method as HttpMethod,
      url: input.url.trim(),
      headers,
      body: input.body ?? null,
      collectionId: input.collectionId,
      createdById: input.createdById,
    },
  });
}

export async function getRequestsByCollection(
  collectionId: string,
): Promise<Request[]> {
  const prisma = getPrisma();

  return prisma.request.findMany({
    where: { collectionId },
    orderBy: { createdAt: "desc" },
  });
}

export async function getRequestById(id: string): Promise<Request | null> {
  const prisma = getPrisma();

  return prisma.request.findUnique({
    where: { id },
  });
}

export async function deleteRequest(id: string): Promise<Request> {
  const prisma = getPrisma();

  return prisma.request.delete({
    where: { id },
  });
}
