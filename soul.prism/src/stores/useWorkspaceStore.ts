import { Workspace } from "@/@types/workspace";
import { create } from "zustand";

interface WorkspaceState {
    workspaces: Workspace[];
    setWorkspaces: (w: Workspace[]) => void;
}

export const useWorkspaceStore = create<WorkspaceState>((set) => ({
    workspaces: [],
    setWorkspaces: (workspaces) => set({ workspaces }),
}))