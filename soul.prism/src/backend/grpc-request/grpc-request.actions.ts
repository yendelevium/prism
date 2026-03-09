"use server";

import {
  createGRPCRequest,
  deleteGRPCRequest,
  getGRPCRequestById,
  getGRPCRequestsByCollection,
  updateGRPCRequest,
} from "@/backend/grpc-request/grpc-request.service";
import { getCollectionById } from "@/backend/collection/collection.service";
import type {
  CreateGRPCRequestInput,
  GRPCRequest,
  UpdateGRPCRequestInput,
} from "@/backend/grpc-request/grpc-request.types";
import { requireUser, requireWorkspaceAccess } from "@/backend/auth/auth.utils";

export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

export async function createGRPCRequestAction(
  input: CreateGRPCRequestInput,
): Promise<ActionResult<GRPCRequest>> {
  const name = typeof input.name === "string" ? input.name.trim() : "";
  const serverAddress =
    typeof input.serverAddress === "string" ? input.serverAddress.trim() : "";
  const service = typeof input.service === "string" ? input.service.trim() : "";
  const method = typeof input.method === "string" ? input.method.trim() : "";
  const protoFile =
    typeof input.protoFile === "string" ? input.protoFile.trim() : "";
  const collectionId =
    typeof input.collectionId === "string" ? input.collectionId.trim() : "";

  if (
    !name ||
    !serverAddress ||
    !service ||
    !method ||
    !protoFile ||
    !collectionId
  ) {
    return {
      success: false,
      error:
        "name, serverAddress, service, method, protoFile, and collectionId are required",
    };
  }

  try {
    const user = await requireUser();
    const collection = await getCollectionById(collectionId);
    if (!collection) {
      return { success: false, error: "Collection not found" };
    }
    await requireWorkspaceAccess(collection.workspaceId);

    const created = await createGRPCRequest({
      name,
      serverAddress,
      service,
      method,
      protoFile,
      metadata: input.metadata ?? null,
      useTls: input.useTls ?? false,
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
    console.error("Failed to create gRPC request", error);
    return { success: false, error: message };
  }
}

export async function getGRPCRequestsByCollectionAction(
  collectionId: string,
): Promise<ActionResult<GRPCRequest[]>> {
  if (!collectionId || collectionId.trim().length === 0) {
    return { success: false, error: "collectionId is required" };
  }

  try {
    const collection = await getCollectionById(collectionId);
    if (!collection) {
      return { success: false, error: "Collection not found" };
    }
    await requireWorkspaceAccess(collection.workspaceId);
    const requests = await getGRPCRequestsByCollection(collectionId);
    return { success: true, data: requests };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Failed to get gRPC requests", error);
    return { success: false, error: message };
  }
}

export async function getGRPCRequestByIdAction(
  requestId: string,
): Promise<ActionResult<GRPCRequest | null>> {
  if (!requestId || requestId.trim().length === 0) {
    return { success: false, error: "requestId is required" };
  }

  try {
    const request = await getGRPCRequestById(requestId);
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
    console.error("Failed to get gRPC request", error);
    return { success: false, error: message };
  }
}

export async function updateGRPCRequestAction(
  requestId: string,
  input: UpdateGRPCRequestInput,
): Promise<ActionResult<GRPCRequest>> {
  if (!requestId || requestId.trim().length === 0) {
    return { success: false, error: "requestId is required" };
  }

  const updates: UpdateGRPCRequestInput = {};

  if (input.name !== undefined) {
    if (typeof input.name !== "string" || input.name.trim().length === 0) {
      return { success: false, error: "name must be a non-empty string" };
    }
    updates.name = input.name.trim();
  }

  if (input.serverAddress !== undefined) {
    if (
      typeof input.serverAddress !== "string" ||
      input.serverAddress.trim().length === 0
    ) {
      return {
        success: false,
        error: "serverAddress must be a non-empty string",
      };
    }
    updates.serverAddress = input.serverAddress.trim();
  }

  if (input.service !== undefined) {
    if (
      typeof input.service !== "string" ||
      input.service.trim().length === 0
    ) {
      return {
        success: false,
        error: "service must be a non-empty string",
      };
    }
    updates.service = input.service.trim();
  }

  if (input.method !== undefined) {
    if (typeof input.method !== "string" || input.method.trim().length === 0) {
      return {
        success: false,
        error: "method must be a non-empty string",
      };
    }
    updates.method = input.method.trim();
  }

  if (input.protoFile !== undefined) {
    if (
      typeof input.protoFile !== "string" ||
      input.protoFile.trim().length === 0
    ) {
      return {
        success: false,
        error: "protoFile must be a non-empty string",
      };
    }
    updates.protoFile = input.protoFile.trim();
  }

  if (input.metadata !== undefined) {
    if (
      input.metadata !== null &&
      (typeof input.metadata !== "object" || Array.isArray(input.metadata))
    ) {
      return { success: false, error: "metadata must be an object or null" };
    }
    updates.metadata = input.metadata;
  }

  if (input.useTls !== undefined) {
    if (typeof input.useTls !== "boolean") {
      return { success: false, error: "useTls must be a boolean" };
    }
    updates.useTls = input.useTls;
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
    const existing = await getGRPCRequestById(requestId);
    if (!existing) {
      return { success: false, error: "request not found" };
    }

    const collection = await getCollectionById(existing.collectionId);
    if (!collection) {
      return { success: false, error: "Collection not found" };
    }
    await requireWorkspaceAccess(collection.workspaceId);

    const updated = await updateGRPCRequest(requestId, updates);
    return { success: true, data: updated };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Failed to update gRPC request", error);
    return { success: false, error: message };
  }
}

export async function deleteGRPCRequestAction(
  requestId: string,
): Promise<ActionResult<GRPCRequest>> {
  if (!requestId || requestId.trim().length === 0) {
    return { success: false, error: "requestId is required" };
  }

  try {
    const existing = await getGRPCRequestById(requestId);
    if (!existing) {
      return { success: false, error: "request not found" };
    }
    const collection = await getCollectionById(existing.collectionId);
    if (!collection) {
      return { success: false, error: "Collection not found" };
    }
    await requireWorkspaceAccess(collection.workspaceId);
    const deleted = await deleteGRPCRequest(requestId);
    return { success: true, data: deleted };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Failed to delete gRPC request", error);
    return { success: false, error: message };
  }
}
