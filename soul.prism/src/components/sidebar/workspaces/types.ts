
export type Workspace = {
  id: string;
  name: string;
  users: string[];
  created_by: string;
  created_at: string;
};

export type WorkspaceSidebarProps = {
  initialWorkspaces: Workspace[];
  createNewWorkspace: (workspaceName: string) => Promise<Workspace | null>;
};