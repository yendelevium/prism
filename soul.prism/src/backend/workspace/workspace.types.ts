export interface Workspace {
  id: string;
  name: string;
  createdAt: Date;
  ownerId: string;
}

export interface CreateWorkspaceInput {
  name: string;
}

export interface WorkspaceResponse {
  data: Workspace | Workspace[];
}
