"use server";

import {
  createWorkspace,
  listWorkspacesForUser,
} from "@/backend/workspace/workspace.service";
import { WorkspaceSidebarClient } from "./WorkspaceSidebarPanel";
import { Workspace, parseBackendWorkspace } from "@/@types/workspace";
import { CreateWorkspaceInput } from "@/backend/workspace/workspace.types";
import { revalidatePath } from "next/cache";

const userId = "user_1"; // TODO: need to get userId from some auth context or something

export default async function WorkspaceServer() {
  const workspaces = (await listWorkspacesForUser(userId)).map((workspace) =>
    parseBackendWorkspace(workspace),
  );
  return <WorkspaceSidebarClient />;
}

/**
 * Creates a new workspace
 *
 * This funtion makes use of the createWorkspace Service function
 *
 * @remarks
 * If can't create, prints to console log
 *
 * @return
 * WS object
 */

export async function createNewWorkspace(workspaceName: string) {
  if (workspaceName === "") {
    throw new Error("Workspace Name cannot be empty");
  }

  const createWorkspaceInput: CreateWorkspaceInput = {
    name: workspaceName,
  };

  const ws: Workspace | null = await createWorkspace(
    createWorkspaceInput,
    userId,
  ).then((ws) => parseBackendWorkspace(ws));
  revalidatePath("/");
}
