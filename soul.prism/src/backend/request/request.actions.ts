"use server";

import {
  createRequest,
  deleteRequest,
  getRequestById,
  getRequestsByCollection,
  updateRequest,
} from "@/backend/request/request.service";
import { getCollectionById } from "@/backend/collection/collection.service";
import type {
  CreateRequestInput,
  Request,
  UpdateRequestInput,
} from "@/backend/request/request.types";
import type { HttpMethod } from "@prisma/client";
import { requireUser, requireWorkspaceAccess } from "@/backend/auth/auth.utils";

export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

const allowedMethods: ReadonlySet<HttpMethod> = new Set([
  "GET",
  "POST",
  "PUT",
  "DELETE",
  "PATCH",
]);

function parseMethod(value: unknown): HttpMethod | null {
  if (typeof value !== "string") {
    return null;
  }

  const upper = value.toUpperCase() as HttpMethod;
  return allowedMethods.has(upper) ? upper : null;
}

export async function createRequestAction(
  input: CreateRequestInput,
): Promise<ActionResult<Request>> {
  const method = parseMethod(input.method);
  const name = typeof input.name === "string" ? input.name.trim() : "";
  const url = typeof input.url === "string" ? input.url.trim() : "";
  const collectionId =
    typeof input.collectionId === "string" ? input.collectionId.trim() : "";

  if (!name || !method || !url || !collectionId) {
    return {
      success: false,
      error: "name, method, url, and collectionId are required",
    };
  }

  try {
    const user = await requireUser();
    const collection = await getCollectionById(collectionId);
    if (!collection) {
      return { success: false, error: "Collection not found" };
    }
    await requireWorkspaceAccess(collection.workspaceId);

    const created = await createRequest({
      name,
      method,
      url,
      headers: input.headers ?? null,
      body: input.body ?? null,
      collectionId,
      createdById: user.id,
    });

    return { success: true, data: created };
  } catch (error) {
    if (error instanceof Error && error.message === "Collection not found") {
      return { success: false, error: error.message };
    }
    if (error instanceof Error && error.message === "User not found") {
      return { success: false, error: error.message };
    }
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Failed to create request", error);
    return { success: false, error: message };
  }
}

export async function getRequestsByCollectionAction(
  collectionId: string,
): Promise<ActionResult<Request[]>> {
  if (!collectionId || collectionId.trim().length === 0) {
    return { success: false, error: "collectionId is required" };
  }

  try {
    const collection = await getCollectionById(collectionId);
    if (!collection) {
      return { success: false, error: "Collection not found" };
    }
    await requireWorkspaceAccess(collection.workspaceId);
    const requests = await getRequestsByCollection(collectionId);
    return { success: true, data: requests };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Failed to get requests", error);
    return { success: false, error: message };
  }
}

export async function getRequestByIdAction(
  requestId: string,
): Promise<ActionResult<Request | null>> {
  if (!requestId || requestId.trim().length === 0) {
    return { success: false, error: "requestId is required" };
  }

  try {
    const request = await getRequestById(requestId);
    if (request) {
      const collection = await getCollectionById(request.collectionId);
      if (!collection) {
        return { success: false, error: "Collection not found" };
      }
      await requireWorkspaceAccess(collection.workspaceId);
    }
    return { success: true, data: request };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Failed to get request", error);
    return { success: false, error: message };
  }
}

export async function updateRequestAction(
  requestId: string,
  input: UpdateRequestInput,
): Promise<ActionResult<Request>> {
  if (!requestId || requestId.trim().length === 0) {
    return { success: false, error: "requestId is required" };
  }

  const updates: UpdateRequestInput = {};

  if (input.name !== undefined) {
    if (typeof input.name !== "string" || input.name.trim().length === 0) {
      return { success: false, error: "name must be a non-empty string" };
    }
    updates.name = input.name.trim();
  }

  if (input.method !== undefined) {
    const method = parseMethod(input.method);
    if (!method) {
      return { success: false, error: "method must be a valid HTTP method" };
    }
    updates.method = method;
  }

  if (input.url !== undefined) {
    if (typeof input.url !== "string" || input.url.trim().length === 0) {
      return { success: false, error: "url must be a non-empty string" };
    }
    updates.url = input.url.trim();
  }

  if (input.headers !== undefined) {
    if (
      input.headers !== null &&
      (typeof input.headers !== "object" || Array.isArray(input.headers))
    ) {
      return { success: false, error: "headers must be an object or null" };
    }
    updates.headers = input.headers;
  }

  if (input.body !== undefined) {
    if (input.body !== null && typeof input.body !== "string") {
      return { success: false, error: "body must be a string or null" };
    }
    updates.body = input.body;
  }

  if (Object.keys(updates).length === 0) {
    return { success: false, error: "At least one field must be provided" };
  }

  try {
    const existing = await getRequestById(requestId);
    if (!existing) {
      return { success: false, error: "request not found" };
    }

    const collection = await getCollectionById(existing.collectionId);
    if (!collection) {
      return { success: false, error: "Collection not found" };
    }
    await requireWorkspaceAccess(collection.workspaceId);

    const updated = await updateRequest(requestId, updates);
    return { success: true, data: updated };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Failed to update request", error);
    return { success: false, error: message };
  }
}

export async function deleteRequestAction(
  requestId: string,
): Promise<ActionResult<Request>> {
  if (!requestId || requestId.trim().length === 0) {
    return { success: false, error: "requestId is required" };
  }

  try {
    const existing = await getRequestById(requestId);
    if (!existing) {
      return { success: false, error: "request not found" };
    }
    const collection = await getCollectionById(existing.collectionId);
    if (!collection) {
      return { success: false, error: "Collection not found" };
    }
    await requireWorkspaceAccess(collection.workspaceId);
    const deleted = await deleteRequest(requestId);
    return { success: true, data: deleted };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Failed to delete request", error);
    return { success: false, error: message };
  }
}
