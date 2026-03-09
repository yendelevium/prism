//stores/useSelectionStore.ts

import {
  CollectionItem,
  AnyRequestItem,
  RequestItem,
  GraphQLRequestItem,
  GRPCRequestItem,
} from "@/@types/collectionItem";
import { Workspace } from "@/@types/workspace";
import { create } from "zustand";

interface SelectionState {
  workspace: Workspace | null;
  collection: CollectionItem | null;
  request: AnyRequestItem | null;

  getWorkspace: () => Workspace | null;
  getCollection: () => CollectionItem | null;
  getRequest: () => AnyRequestItem | null;
  setWorkspace: (w: Workspace | null) => void;
  setCollection: (c: CollectionItem | null) => void;
  setRequest: (r: AnyRequestItem | null) => void;
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
}));
