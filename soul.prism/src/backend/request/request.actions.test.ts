// Unit tests for request.actions: auth + service calls mocked.
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/backend/auth/auth.utils", () => ({
  requireUser: vi.fn(),
  requireWorkspaceAccess: vi.fn(),
}));

vi.mock("@/backend/collection/collection.service", () => ({
  getCollectionById: vi.fn(),
}));

vi.mock("@/backend/request/request.service", () => ({
  createRequest: vi.fn(),
  getRequestsByCollection: vi.fn(),
  getRequestById: vi.fn(),
  updateRequest: vi.fn(),
  deleteRequest: vi.fn(),
}));

import {
  createRequestAction,
  getRequestsByCollectionAction,
  getRequestByIdAction,
  updateRequestAction,
  deleteRequestAction,
} from "./request.actions";
import { requireUser, requireWorkspaceAccess } from "@/backend/auth/auth.utils";
import { getCollectionById } from "@/backend/collection/collection.service";
import {
  createRequest,
  getRequestsByCollection,
  getRequestById,
  updateRequest,
  deleteRequest,
} from "@/backend/request/request.service";

beforeEach(() => {
  vi.resetAllMocks();
});

describe("request.actions", () => {
  it("rejects create when required fields are missing", async () => {
    const result = await createRequestAction({
      // @ts-expect-error test input
      name: "",
      method: "GET",
      url: "",
      collectionId: "",
      createdById: "",
    });

    expect(result.success).toBe(false);
    expect(createRequest).not.toHaveBeenCalled();
  });

  it("creates request for authenticated user and workspace", async () => {
    (requireUser as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "user-1",
    });
    (getCollectionById as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "col-1",
      workspaceId: "ws-1",
    });
    (requireWorkspaceAccess as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "user-1",
    });
    (createRequest as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "req-1",
    });

    const result = await createRequestAction({
      name: "Get Users",
      method: "GET",
      url: "https://api.example.com",
      headers: null,
      body: null,
      collectionId: "col-1",
      createdById: "ignored",
    });

    expect(requireUser).toHaveBeenCalled();
    expect(requireWorkspaceAccess).toHaveBeenCalledWith("ws-1");
    expect(createRequest).toHaveBeenCalledWith({
      name: "Get Users",
      method: "GET",
      url: "https://api.example.com",
      headers: null,
      body: null,
      collectionId: "col-1",
      createdById: "user-1",
    });
    expect(result.success).toBe(true);
  });

  it("returns error when collection is missing in list", async () => {
    (getCollectionById as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    const result = await getRequestsByCollectionAction("missing");

    expect(result.success).toBe(false);
    expect(getRequestsByCollection).not.toHaveBeenCalled();
  });

  it("enforces workspace access when fetching by id", async () => {
    (getRequestById as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "req-1",
      collectionId: "col-1",
    });
    (getCollectionById as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "col-1",
      workspaceId: "ws-1",
    });
    (requireWorkspaceAccess as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "user-1",
    });

    const result = await getRequestByIdAction("req-1");

    expect(requireWorkspaceAccess).toHaveBeenCalledWith("ws-1");
    expect(result.success).toBe(true);
  });

  it("returns error when update target is missing", async () => {
    (getRequestById as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    const result = await updateRequestAction("missing", { name: "x" });

    expect(result.success).toBe(false);
    expect(updateRequest).not.toHaveBeenCalled();
  });

  it("returns error when delete target is missing", async () => {
    (getRequestById as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    const result = await deleteRequestAction("missing");

    expect(result.success).toBe(false);
    expect(deleteRequest).not.toHaveBeenCalled();
  });
});
