import type { Workspace } from "./workspace.types";

const now = new Date();

export const workspaceStore: Workspace[] = [
  {
    id: "ws_01",
    name: "Default Workspace",
    createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 3),
    ownerId: "user_01",
  },
  {
    id: "ws_02",
    name: "QA Team",
    createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 1),
    ownerId: "user_02",
  },
];
