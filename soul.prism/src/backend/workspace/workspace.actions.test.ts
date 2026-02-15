import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/backend/auth/auth.utils", () => ({
  requireUser: vi.fn(),
  requireWorkspaceAccess: vi.fn(),
}));

vi.mock("@/backend/workspace/workspace.service", () => ({
  createWorkspace: vi.fn(),
  listWorkspacesForUser: vi.fn(),
  getWorkspaceById: vi.fn(),
}));

import {
  createWorkspaceAction,
  getWorkspaceByIdAction,
  listWorkspacesAction,
} from "./workspace.actions";
import { requireUser, requireWorkspaceAccess } from "@/backend/auth/auth.utils";
import {
  createWorkspace,
  getWorkspaceById,
  listWorkspacesForUser,
} from "@/backend/workspace/workspace.service";

beforeEach(() => {
  vi.resetAllMocks();
});

describe("workspace.actions", () => {
  it("rejects create when name is missing", async () => {
    const result = await createWorkspaceAction("");
    expect(result.success).toBe(false);
  });

  it("creates workspace for authenticated user", async () => {
    (requireUser as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "user-1",
    });
    (createWorkspace as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "ws-1",
    });

    const result = await createWorkspaceAction("Test");

    expect(requireUser).toHaveBeenCalled();
    expect(createWorkspace).toHaveBeenCalledWith({ name: "Test" }, "user-1");
    expect(result.success).toBe(true);
  });

  it("lists workspaces for authenticated user", async () => {
    (requireUser as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "user-1",
    });
    (listWorkspacesForUser as ReturnType<typeof vi.fn>).mockResolvedValue([]);

    const result = await listWorkspacesAction();

    expect(listWorkspacesForUser).toHaveBeenCalledWith("user-1");
    expect(result.success).toBe(true);
  });

  it("enforces workspace access when fetching by id", async () => {
    (requireWorkspaceAccess as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "user-1",
    });
    (getWorkspaceById as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "ws-1",
    });

    const result = await getWorkspaceByIdAction("ws-1");

    expect(requireWorkspaceAccess).toHaveBeenCalledWith("ws-1");
    expect(result.success).toBe(true);
  });
});
