"use server";

import {
  createCollection,
  deleteCollection,
  getCollectionById,
  listCollectionsByWorkspace,
} from "@/backend/collection/collection.service";
import type { Collection } from "@/backend/collection/collection.types";

export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

export async function createCollectionAction(
  name: string,
  workspaceId: string,
  userId: string,
): Promise<ActionResult<Collection>> {
  const trimmedName = name?.trim();

  if (!trimmedName || trimmedName.length === 0) {
    return { success: false, error: "name is required" };
  }

  if (!workspaceId || workspaceId.trim().length === 0) {
    return { success: false, error: "workspaceId is required" };
  }

  if (!userId || userId.trim().length === 0) {
    return { success: false, error: "userId is required" };
  }

  try {
    const collection = await createCollection(
      { name: trimmedName, workspaceId },
      userId,
    );
    return { success: true, data: collection };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Failed to create collection", error);
    return { success: false, error: message };
  }
}

export async function listCollectionsByWorkspaceAction(
  workspaceId: string,
): Promise<ActionResult<Collection[]>> {
  if (!workspaceId || workspaceId.trim().length === 0) {
    return { success: false, error: "workspaceId is required" };
  }

  try {
    const collections = await listCollectionsByWorkspace(workspaceId);
    return { success: true, data: collections };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Failed to list collections", error);
    return { success: false, error: message };
  }
}

export async function getCollectionByIdAction(
  collectionId: string,
): Promise<ActionResult<Collection | null>> {
  if (!collectionId || collectionId.trim().length === 0) {
    return { success: false, error: "collectionId is required" };
  }

  try {
    const collection = await getCollectionById(collectionId);
    return { success: true, data: collection };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Failed to get collection", error);
    return { success: false, error: message };
  }
}

export async function deleteCollectionAction(
  collectionId: string,
): Promise<ActionResult<Collection>> {
  if (!collectionId || collectionId.trim().length === 0) {
    return { success: false, error: "collectionId is required" };
  }

  try {
    const deleted = await deleteCollection(collectionId);
    return { success: true, data: deleted };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Failed to delete collection", error);
    return { success: false, error: message };
  }
}
