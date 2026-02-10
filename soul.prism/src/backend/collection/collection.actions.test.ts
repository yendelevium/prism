// Unit tests for collection.actions: auth + service calls mocked.
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/backend/auth/auth.utils", () => ({
  requireUser: vi.fn(),
  requireWorkspaceAccess: vi.fn(),
}));

vi.mock("@/backend/collection/collection.service", () => ({
  createCollection: vi.fn(),
  listCollectionsByWorkspace: vi.fn(),
  getCollectionById: vi.fn(),
  deleteCollection: vi.fn(),
}));

import {
  createCollectionAction,
  listCollectionsByWorkspaceAction,
  getCollectionByIdAction,
  deleteCollectionAction,
} from "./collection.actions";
import { requireUser, requireWorkspaceAccess } from "@/backend/auth/auth.utils";
import {
  createCollection,
  listCollectionsByWorkspace,
  getCollectionById,
  deleteCollection,
} from "@/backend/collection/collection.service";

beforeEach(() => {
  vi.resetAllMocks();
});

describe("collection.actions", () => {
  it("rejects create when name is missing", async () => {
    const result = await createCollectionAction("", "ws-1");
    expect(result.success).toBe(false);
    expect(createCollection).not.toHaveBeenCalled();
  });

  it("creates collection for authenticated user with access", async () => {
    (requireUser as ReturnType<typeof vi.fn>).mockResolvedValue({ id: "user-1" });
    (requireWorkspaceAccess as ReturnType<typeof vi.fn>).mockResolvedValue({ id: "user-1" });
    (createCollection as ReturnType<typeof vi.fn>).mockResolvedValue({ id: "col-1" });

    const result = await createCollectionAction("Test", "ws-1");

    expect(requireUser).toHaveBeenCalled();
    expect(requireWorkspaceAccess).toHaveBeenCalledWith("ws-1");
    expect(createCollection).toHaveBeenCalledWith(
      { name: "Test", workspaceId: "ws-1" },
      "user-1",
    );
    expect(result.success).toBe(true);
  });

  it("lists collections when workspaceId is valid", async () => {
    (requireWorkspaceAccess as ReturnType<typeof vi.fn>).mockResolvedValue({ id: "user-1" });
    (listCollectionsByWorkspace as ReturnType<typeof vi.fn>).mockResolvedValue([]);

    const result = await listCollectionsByWorkspaceAction("ws-1");

    expect(requireWorkspaceAccess).toHaveBeenCalledWith("ws-1");
    expect(listCollectionsByWorkspace).toHaveBeenCalledWith("ws-1");
    expect(result.success).toBe(true);
  });

  it("returns error when collection is missing for delete", async () => {
    (getCollectionById as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    const result = await deleteCollectionAction("missing");

    expect(result.success).toBe(false);
    expect(deleteCollection).not.toHaveBeenCalled();
  });

  it("enforces workspace access when fetching by id", async () => {
    (getCollectionById as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "col-1",
      workspaceId: "ws-1",
    });
    (requireWorkspaceAccess as ReturnType<typeof vi.fn>).mockResolvedValue({ id: "user-1" });

    const result = await getCollectionByIdAction("col-1");

    expect(requireWorkspaceAccess).toHaveBeenCalledWith("ws-1");
    expect(result.success).toBe(true);
  });
});
