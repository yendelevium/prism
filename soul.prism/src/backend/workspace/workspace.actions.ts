"use server";

import {
  createWorkspace,
  deleteWorkspace,
  updateWorkspace,
  listWorkspacesForUser,
  getWorkspaceById,
} from "@/backend/workspace/workspace.service";
import type { Workspace } from "@/backend/workspace/workspace.types";
import { requireUser, requireWorkspaceAccess } from "@/backend/auth/auth.utils";
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
    return { success: true, data: workspace };
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
        ownerId: (await getUsernameByUserId(user.id))!,
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
      ...workspace,
      ownerId: getUsernameByUserId(workspace!.ownerId),
    };
    return { success: true, data: workspace ?? null };
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
    return { success: true, data: workspace };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Failed to update workspace", error);
    return { success: false, error: message };
  }
}
