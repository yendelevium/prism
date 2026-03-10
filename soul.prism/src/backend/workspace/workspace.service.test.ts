// Test file fix: use hoisted mocks to avoid Vitest TDZ errors with vi.mock.
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  return {
    queryMock: vi.fn(),
    connectMock: vi.fn(),
    releaseMock: vi.fn(),
    poolQueryMock: vi.fn(),
  };
});

vi.mock("pg", () => {
  mocks.connectMock.mockReturnValue({
    query: mocks.queryMock,
    release: mocks.releaseMock,
  });

  class Pool {
    connect() {
      return mocks.connectMock();
    }
    query(...args: unknown[]) {
      return mocks.poolQueryMock(...args);
    }
  }

  return { Pool };
});

vi.mock("dotenv", () => ({
  config: vi.fn(),
}));

import {
  createWorkspace,
  getWorkspaceById,
  listWorkspacesForUser,
  getUserIdByEmail,
  getWorkspaceUsers,
  addUserToWorkspace,
  removeUserFromWorkspace,
  updateUserRole,
} from "./workspace.service";

beforeEach(() => {
  vi.resetAllMocks();
  process.env.DATABASE_URL = "postgresql://user:pass@localhost:5432/test";
  mocks.connectMock.mockReturnValue({
    query: mocks.queryMock,
    release: mocks.releaseMock,
  });
  if (!globalThis.crypto) {
    // @ts-expect-error test shim
    globalThis.crypto = {};
  }
  // @ts-expect-error test shim
  globalThis.crypto.randomUUID = vi.fn(() => "uuid-1");
});

