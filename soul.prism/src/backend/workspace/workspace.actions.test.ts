import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/backend/auth/auth.utils", () => ({
  requireUser: vi.fn(),
  requireWorkspaceAccess: vi.fn(),
  requireWorkspaceAdmin: vi.fn(),
}));

vi.mock("@/backend/workspace/workspace.service", () => ({
  createWorkspace: vi.fn(),
  listWorkspacesForUser: vi.fn(),
  getWorkspaceById: vi.fn(),
  getWorkspaceUsers: vi.fn(),
  addUserToWorkspace: vi.fn(),
  removeUserFromWorkspace: vi.fn(),
  updateUserRole: vi.fn(),
}));

vi.mock("@/backend/user/user.service", () => ({
  getUsernameByUserId: vi.fn(),
}));

import {
  createWorkspaceAction,
  getWorkspaceByIdAction,
  listWorkspacesAction,
  getWorkspaceUsersAction,
  addUserToWorkspaceAction,
  removeUserFromWorkspaceAction,
  updateUserRoleAction,
} from "./workspace.actions";
import {
  requireUser,
  requireWorkspaceAccess,
  requireWorkspaceAdmin,
} from "@/backend/auth/auth.utils";
import {
  createWorkspace,
  getWorkspaceById,
  listWorkspacesForUser,
  getWorkspaceUsers,
  addUserToWorkspace,
  removeUserFromWorkspace,
  updateUserRole,
} from "@/backend/workspace/workspace.service";
import { getUsernameByUserId } from "@/backend/user/user.service";

beforeEach(() => {
  vi.resetAllMocks();
});

