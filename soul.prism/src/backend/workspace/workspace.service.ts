import "dotenv/config";
import { Pool } from "pg";
import type { CreateWorkspaceInput, Workspace } from "./workspace.types";

const globalForPg = globalThis as typeof globalThis & {
  __prismPgPool?: Pool;
};

function getPool(): Pool {
  if (globalForPg.__prismPgPool) {
    return globalForPg.__prismPgPool;
  }

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }

  const pool = new Pool({ connectionString });

  if (process.env.NODE_ENV !== "production") {
    globalForPg.__prismPgPool = pool;
  }

  return pool;
}

export async function createWorkspace(
  input: CreateWorkspaceInput,
  userId: string,
): Promise<Workspace> {
  const name = input.name.trim();
  const workspaceId = crypto.randomUUID();
  const userWorkspaceId = crypto.randomUUID();
  const pool = getPool();

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const userCheck = await client.query<{ id: string }>(
      'SELECT "id" FROM "User" WHERE "id" = $1 LIMIT 1',
      [userId],
    );

    if (userCheck.rows.length === 0) {
      const email = `${userId}@example.local`;
      await client.query('INSERT INTO "User" ("id", "email") VALUES ($1, $2)', [
        userId,
        email,
      ]);
    }

    const workspaceResult = await client.query<{
      id: string;
      name: string;
      createdAt: Date;
    }>(
      'INSERT INTO "Workspace" ("id", "name") VALUES ($1, $2) RETURNING "id", "name", "createdAt"',
      [workspaceId, name],
    );

    const workspace = workspaceResult.rows[0];

    await client.query(
      'INSERT INTO "UserWorkspace" ("id", "userId", "workspaceId", "role") VALUES ($1, $2, $3, $4)',
      [userWorkspaceId, userId, workspace.id, "admin"],
    );

    await client.query("COMMIT");

    return {
      id: workspace.id,
      name: workspace.name,
      createdAt: new Date(workspace.createdAt),
      ownerId: userId,
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function listWorkspacesForUser(
  userId: string,
): Promise<Workspace[]> {
  const pool = getPool();

  const result = await pool.query<{
    id: string;
    name: string;
    createdAt: Date;
    ownerId: string;
  }>(
    'SELECT w."id", w."name", w."createdAt", uw."userId" as "ownerId" FROM "Workspace" w JOIN "UserWorkspace" uw ON uw."workspaceId" = w."id" WHERE uw."userId" = $1 ORDER BY w."createdAt" DESC',
    [userId],
  );

  return result.rows.map((row) => ({
    id: row.id,
    name: row.name,
    createdAt: new Date(row.createdAt),
    ownerId: row.ownerId,
  }));
}

export async function getWorkspaceById(
  workspaceId: string,
): Promise<Workspace | undefined> {
  const pool = getPool();

  const result = await pool.query<{
    id: string;
    name: string;
    createdAt: Date;
    ownerId: string | null;
  }>(
    'SELECT w."id", w."name", w."createdAt", uw."userId" as "ownerId" FROM "Workspace" w LEFT JOIN "UserWorkspace" uw ON uw."workspaceId" = w."id" AND uw."role" = $1 WHERE w."id" = $2 LIMIT 1',
    ["admin", workspaceId],
  );

  const row = result.rows[0];
  if (!row) {
    return undefined;
  }

  return {
    id: row.id,
    name: row.name,
    createdAt: new Date(row.createdAt),
    ownerId: row.ownerId ?? "",
  };
}

// Delete a workspace by ID
export async function deleteWorkspace(
  workspaceId: string,
  userId: string,
): Promise<void> {
  const pool = getPool();
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Ensure the user is an admin of the workspace
    const check = await client.query(
      'SELECT "role" FROM "UserWorkspace" WHERE "userId" = $1 AND "workspaceId" = $2 LIMIT 1',
      [userId, workspaceId],
    );

    if (check.rows.length === 0 || check.rows[0].role !== "admin") {
      throw new Error("User is not authorized to delete this workspace");
    }

    // Delete related UserWorkspace entries
    await client.query('DELETE FROM "UserWorkspace" WHERE "workspaceId" = $1', [
      workspaceId,
    ]);

    // Delete the workspace itself
    await client.query('DELETE FROM "Workspace" WHERE "id" = $1', [
      workspaceId,
    ]);

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

// Update a workspace's name
export async function updateWorkspace(
  workspaceId: string,
  userId: string,
  newName: string,
): Promise<Workspace> {
  const pool = getPool();
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Ensure the user is an admin of the workspace
    const check = await client.query(
      'SELECT "role" FROM "UserWorkspace" WHERE "userId" = $1 AND "workspaceId" = $2 LIMIT 1',
      [userId, workspaceId],
    );

    if (check.rows.length === 0 || check.rows[0].role !== "admin") {
      throw new Error("User is not authorized to update this workspace");
    }

    // Update the workspace name
    const result = await client.query<{
      id: string;
      name: string;
      createdAt: Date;
    }>(
      'UPDATE "Workspace" SET "name" = $1 WHERE "id" = $2 RETURNING "id", "name", "createdAt"',
      [newName.trim(), workspaceId],
    );

    if (result.rows.length === 0) {
      throw new Error("Workspace not found");
    }

    const row = result.rows[0];

    await client.query("COMMIT");

    return {
      id: row.id,
      name: row.name,
      createdAt: new Date(row.createdAt),
      ownerId: userId, // admin performing the update
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
