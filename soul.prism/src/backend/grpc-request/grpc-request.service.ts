import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import type {
  GRPCRequest,
  CreateGRPCRequestInput,
  UpdateGRPCRequestInput,
} from "./grpc-request.types";

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

function normalizeMetadata(
  metadata: Record<string, string> | null | undefined,
): Record<string, string> | null {
  if (!metadata) {
    return null;
  }

  const normalized: Record<string, string> = {};
  for (const [key, value] of Object.entries(metadata)) {
    if (typeof key === "string" && typeof value === "string") {
      const trimmedKey = key.trim();
      if (trimmedKey.length > 0) {
        normalized[trimmedKey] = value;
      }
    }
  }

  return Object.keys(normalized).length > 0 ? normalized : null;
}

export async function createGRPCRequest(
  input: CreateGRPCRequestInput,
): Promise<GRPCRequest> {
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

  const metadata = normalizeMetadata(input.metadata);

  return prisma.gRPCRequest.create({
    data: {
      name: input.name.trim(),
      serverAddress: input.serverAddress.trim(),
      service: input.service.trim(),
      method: input.method.trim(),
      protoFile: input.protoFile.trim(),
      metadata,
      useTls: input.useTls ?? false,
      body: input.body ?? null,
      collectionId: input.collectionId,
      createdById: input.createdById,
    },
  });
}

export async function getGRPCRequestsByCollection(
  collectionId: string,
): Promise<GRPCRequest[]> {
  const prisma = getPrisma();

  return prisma.gRPCRequest.findMany({
    where: { collectionId },
    orderBy: { createdAt: "desc" },
  });
}

export async function getGRPCRequestById(
  id: string,
): Promise<GRPCRequest | null> {
  const prisma = getPrisma();

  return prisma.gRPCRequest.findUnique({
    where: { id },
  });
}

export async function deleteGRPCRequest(id: string): Promise<GRPCRequest> {
  const prisma = getPrisma();

  return prisma.gRPCRequest.delete({
    where: { id },
  });
}

export async function updateGRPCRequest(
  id: string,
  input: UpdateGRPCRequestInput,
): Promise<GRPCRequest> {
  const prisma = getPrisma();

  const metadata =
    input.metadata === undefined
      ? undefined
      : normalizeMetadata(input.metadata);

  return prisma.gRPCRequest.update({
    where: { id },
    data: {
      name: input.name?.trim(),
      serverAddress: input.serverAddress?.trim(),
      service: input.service?.trim(),
      method: input.method?.trim(),
      protoFile: input.protoFile?.trim(),
      metadata,
      useTls: input.useTls,
      body: input.body ?? undefined,
    },
  });
}
