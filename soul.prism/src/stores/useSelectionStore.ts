//stores/useSelectionStore.ts

import { Collection, RequestItem } from "@/components/sidebar/collections/types";
import { Workspace } from "@/@types/workspace";
import { create } from "zustand";

interface SelectionState {
    workspace: Workspace | null,
    collection: Collection | null,
    request: RequestItem | null

    getWorkspace: () => Workspace | null;
    getCollection: () => Collection | null;
    getRequest: () => RequestItem | null; 
    setWorkspace: (w: Workspace) => void;
    setCollection: (c: Collection) => void;
    setRequest: (r: RequestItem) => void; 
}

export const useSelectionStore = create<SelectionState>((set, get) => ({
    workspace: null,
    collection: null,
    request: null,

    getWorkspace: () => get().workspace,
    getCollection: () => get().collection,
    getRequest: () => get().request,
    setWorkspace: (workspace) => set({ workspace }),
    setCollection: (collection) => set({ collection }),
    setRequest: (request) => set({ request }),
}))

