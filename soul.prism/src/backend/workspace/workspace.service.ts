import "dotenv/config";
import { Pool } from "pg";
import type {
  CreateWorkspaceInput,
  Workspace,
  WorkspaceRole,
  WorkspaceUser,
} from "./workspace.types";

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

    const userCheck = await client.query<{ id: string; email: string }>(
      'SELECT "id", "email" FROM "User" WHERE "id" = $1 LIMIT 1',
      [userId],
    );

    let userEmail: string;
    if (userCheck.rows.length === 0) {
      userEmail = `${userId}@example.local`;
      await client.query('INSERT INTO "User" ("id", "email") VALUES ($1, $2)', [
        userId,
        userEmail,
      ]);
    } else {
      userEmail = userCheck.rows[0].email;
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
      users: [{ email: userEmail, role: "admin" }],
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

  const workspaces = await Promise.all(
    result.rows.map(async (row) => {
      const usersResult = await pool.query<{
        email: string;
        role: WorkspaceRole;
      }>(
        'SELECT u."email", uw."role" FROM "UserWorkspace" uw JOIN "User" u ON u."id" = uw."userId" WHERE uw."workspaceId" = $1',
        [row.id],
      );
      return {
        id: row.id,
        name: row.name,
        createdAt: new Date(row.createdAt),
        ownerId: row.ownerId,
        users: usersResult.rows,
      };
    }),
  );

  return workspaces;
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

  const usersResult = await pool.query<{ email: string; role: WorkspaceRole }>(
    'SELECT u."email", uw."role" FROM "UserWorkspace" uw JOIN "User" u ON u."id" = uw."userId" WHERE uw."workspaceId" = $1',
    [workspaceId],
  );

  return {
    id: row.id,
    name: row.name,
    createdAt: new Date(row.createdAt),
    ownerId: row.ownerId ?? "",
    users: usersResult.rows,
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
      ownerId: userId,
      users: await getWorkspaceUsers(row.id),
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

async function isUserAdmin(
  pool: Pool,
  userId: string,
  workspaceId: string,
): Promise<boolean> {
  const check = await pool.query(
    'SELECT "role" FROM "UserWorkspace" WHERE "userId" = $1 AND "workspaceId" = $2 LIMIT 1',
    [userId, workspaceId],
  );
  return check.rows.length > 0 && check.rows[0].role === "admin";
}

export async function getUserIdByEmail(email: string): Promise<string | null> {
  const pool = getPool();
  const result = await pool.query<{ id: string }>(
    'SELECT "id" FROM "User" WHERE "email" = $1 LIMIT 1',
    [email],
  );
  return result.rows[0]?.id ?? null;
}

export async function getWorkspaceUsers(
  workspaceId: string,
): Promise<WorkspaceUser[]> {
  const pool = getPool();
  const result = await pool.query<{ email: string; role: WorkspaceRole }>(
    'SELECT u."email", uw."role" FROM "UserWorkspace" uw JOIN "User" u ON u."id" = uw."userId" WHERE uw."workspaceId" = $1',
    [workspaceId],
  );
  return result.rows;
}

export async function addUserToWorkspace(
  workspaceId: string,
  adminUserId: string,
  userEmail: string,
  role: WorkspaceRole,
): Promise<WorkspaceUser> {
  const pool = getPool();
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    if (!(await isUserAdmin(pool, adminUserId, workspaceId))) {
      throw new Error("Only admins can add users to this workspace");
    }

    const userResult = await client.query<{ id: string; email: string }>(
      'SELECT "id", "email" FROM "User" WHERE "email" = $1 LIMIT 1',
      [userEmail],
    );

    if (userResult.rows.length === 0) {
      throw new Error(
        "User not found. User must have logged in before being added to a workspace.",
      );
    }

    const targetUser = userResult.rows[0];

    const existingMember = await client.query(
      'SELECT "id" FROM "UserWorkspace" WHERE "userId" = $1 AND "workspaceId" = $2 LIMIT 1',
      [targetUser.id, workspaceId],
    );

    if (existingMember.rows.length > 0) {
      throw new Error("User is already a member of this workspace");
    }

    const newMemberId = crypto.randomUUID();
    await client.query(
      'INSERT INTO "UserWorkspace" ("id", "userId", "workspaceId", "role") VALUES ($1, $2, $3, $4)',
      [newMemberId, targetUser.id, workspaceId, role],
    );

    await client.query("COMMIT");

    return { email: targetUser.email, role };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function removeUserFromWorkspace(
  workspaceId: string,
  adminUserId: string,
  userEmail: string,
): Promise<void> {
  const pool = getPool();
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    if (!(await isUserAdmin(pool, adminUserId, workspaceId))) {
      throw new Error("Only admins can remove users from this workspace");
    }

    const targetUserResult = await client.query<{ id: string }>(
      'SELECT "id" FROM "User" WHERE "email" = $1 LIMIT 1',
      [userEmail],
    );

    if (targetUserResult.rows.length === 0) {
      throw new Error("User not found");
    }

    const targetUserId = targetUserResult.rows[0].id;

    const memberResult = await client.query<{ role: WorkspaceRole }>(
      'SELECT "role" FROM "UserWorkspace" WHERE "userId" = $1 AND "workspaceId" = $2 LIMIT 1',
      [targetUserId, workspaceId],
    );

    if (memberResult.rows.length === 0) {
      throw new Error("User is not a member of this workspace");
    }

    if (memberResult.rows[0].role === "admin") {
      const adminCountResult = await client.query<{ count: string }>(
        'SELECT COUNT(*) as "count" FROM "UserWorkspace" WHERE "workspaceId" = $1 AND "role" = $2',
        [workspaceId, "admin"],
      );

      if (parseInt(adminCountResult.rows[0].count) <= 1) {
        throw new Error("Cannot remove the last admin from the workspace");
      }
    }

    await client.query(
      'DELETE FROM "UserWorkspace" WHERE "userId" = $1 AND "workspaceId" = $2',
      [targetUserId, workspaceId],
    );

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function updateUserRole(
  workspaceId: string,
  adminUserId: string,
  userEmail: string,
  newRole: WorkspaceRole,
): Promise<WorkspaceUser> {
  const pool = getPool();
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    if (!(await isUserAdmin(pool, adminUserId, workspaceId))) {
      throw new Error("Only admins can change user roles in this workspace");
    }

    const targetUserResult = await client.query<{ id: string; email: string }>(
      'SELECT "id", "email" FROM "User" WHERE "email" = $1 LIMIT 1',
      [userEmail],
    );

    if (targetUserResult.rows.length === 0) {
      throw new Error("User not found");
    }

    const targetUser = targetUserResult.rows[0];

    const memberResult = await client.query<{ role: WorkspaceRole }>(
      'SELECT "role" FROM "UserWorkspace" WHERE "userId" = $1 AND "workspaceId" = $2 LIMIT 1',
      [targetUser.id, workspaceId],
    );

    if (memberResult.rows.length === 0) {
      throw new Error("User is not a member of this workspace");
    }

    const currentRole = memberResult.rows[0].role;

    if (currentRole === "admin" && newRole !== "admin") {
      const adminCountResult = await client.query<{ count: string }>(
        'SELECT COUNT(*) as "count" FROM "UserWorkspace" WHERE "workspaceId" = $1 AND "role" = $2',
        [workspaceId, "admin"],
      );

      if (parseInt(adminCountResult.rows[0].count) <= 1) {
        throw new Error("Cannot demote the last admin");
      }
    }

    await client.query(
      'UPDATE "UserWorkspace" SET "role" = $1 WHERE "userId" = $2 AND "workspaceId" = $3',
      [newRole, targetUser.id, workspaceId],
    );

    await client.query("COMMIT");

    return { email: targetUser.email, role: newRole };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
