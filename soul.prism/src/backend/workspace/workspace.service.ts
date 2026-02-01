import { workspaceStore } from "./workspace.mock";
import type { CreateWorkspaceInput, Workspace } from "./workspace.types";

export function createWorkspace(
  input: CreateWorkspaceInput,
  userId: string,
): Workspace {
  const name = input.name.trim();

  const workspace: Workspace = {
    id: crypto.randomUUID(),
    name,
    createdAt: new Date(),
    ownerId: userId,
  };

  workspaceStore.push(workspace);
  return workspace;
}

export function listWorkspacesForUser(userId: string): Workspace[] {
  return workspaceStore.filter((workspace) => workspace.ownerId === userId);
}

export function getWorkspaceById(workspaceId: string): Workspace | undefined {
  return workspaceStore.find((workspace) => workspace.id === workspaceId);
}
