import { Workspace } from "@/@types/workspace";
import { create } from "zustand";

interface WorkspaceState {
  workspaces: Workspace[];
  isLoading: boolean;
  setWorkspaces: (w: Workspace[]) => void;
  setLoading: (l: boolean) => void;
}

export const useWorkspaceStore = create<WorkspaceState>((set) => ({
  workspaces: [],
  isLoading: false,
  setWorkspaces: (workspaces) => set({ workspaces }),
  setLoading: (isLoading) => set({ isLoading }),
}));
