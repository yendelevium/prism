import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { currentUser } from "@clerk/nextjs/server";
import type { AuthUser } from "./auth.types";

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

function getPrimaryEmail(
  user: Awaited<ReturnType<typeof currentUser>>,
): string | null {
  if (!user || user.emailAddresses.length === 0) {
    return null;
  }

  if (user.primaryEmailAddressId) {
    const primary = user.emailAddresses.find(
      (email) => email.id === user.primaryEmailAddressId,
    );
    if (primary) {
      return primary.emailAddress;
    }
  }

  return user.emailAddresses[0]?.emailAddress ?? null;
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const clerkUser = await currentUser();
  if (!clerkUser) {
    return null;
  }

  const email = getPrimaryEmail(clerkUser);
  const name =
    clerkUser.fullName ??
    ([clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") ||
      null);

  const prisma = getPrisma();
  await prisma.user.upsert({
    where: { id: clerkUser.id },
    create: {
      id: clerkUser.id,
      email: email ?? `${clerkUser.id}@example.local`,
      name: name ?? undefined,
    },
    update: {
      email: email ?? undefined,
      name: name ?? undefined,
    },
  });

  return {
    id: clerkUser.id,
    email,
    name,
  };
}

export async function hasWorkspaceAccess(
  userId: string,
  workspaceId: string,
): Promise<boolean> {
  const prisma = getPrisma();

  const membership = await prisma.userWorkspace.findUnique({
    where: {
      userId_workspaceId: {
        userId,
        workspaceId,
      },
    },
    select: { id: true },
  });

  return Boolean(membership);
}
