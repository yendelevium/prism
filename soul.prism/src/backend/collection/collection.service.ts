import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import type { Collection, CreateCollectionInput } from "./collection.types";

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

export async function createCollection(
  input: CreateCollectionInput,
  userId: string,
): Promise<Collection> {
  const name = input.name.trim();
  const prisma = getPrisma();

  const workspace = await prisma.workspace.findUnique({
    where: { id: input.workspaceId },
    select: { id: true },
  });

  if (!workspace) {
    throw new Error("Workspace not found");
  }

  await prisma.user.upsert({
    where: { id: userId },
    create: {
      id: userId,
      email: `${userId}@example.local`,
    },
    update: {},
  });

  const collection = await prisma.collection.create({
    data: {
      name,
      workspaceId: input.workspaceId,
      createdById: userId,
    },
  });

  return collection;
}

export async function listCollectionsByWorkspace(
  workspaceId: string,
): Promise<Collection[]> {
  const prisma = getPrisma();

  return prisma.collection.findMany({
    where: { workspaceId },
    orderBy: { createdAt: "desc" },
  });
}

export async function getCollectionById(
  collectionId: string,
): Promise<Collection | null> {
  const prisma = getPrisma();

  return prisma.collection.findUnique({
    where: { id: collectionId },
  });
}

export async function deleteCollection(
  collectionId: string,
): Promise<Collection> {
  const prisma = getPrisma();

  return prisma.collection.delete({
    where: { id: collectionId },
  });
}
