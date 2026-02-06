import { AuthError } from "./auth.types";
import { getCurrentUser, hasWorkspaceAccess } from "./auth.service";
import type { AuthUser } from "./auth.types";

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
