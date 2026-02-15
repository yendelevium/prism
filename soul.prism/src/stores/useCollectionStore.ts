import { CollectionItem } from "@/@types/collectionItem";
import { create } from "zustand";

export interface CollectionState {
  collections: CollectionItem[];
  isLoading: boolean;

  setCollections: (c: CollectionItem[]) => void;
  setLoading: (l: boolean) => void;
}

export const useCollectionStore = create<CollectionState>((set) => ({
  collections: [],
  isLoading: false,

  setCollections: (collections) => set({ collections, isLoading: false }),
  setLoading: (isLoading) => set({ isLoading }),
}));
