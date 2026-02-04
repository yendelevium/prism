"use server";

import {
  createWorkspace,
  listWorkspacesForUser,
  getWorkspaceById,
} from "@/backend/workspace/workspace.service";
import type { Workspace } from "@/backend/workspace/workspace.types";

export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

export async function createWorkspaceAction(
  name: string,
  userId: string,
): Promise<ActionResult<Workspace>> {
  const trimmedName = name?.trim();

  if (!trimmedName || trimmedName.length === 0) {
    return { success: false, error: "name is required" };
  }

  if (!userId || userId.trim().length === 0) {
    return { success: false, error: "userId is required" };
  }

  try {
    const workspace = await createWorkspace({ name: trimmedName }, userId);
    return { success: true, data: workspace };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Failed to create workspace", error);
    return { success: false, error: message };
  }
}

export async function listWorkspacesAction(
  userId: string,
): Promise<ActionResult<Workspace[]>> {
  if (!userId || userId.trim().length === 0) {
    return { success: false, error: "userId is required" };
  }

  try {
    const workspaces = await listWorkspacesForUser(userId);
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
    const workspace = await getWorkspaceById(workspaceId);
    return { success: true, data: workspace ?? null };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Failed to get workspace", error);
    return { success: false, error: message };
  }
}
