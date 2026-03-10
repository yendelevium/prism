export type WorkspaceRole = "admin" | "editor" | "viewer";

export interface WorkspaceUser {
  email: string;
  role: WorkspaceRole;
}

export interface Workspace {
  id: string;
  name: string;
  createdAt: Date;
  ownerId: string;
  users: WorkspaceUser[];
}

export interface CreateWorkspaceInput {
  name: string;
}

export interface WorkspaceResponse {
  data: Workspace | Workspace[];
}
