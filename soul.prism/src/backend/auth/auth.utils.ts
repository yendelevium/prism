import { AuthError } from "./auth.types";
import { getCurrentUser, hasWorkspaceAccess } from "./auth.service";
import type { AuthUser } from "./auth.types";
import { Pool } from "pg";

function getPool(): Pool {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }
  return new Pool({ connectionString });
}

export async function requireUser(): Promise<AuthUser> {
  const user = await getCurrentUser();
  if (!user) {
    throw new AuthError("Unauthorized");
  }
  return user;
}

export async function requireWorkspaceAccess(
  workspaceId: string,
): Promise<AuthUser> {
  if (!workspaceId || workspaceId.trim().length === 0) {
    throw new AuthError("workspaceId is required");
  }

  const user = await requireUser();
  const allowed = await hasWorkspaceAccess(user.id, workspaceId);
  if (!allowed) {
    throw new AuthError("Forbidden");
  }

  return user;
}

export async function requireWorkspaceAdmin(
  workspaceId: string,
): Promise<AuthUser> {
  if (!workspaceId || workspaceId.trim().length === 0) {
    throw new AuthError("workspaceId is required");
  }

  const user = await requireUser();
  const allowed = await hasWorkspaceAccess(user.id, workspaceId);
  if (!allowed) {
    throw new AuthError("Forbidden");
  }

  const pool = getPool();
  const result = await pool.query<{ role: string }>(
    'SELECT "role" FROM "UserWorkspace" WHERE "userId" = $1 AND "workspaceId" = $2 LIMIT 1',
    [user.id, workspaceId],
  );

  if (result.rows.length === 0 || result.rows[0].role !== "admin") {
    throw new AuthError("Admin access required");
  }

  return user;
}
