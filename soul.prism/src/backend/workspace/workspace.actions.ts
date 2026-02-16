"use server";

import {
  createWorkspace,
  listWorkspacesForUser,
  getWorkspaceById,
} from "@/backend/workspace/workspace.service";
import type { Workspace } from "@/backend/workspace/workspace.types";
import { requireUser, requireWorkspaceAccess } from "@/backend/auth/auth.utils";

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
    const workspaces = await listWorkspacesForUser(user.id);
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
    return { success: true, data: workspace ?? null };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Failed to get workspace", error);
    return { success: false, error: message };
  }
}