describe("workspace.actions", () => {
  describe("createWorkspaceAction", () => {
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
        name: "Test",
        createdAt: new Date(),
        ownerId: "user-1",
        users: [{ email: "user1@example.com", role: "admin" }],
      });
      (getUsernameByUserId as ReturnType<typeof vi.fn>).mockResolvedValue(
        "User One",
      );

      const result = await createWorkspaceAction("Test");

      expect(requireUser).toHaveBeenCalled();
      expect(createWorkspace).toHaveBeenCalledWith({ name: "Test" }, "user-1");
      expect(result.success).toBe(true);
    });
  });

  describe("listWorkspacesAction", () => {
    it("lists workspaces for authenticated user", async () => {
      (requireUser as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: "user-1",
      });
      (listWorkspacesForUser as ReturnType<typeof vi.fn>).mockResolvedValue([
        {
          id: "ws-1",
          name: "Workspace 1",
          createdAt: new Date(),
          ownerId: "user-1",
          users: [{ email: "user1@example.com", role: "admin" }],
        },
      ]);
      (getUsernameByUserId as ReturnType<typeof vi.fn>).mockResolvedValue(
        "User One",
      );

      const result = await listWorkspacesAction();

      expect(listWorkspacesForUser).toHaveBeenCalledWith("user-1");
      expect(getUsernameByUserId).toHaveBeenCalledWith("user-1");
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
    });
  });

  describe("getWorkspaceByIdAction", () => {
    it("enforces workspace access when fetching by id", async () => {
      (requireWorkspaceAccess as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: "user-1",
      });
      (getWorkspaceById as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: "ws-1",
        name: "Test",
        createdAt: new Date(),
        ownerId: "user-1",
        users: [{ email: "user1@example.com", role: "admin" }],
      });
      (getUsernameByUserId as ReturnType<typeof vi.fn>).mockResolvedValue(
        "User One",
      );

      const result = await getWorkspaceByIdAction("ws-1");

      expect(requireWorkspaceAccess).toHaveBeenCalledWith("ws-1");
      expect(result.success).toBe(true);
    });
  });

  describe("getWorkspaceUsersAction", () => {
    it("returns users for workspace when admin", async () => {
      (requireWorkspaceAdmin as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: "user-1",
      });
      (getWorkspaceUsers as ReturnType<typeof vi.fn>).mockResolvedValue([
        { email: "user1@example.com", role: "admin" },
        { email: "user2@example.com", role: "editor" },
      ]);

      const result = await getWorkspaceUsersAction("ws-1");

      expect(requireWorkspaceAdmin).toHaveBeenCalledWith("ws-1");
      expect(getWorkspaceUsers).toHaveBeenCalledWith("ws-1");
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(result.data).toContainEqual({
        email: "user1@example.com",
        role: "admin",
      });
    });

    it("rejects when workspaceId is missing", async () => {
      const result = await getWorkspaceUsersAction("");
      expect(result.success).toBe(false);
      expect(result.error).toBe("workspaceId is required");
    });
  });

  describe("addUserToWorkspaceAction", () => {
    it("adds user to workspace when admin", async () => {
      (requireWorkspaceAdmin as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: "user-1",
      });
      (requireUser as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: "user-1",
      });
      (addUserToWorkspace as ReturnType<typeof vi.fn>).mockResolvedValue({
        email: "newuser@example.com",
        role: "editor",
      });

      const result = await addUserToWorkspaceAction(
        "ws-1",
        "newuser@example.com",
        "editor",
      );

      expect(requireWorkspaceAdmin).toHaveBeenCalledWith("ws-1");
      expect(addUserToWorkspace).toHaveBeenCalledWith(
        "ws-1",
        "user-1",
        "newuser@example.com",
        "editor",
      );
      expect(result.success).toBe(true);
      expect(result.data).toEqual({
        email: "newuser@example.com",
        role: "editor",
      });
    });

    it("rejects when workspaceId is missing", async () => {
      const result = await addUserToWorkspaceAction(
        "",
        "user@example.com",
        "editor",
      );
      expect(result.success).toBe(false);
    });

    it("rejects invalid role", async () => {
      const result = await addUserToWorkspaceAction(
        "ws-1",
        "user@example.com",
        "invalid",
      );
      expect(result.success).toBe(false);
      expect(result.error).toBe("Invalid role");
    });
  });

  describe("removeUserFromWorkspaceAction", () => {
    it("removes user from workspace when admin", async () => {
      (requireWorkspaceAdmin as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: "user-1",
      });
      (requireUser as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: "user-1",
      });
      (removeUserFromWorkspace as ReturnType<typeof vi.fn>).mockResolvedValue(
        undefined,
      );

      const result = await removeUserFromWorkspaceAction(
        "ws-1",
        "user@example.com",
      );

      expect(requireWorkspaceAdmin).toHaveBeenCalledWith("ws-1");
      expect(removeUserFromWorkspace).toHaveBeenCalledWith(
        "ws-1",
        "user-1",
        "user@example.com",
      );
      expect(result.success).toBe(true);
    });

    it("rejects when workspaceId is missing", async () => {
      const result = await removeUserFromWorkspaceAction(
        "",
        "user@example.com",
      );
      expect(result.success).toBe(false);
    });
  });

  describe("updateUserRoleAction", () => {
    it("updates user role when admin", async () => {
      (requireWorkspaceAdmin as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: "user-1",
      });
      (requireUser as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: "user-1",
      });
      (updateUserRole as ReturnType<typeof vi.fn>).mockResolvedValue({
        email: "user@example.com",
        role: "viewer",
      });

      const result = await updateUserRoleAction(
        "ws-1",
        "user@example.com",
        "viewer",
      );

      expect(requireWorkspaceAdmin).toHaveBeenCalledWith("ws-1");
      expect(updateUserRole).toHaveBeenCalledWith(
        "ws-1",
        "user-1",
        "user@example.com",
        "viewer",
      );
      expect(result.success).toBe(true);
      expect(result.data).toEqual({
        email: "user@example.com",
        role: "viewer",
      });
    });

    it("rejects invalid role", async () => {
      const result = await updateUserRoleAction(
        "ws-1",
        "user@example.com",
        "invalid",
      );
      expect(result.success).toBe(false);
      expect(result.error).toBe("Invalid role");
    });
  });
});
