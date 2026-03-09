"use server";

import {
  createGraphQLRequest,
  deleteGraphQLRequest,
  getGraphQLRequestById,
  getGraphQLRequestsByCollection,
  updateGraphQLRequest,
} from "@/backend/graphql-request/graphql-request.service";
import { getCollectionById } from "@/backend/collection/collection.service";
import type {
  CreateGraphQLRequestInput,
  GraphQLRequest,
  UpdateGraphQLRequestInput,
} from "@/backend/graphql-request/graphql-request.types";
import { requireUser, requireWorkspaceAccess } from "@/backend/auth/auth.utils";

export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

export async function createGraphQLRequestAction(
  input: CreateGraphQLRequestInput,
): Promise<ActionResult<GraphQLRequest>> {
  const name = typeof input.name === "string" ? input.name.trim() : "";
  const url = typeof input.url === "string" ? input.url.trim() : "";
  const query = typeof input.query === "string" ? input.query.trim() : "";
  const collectionId =
    typeof input.collectionId === "string" ? input.collectionId.trim() : "";

  if (!name || !url || !query || !collectionId) {
    return {
      success: false,
      error: "name, url, query, and collectionId are required",
    };
  }

  try {
    const user = await requireUser();
    const collection = await getCollectionById(collectionId);
    if (!collection) {
      return { success: false, error: "Collection not found" };
    }
    await requireWorkspaceAccess(collection.workspaceId);

    const created = await createGraphQLRequest({
      name,
      url,
      query,
      variables: input.variables ?? null,
      operationName: input.operationName ?? null,
      headers: input.headers ?? null,
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
    console.error("Failed to create GraphQL request", error);
    return { success: false, error: message };
  }
}

export async function getGraphQLRequestsByCollectionAction(
  collectionId: string,
): Promise<ActionResult<GraphQLRequest[]>> {
  if (!collectionId || collectionId.trim().length === 0) {
    return { success: false, error: "collectionId is required" };
  }

  try {
    const collection = await getCollectionById(collectionId);
    if (!collection) {
      return { success: false, error: "Collection not found" };
    }
    await requireWorkspaceAccess(collection.workspaceId);
    const requests = await getGraphQLRequestsByCollection(collectionId);
    return { success: true, data: requests };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Failed to get GraphQL requests", error);
    return { success: false, error: message };
  }
}

export async function getGraphQLRequestByIdAction(
  requestId: string,
): Promise<ActionResult<GraphQLRequest | null>> {
  if (!requestId || requestId.trim().length === 0) {
    return { success: false, error: "requestId is required" };
  }

  try {
    const request = await getGraphQLRequestById(requestId);
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
    console.error("Failed to get GraphQL request", error);
    return { success: false, error: message };
  }
}

export async function updateGraphQLRequestAction(
  requestId: string,
  input: UpdateGraphQLRequestInput,
): Promise<ActionResult<GraphQLRequest>> {
  if (!requestId || requestId.trim().length === 0) {
    return { success: false, error: "requestId is required" };
  }

  const updates: UpdateGraphQLRequestInput = {};

  if (input.name !== undefined) {
    if (typeof input.name !== "string" || input.name.trim().length === 0) {
      return { success: false, error: "name must be a non-empty string" };
    }
    updates.name = input.name.trim();
  }

  if (input.url !== undefined) {
    if (typeof input.url !== "string" || input.url.trim().length === 0) {
      return { success: false, error: "url must be a non-empty string" };
    }
    updates.url = input.url.trim();
  }

  if (input.query !== undefined) {
    if (typeof input.query !== "string" || input.query.trim().length === 0) {
      return { success: false, error: "query must be a non-empty string" };
    }
    updates.query = input.query.trim();
  }

  if (input.variables !== undefined) {
    if (input.variables !== null && typeof input.variables !== "string") {
      return { success: false, error: "variables must be a string or null" };
    }
    updates.variables = input.variables;
  }

  if (input.operationName !== undefined) {
    if (
      input.operationName !== null &&
      typeof input.operationName !== "string"
    ) {
      return {
        success: false,
        error: "operationName must be a string or null",
      };
    }
    updates.operationName = input.operationName;
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

  if (Object.keys(updates).length === 0) {
    return { success: false, error: "At least one field must be provided" };
  }

  try {
    const existing = await getGraphQLRequestById(requestId);
    if (!existing) {
      return { success: false, error: "request not found" };
    }

    const collection = await getCollectionById(existing.collectionId);
    if (!collection) {
      return { success: false, error: "Collection not found" };
    }
    await requireWorkspaceAccess(collection.workspaceId);

    const updated = await updateGraphQLRequest(requestId, updates);
    return { success: true, data: updated };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Failed to update GraphQL request", error);
    return { success: false, error: message };
  }
}

export async function deleteGraphQLRequestAction(
  requestId: string,
): Promise<ActionResult<GraphQLRequest>> {
  if (!requestId || requestId.trim().length === 0) {
    return { success: false, error: "requestId is required" };
  }

  try {
    const existing = await getGraphQLRequestById(requestId);
    if (!existing) {
      return { success: false, error: "request not found" };
    }
    const collection = await getCollectionById(existing.collectionId);
    if (!collection) {
      return { success: false, error: "Collection not found" };
    }
    await requireWorkspaceAccess(collection.workspaceId);
    const deleted = await deleteGraphQLRequest(requestId);
    return { success: true, data: deleted };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Failed to delete GraphQL request", error);
    return { success: false, error: message };
  }
}
