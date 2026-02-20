"use server";

import {
  createCollection,
  deleteCollection,
  getCollectionById,
  updateCollection,
  listCollectionsByWorkspace,
} from "@/backend/collection/collection.service";
import type {
  Collection,
  UpdateCollectionInput,
} from "@/backend/collection/collection.types";
import { requireUser, requireWorkspaceAccess } from "@/backend/auth/auth.utils";

export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

export async function createCollectionAction(
  name: string,
  workspaceId: string,
): Promise<ActionResult<Collection>> {
  const trimmedName = name?.trim();

  if (!trimmedName || trimmedName.length === 0) {
    return { success: false, error: "name is required" };
  }

  if (!workspaceId || workspaceId.trim().length === 0) {
    return { success: false, error: "workspaceId is required" };
  }

  try {
    const user = await requireUser();
    await requireWorkspaceAccess(workspaceId);
    const collection = await createCollection(
      { name: trimmedName, workspaceId },
      user.id,
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
    await requireWorkspaceAccess(workspaceId);
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
    if (collection) {
      await requireWorkspaceAccess(collection.workspaceId);
    }
    return { success: true, data: collection };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Failed to get collection", error);
    return { success: false, error: message };
  }
}

export async function updateCollectionAction(
  collectionId: string,
  input: UpdateCollectionInput,
): Promise<ActionResult<Collection>> {
  if (!collectionId || collectionId.trim().length === 0) {
    return { success: false, error: "collectionId is required" };
  }

  if (
    input.name === undefined ||
    typeof input.name !== "string" ||
    input.name.trim().length === 0
  ) {
    return { success: false, error: "name must be a non-empty string" };
  }

  try {
    const existing = await getCollectionById(collectionId);
    if (!existing) {
      return { success: false, error: "Collection not found" };
    }
    await requireWorkspaceAccess(existing.workspaceId);

    const updated = await updateCollection(collectionId, input);
    return { success: true, data: updated };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Failed to update collection", error);
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
    const collection = await getCollectionById(collectionId);
    if (!collection) {
      return { success: false, error: "collection not found" };
    }
    await requireWorkspaceAccess(collection.workspaceId);
    const deleted = await deleteCollection(collectionId);
    return { success: true, data: deleted };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Failed to delete collection", error);
    return { success: false, error: message };
  }
}
