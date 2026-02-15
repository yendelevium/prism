"use client";

import { useEffect } from "react";
import { useSelectionStore } from "@/stores/useSelectionStore"; // Zustand hook for workspace
import { useCollectionStore } from "@/stores/useCollectionStore"; // Zustand hook for collections
import { listCollectionsByWorkspaceAction } from "@/backend/collection/collection.actions"; // API call
import { collectionToCollectionItem } from "@/@types/collectionItem";
import { unwrap } from "@/@types/actionResult";

export function WorkspaceCollectionSync() {
  const workspace = useSelectionStore((s) => s.workspace); // Getting workspace from selectionStore
  const setCollections = useCollectionStore((s) => s.setCollections); // Getting the setCollections method
  const setLoading = useCollectionStore((s) => s.setLoading);

  useEffect(() => {
    if (!workspace) {
      setCollections([]); // If no workspace, clear collections
      return;
    }

    setLoading(true);

    const loadCollections = async () => {
      const raw = unwrap(
        await listCollectionsByWorkspaceAction(workspace.id), // Fetch collections for the new workspace
      );

      const items = await Promise.all(
        raw.map((c) => collectionToCollectionItem(c)), // Convert them to CollectionItem format
      );

      setCollections(items); // Store the collections in Zustand
    };

    loadCollections(); // Trigger the fetch when workspace changes
  }, [workspace?.id, setCollections]); // Dependency on workspace.id - triggers whenever workspace changes

  return null; // This component has no UI; it's purely for side-effects
}
