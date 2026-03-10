import {
  Workspace as Workspace_S,
  WorkspaceUser as WorkspaceUser_S,
} from "@/backend/workspace/workspace.types";

export interface WorkspaceUser {
  email: string;
  role: string;
}

export interface Workspace {
  id: string;
  name: string;
  users: WorkspaceUser[];
  created_by: string;
  created_at: string;
}

export function parseBackendWorkspace(workspace: Workspace_S) {
  return {
    id: workspace.id,
    name: workspace.name,
    users: workspace.users ?? [],
    created_by: workspace.ownerId,
    created_at: workspace.createdAt.toISOString(),
  } as Workspace;
}