describe("workspace.service", () => {
  describe("createWorkspace", () => {
    it("creates a workspace for an existing user", async () => {
      mocks.queryMock
        .mockResolvedValueOnce({}) // BEGIN
        .mockResolvedValueOnce({
          rows: [{ id: "user-1", email: "user1@example.com" }],
        }) // user check
        .mockResolvedValueOnce({
          rows: [
            { id: "ws-1", name: "Test", createdAt: new Date("2025-01-01") },
          ],
        }) // insert workspace
        .mockResolvedValueOnce({}) // insert user_workspace
        .mockResolvedValueOnce({}); // COMMIT

      const workspace = await createWorkspace({ name: "Test" }, "user-1");

      expect(workspace.id).toBe("ws-1");
      expect(workspace.ownerId).toBe("user-1");
      expect(workspace.users).toEqual([
        { email: "user1@example.com", role: "admin" },
      ]);
      expect(mocks.queryMock).toHaveBeenCalled();
    });

    it("creates a user when missing", async () => {
      mocks.queryMock
        .mockResolvedValueOnce({}) // BEGIN
        .mockResolvedValueOnce({ rows: [] }) // user check
        .mockResolvedValueOnce({}) // insert user
        .mockResolvedValueOnce({
          rows: [
            { id: "ws-1", name: "Test", createdAt: new Date("2025-01-01") },
          ],
        }) // insert workspace
        .mockResolvedValueOnce({}) // insert user_workspace
        .mockResolvedValueOnce({}); // COMMIT

      const workspace = await createWorkspace({ name: "Test" }, "user-1");

      expect(workspace.id).toBe("ws-1");
      expect(workspace.users).toEqual([
        { email: "user-1@example.local", role: "admin" },
      ]);
      expect(mocks.queryMock).toHaveBeenCalled();
    });
  });

  describe("listWorkspacesForUser", () => {
    it("lists workspaces for a user with users", async () => {
      mocks.poolQueryMock
        .mockResolvedValueOnce({
          rows: [
            {
              id: "ws-1",
              name: "A",
              createdAt: new Date("2025-01-01"),
              ownerId: "user-1",
            },
          ],
        })
        .mockResolvedValueOnce({
          rows: [
            { email: "user1@example.com", role: "admin" },
            { email: "user2@example.com", role: "editor" },
          ],
        }); // users query

      const result = await listWorkspacesForUser("user-1");

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("ws-1");
      expect(result[0].users).toEqual([
        { email: "user1@example.com", role: "admin" },
        { email: "user2@example.com", role: "editor" },
      ]);
    });

    it("returns empty users array when no users exist", async () => {
      mocks.poolQueryMock
        .mockResolvedValueOnce({
          rows: [
            {
              id: "ws-1",
              name: "A",
              createdAt: new Date("2025-01-01"),
              ownerId: "user-1",
            },
          ],
        })
        .mockResolvedValueOnce({ rows: [] }); // users query

      const result = await listWorkspacesForUser("user-1");

      expect(result).toHaveLength(1);
      expect(result[0].users).toEqual([]);
    });
  });

  describe("getWorkspaceById", () => {
    it("returns workspace with users", async () => {
      mocks.poolQueryMock
        .mockResolvedValueOnce({
          rows: [
            {
              id: "ws-1",
              name: "Test",
              createdAt: new Date("2025-01-01"),
              ownerId: "user-1",
            },
          ],
        })
        .mockResolvedValueOnce({
          rows: [{ email: "user1@example.com", role: "admin" }],
        }); // users query

      const result = await getWorkspaceById("ws-1");

      expect(result).toBeDefined();
      expect(result?.id).toBe("ws-1");
      expect(result?.users).toEqual([
        { email: "user1@example.com", role: "admin" },
      ]);
    });

    it("returns undefined when workspace is missing", async () => {
      mocks.poolQueryMock.mockResolvedValueOnce({ rows: [] });

      const result = await getWorkspaceById("ws-missing");

      expect(result).toBeUndefined();
    });
  });

  describe("getUserIdByEmail", () => {
    it("returns user id when found", async () => {
      mocks.poolQueryMock.mockResolvedValueOnce({
        rows: [{ id: "user-123" }],
      });

      const result = await getUserIdByEmail("test@example.com");

      expect(result).toBe("user-123");
    });

    it("returns null when user not found", async () => {
      mocks.poolQueryMock.mockResolvedValueOnce({ rows: [] });

      const result = await getUserIdByEmail("notfound@example.com");

      expect(result).toBeNull();
    });
  });

  describe("getWorkspaceUsers", () => {
    it("returns all users in workspace", async () => {
      mocks.poolQueryMock.mockResolvedValueOnce({
        rows: [
          { email: "admin@example.com", role: "admin" },
          { email: "editor@example.com", role: "editor" },
          { email: "viewer@example.com", role: "viewer" },
        ],
      });

      const result = await getWorkspaceUsers("ws-1");

      expect(result).toHaveLength(3);
      expect(result).toContainEqual({
        email: "admin@example.com",
        role: "admin",
      });
    });

    it("returns empty array when no users", async () => {
      mocks.poolQueryMock.mockResolvedValueOnce({ rows: [] });

      const result = await getWorkspaceUsers("ws-empty");

      expect(result).toEqual([]);
    });
  });

  describe("addUserToWorkspace", () => {
    it("adds user to workspace", async () => {
      mocks.poolQueryMock.mockResolvedValueOnce({ rows: [{ role: "admin" }] }); // isUserAdmin check
      mocks.queryMock
        .mockResolvedValueOnce({}) // BEGIN
        .mockResolvedValueOnce({
          rows: [{ id: "user-2", email: "newuser@example.com" }],
        }) // user lookup
        .mockResolvedValueOnce({ rows: [] }) // existing member check
        .mockResolvedValueOnce({}) // insert
        .mockResolvedValueOnce({}); // COMMIT

      const result = await addUserToWorkspace(
        "ws-1",
        "user-1",
        "newuser@example.com",
        "editor",
      );

      expect(result).toEqual({ email: "newuser@example.com", role: "editor" });
    });

    it("throws when user is already a member", async () => {
      mocks.poolQueryMock.mockResolvedValueOnce({ rows: [{ role: "admin" }] }); // isUserAdmin check
      mocks.queryMock
        .mockResolvedValueOnce({}) // BEGIN
        .mockResolvedValueOnce({
          rows: [{ id: "user-2", email: "existing@example.com" }],
        }) // user lookup
        .mockResolvedValueOnce({ rows: [{ id: "uw-1" }] }) // existing member check
        .mockResolvedValueOnce({}); // ROLLBACK

      await expect(
        addUserToWorkspace("ws-1", "user-1", "existing@example.com", "editor"),
      ).rejects.toThrow("User is already a member of this workspace");
    });

    it("throws when user is not an admin", async () => {
      mocks.poolQueryMock.mockResolvedValueOnce({ rows: [{ role: "editor" }] }); // isUserAdmin check
      mocks.queryMock
        .mockResolvedValueOnce({}) // BEGIN
        .mockResolvedValueOnce({}); // ROLLBACK

      await expect(
        addUserToWorkspace("ws-1", "user-1", "newuser@example.com", "editor"),
      ).rejects.toThrow("Only admins can add users to this workspace");
    });
  });

  describe("removeUserFromWorkspace", () => {
    it("removes user from workspace", async () => {
      mocks.poolQueryMock.mockResolvedValueOnce({ rows: [{ role: "admin" }] }); // isUserAdmin check
      mocks.queryMock
        .mockResolvedValueOnce({}) // BEGIN
        .mockResolvedValueOnce({ rows: [{ id: "user-2" }] }) // user lookup
        .mockResolvedValueOnce({ rows: [{ role: "editor" }] }) // member check
        .mockResolvedValueOnce({}) // delete
        .mockResolvedValueOnce({}); // COMMIT

      await removeUserFromWorkspace("ws-1", "user-1", "user2@example.com");

      expect(mocks.queryMock).toHaveBeenCalledWith(
        'DELETE FROM "UserWorkspace" WHERE "userId" = $1 AND "workspaceId" = $2',
        ["user-2", "ws-1"],
      );
    });

    it("throws when removing last admin", async () => {
      mocks.poolQueryMock.mockResolvedValueOnce({ rows: [{ role: "admin" }] }); // isUserAdmin check
      mocks.queryMock
        .mockResolvedValueOnce({}) // BEGIN
        .mockResolvedValueOnce({ rows: [{ id: "user-2" }] }) // user lookup
        .mockResolvedValueOnce({ rows: [{ role: "admin" }] }) // member check
        .mockResolvedValueOnce({ rows: [{ count: "1" }] }) // admin count check
        .mockResolvedValueOnce({}); // ROLLBACK

      await expect(
        removeUserFromWorkspace("ws-1", "user-1", "admin@example.com"),
      ).rejects.toThrow("Cannot remove the last admin from the workspace");
    });
  });

  describe("updateUserRole", () => {
    it("updates user role", async () => {
      mocks.poolQueryMock.mockResolvedValueOnce({ rows: [{ role: "admin" }] }); // isUserAdmin check
      mocks.queryMock
        .mockResolvedValueOnce({}) // BEGIN
        .mockResolvedValueOnce({
          rows: [{ id: "user-2", email: "user@example.com" }],
        }) // user lookup
        .mockResolvedValueOnce({ rows: [{ role: "editor" }] }) // member check
        .mockResolvedValueOnce({}) // update
        .mockResolvedValueOnce({}); // COMMIT

      const result = await updateUserRole(
        "ws-1",
        "user-1",
        "user@example.com",
        "viewer",
      );

      expect(result).toEqual({ email: "user@example.com", role: "viewer" });
    });

    it("throws when demoting last admin", async () => {
      mocks.poolQueryMock.mockResolvedValueOnce({ rows: [{ role: "admin" }] }); // isUserAdmin check
      mocks.queryMock
        .mockResolvedValueOnce({}) // BEGIN
        .mockResolvedValueOnce({
          rows: [{ id: "user-2", email: "admin@example.com" }],
        }) // user lookup
        .mockResolvedValueOnce({ rows: [{ role: "admin" }] }) // member check
        .mockResolvedValueOnce({ rows: [{ count: "1" }] }) // admin count check
        .mockResolvedValueOnce({}); // ROLLBACK

      await expect(
        updateUserRole("ws-1", "user-1", "admin@example.com", "editor"),
      ).rejects.toThrow("Cannot demote the last admin");
    });
  });
});
