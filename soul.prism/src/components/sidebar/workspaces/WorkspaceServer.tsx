"use server";

import {
  createWorkspace,
  listWorkspacesForUser,
} from "@/backend/workspace/workspace.service";
import { WorkspaceSidebarClient } from "./WorkspaceSidebarPanel";
import { Workspace } from "@/@types/workspace";
import {
  CreateWorkspaceInput,
  Workspace as Workspace_S,
} from "@/backend/workspace/workspace.types";
import { parseBackendWorkspace } from "@/@types/workspace";
import { refresh, revalidatePath } from "next/cache";

const userId = "user_1"; // TODO: need to get userId from some auth context or something

export default async function WorkspaceServer() {
  // Mocking the database response from the Request/Trace schema
  const mockWorkspaces: Workspace[] = [
    {
      id: "1",
      name: "Workspace 1",
      users: ["user 2", "user 3"],
      created_by: "user 1",
      created_at: new Date().toISOString(),
    },
    {
      id: "2",
      name: "Workspace 2",
      users: [],
      created_by: "user 2",
      created_at: new Date().toISOString(),
    },
  ];

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
