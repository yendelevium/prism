import { Workspace as Workspace_S } from "@/backend/workspace/workspace.types";


export interface Workspace {
    id: string;
    name: string;
    users: string[];
    created_by: string;
    created_at: string;
}


/**
 * Parses workspace type from {@link workspace.service!workspace | backend} to workspace type from {@link workspaces/types! | frontend}
 * 
 * @param workspace - from backend to be parsed 
 * @returns 
 */
export function parseBackendWorkspace(workspace: Workspace_S) {
  return {
    id: workspace.id,
    name: workspace.name,
    users: [], // TODO: listWorkspacesForUser should include the users associated with each workspace
    created_by: workspace.ownerId,
    created_at: workspace.createdAt.toISOString()
  } as Workspace;
}