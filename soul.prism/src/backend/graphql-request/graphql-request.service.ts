import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import type {
  GraphQLRequest,
  CreateGraphQLRequestInput,
  UpdateGraphQLRequestInput,
} from "./graphql-request.types";

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

export async function createGraphQLRequest(
  input: CreateGraphQLRequestInput,
): Promise<GraphQLRequest> {
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

  return prisma.graphQLRequest.create({
    data: {
      name: input.name.trim(),
      url: input.url.trim(),
      query: input.query.trim(),
      variables: input.variables ?? null,
      operationName: input.operationName ?? null,
      headers,
      collectionId: input.collectionId,
      createdById: input.createdById,
    },
  });
}

export async function getGraphQLRequestsByCollection(
  collectionId: string,
): Promise<GraphQLRequest[]> {
  const prisma = getPrisma();

  return prisma.graphQLRequest.findMany({
    where: { collectionId },
    orderBy: { createdAt: "desc" },
  });
}

export async function getGraphQLRequestById(
  id: string,
): Promise<GraphQLRequest | null> {
  const prisma = getPrisma();

  return prisma.graphQLRequest.findUnique({
    where: { id },
  });
}

export async function deleteGraphQLRequest(
  id: string,
): Promise<GraphQLRequest> {
  const prisma = getPrisma();

  return prisma.graphQLRequest.delete({
    where: { id },
  });
}

export async function updateGraphQLRequest(
  id: string,
  input: UpdateGraphQLRequestInput,
): Promise<GraphQLRequest> {
  const prisma = getPrisma();

  const headers =
    input.headers === undefined ? undefined : normalizeHeaders(input.headers);

  return prisma.graphQLRequest.update({
    where: { id },
    data: {
      name: input.name?.trim(),
      url: input.url?.trim(),
      query: input.query?.trim(),
      variables: input.variables ?? undefined,
      operationName: input.operationName ?? undefined,
      headers,
    },
  });
}
