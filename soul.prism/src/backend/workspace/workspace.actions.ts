"use server";

import {
  createWorkspace,
  deleteWorkspace,
  updateWorkspace,
  listWorkspacesForUser,
  getWorkspaceById,
  getWorkspaceUsers,
  addUserToWorkspace,
  removeUserFromWorkspace,
  updateUserRole,
} from "@/backend/workspace/workspace.service";
import type {
  Workspace,
  WorkspaceRole,
} from "@/backend/workspace/workspace.types";
import {
  requireUser,
  requireWorkspaceAccess,
  requireWorkspaceAdmin,
} from "@/backend/auth/auth.utils";
import { getUsernameByUserId } from "../user/user.service";

export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

export async function createWorkspaceAction(
  name: string,
): Promise<ActionResult<Workspace>> {
  const trimmedName = name?.trim();

  if (!trimmedName || trimmedName.length === 0) {
    return { success: false, error: "name is required" };
  }

  try {
    const user = await requireUser();
    const workspace = await createWorkspace({ name: trimmedName }, user.id);
    const workspaceWithOwnerName = {
      ...workspace!,
      ownerId: (await getUsernameByUserId(workspace!.ownerId))!,
    };
    return { success: true, data: workspaceWithOwnerName };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Failed to create workspace", error);
    return { success: false, error: message };
  }
}

export async function listWorkspacesAction(): Promise<
  ActionResult<Workspace[]>
> {
  try {
    const user = await requireUser();
    // Return workspaces with ownerName instead of ownerId
    const workspaces = await Promise.all(
      (await listWorkspacesForUser(user.id)).map(async (ws) => ({
        ...ws,
        ownerId: (await getUsernameByUserId(ws.ownerId))!,
      })),
    );
    return { success: true, data: workspaces };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Failed to list workspaces", error);
    return { success: false, error: message };
  }
}

export async function getWorkspaceByIdAction(
  workspaceId: string,
): Promise<ActionResult<Workspace | null>> {
  if (!workspaceId || workspaceId.trim().length === 0) {
    return { success: false, error: "workspaceId is required" };
  }

  try {
    await requireWorkspaceAccess(workspaceId);
    const workspace = await getWorkspaceById(workspaceId);
    const workspaceWithOwnerName = {
      ...workspace!,
      ownerId: (await getUsernameByUserId(workspace!.ownerId))!,
    };
    return { success: true, data: workspaceWithOwnerName ?? null };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Failed to get workspace", error);
    return { success: false, error: message };
  }
}

export async function deleteWorkspaceAction(
  workspaceId: string,
): Promise<ActionResult<null>> {
  if (!workspaceId?.trim()) {
    return { success: false, error: "workspaceId is required" };
  }

  try {
    const user = await requireUser();
    await deleteWorkspace(workspaceId, user.id);
    return { success: true, data: null };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Failed to delete workspace", error);
    return { success: false, error: message };
  }
}

export async function updateWorkspaceAction(
  workspaceId: string,
  newName: string,
): Promise<ActionResult<Workspace>> {
  if (!workspaceId?.trim() || !newName?.trim()) {
    return { success: false, error: "workspaceId and newName are required" };
  }

  try {
    const user = await requireUser();
    const workspace = await updateWorkspace(
      workspaceId,
      user.id,
      newName.trim(),
    );
    const workspaceWithOwnerName = {
      ...workspace!,
      ownerId: (await getUsernameByUserId(workspace!.ownerId))!,
    };
    return { success: true, data: workspaceWithOwnerName ?? null };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Failed to update workspace", error);
    return { success: false, error: message };
  }
}

export async function getWorkspaceUsersAction(
  workspaceId: string,
): Promise<ActionResult<{ email: string; role: WorkspaceRole }[]>> {
  if (!workspaceId?.trim()) {
    return { success: false, error: "workspaceId is required" };
  }

  try {
    await requireWorkspaceAdmin(workspaceId);
    const users = await getWorkspaceUsers(workspaceId);
    return { success: true, data: users };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Failed to get workspace users", error);
    return { success: false, error: message };
  }
}

export async function addUserToWorkspaceAction(
  workspaceId: string,
  userEmail: string,
  role: WorkspaceRole,
): Promise<ActionResult<{ email: string; role: WorkspaceRole }>> {
  if (!workspaceId?.trim() || !userEmail?.trim()) {
    return { success: false, error: "workspaceId and userEmail are required" };
  }

  if (!["admin", "editor", "viewer"].includes(role)) {
    return { success: false, error: "Invalid role" };
  }

  try {
    await requireWorkspaceAdmin(workspaceId);
    const newUser = await addUserToWorkspace(
      workspaceId,
      (await requireUser()).id,
      userEmail.trim(),
      role,
    );
    return { success: true, data: newUser };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Failed to add user to workspace", error);
    return { success: false, error: message };
  }
}

export async function removeUserFromWorkspaceAction(
  workspaceId: string,
  userEmail: string,
): Promise<ActionResult<null>> {
  if (!workspaceId?.trim() || !userEmail?.trim()) {
    return { success: false, error: "workspaceId and userEmail are required" };
  }

  try {
    await requireWorkspaceAdmin(workspaceId);
    await removeUserFromWorkspace(
      workspaceId,
      (await requireUser()).id,
      userEmail.trim(),
    );
    return { success: true, data: null };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Failed to remove user from workspace", error);
    return { success: false, error: message };
  }
}

export async function updateUserRoleAction(
  workspaceId: string,
  userEmail: string,
  newRole: WorkspaceRole,
): Promise<ActionResult<{ email: string; role: WorkspaceRole }>> {
  if (!workspaceId?.trim() || !userEmail?.trim()) {
    return { success: false, error: "workspaceId and userEmail are required" };
  }

  if (!["admin", "editor", "viewer"].includes(newRole)) {
    return { success: false, error: "Invalid role" };
  }

  try {
    await requireWorkspaceAdmin(workspaceId);
    const updatedUser = await updateUserRole(
      workspaceId,
      (await requireUser()).id,
      userEmail.trim(),
      newRole,
    );
    return { success: true, data: updatedUser };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Failed to update user role", error);
    return { success: false, error: message };
  }
}
