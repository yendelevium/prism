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

import {
  createWorkspace,
  getWorkspaceById,
  listWorkspacesForUser,
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
  it("creates a workspace for an existing user", async () => {
    mocks.queryMock
      .mockResolvedValueOnce({}) // BEGIN
      .mockResolvedValueOnce({ rows: [{ id: "user-1" }] }) // user check
      .mockResolvedValueOnce({
        rows: [{ id: "ws-1", name: "Test", createdAt: new Date("2025-01-01") }],
      }) // insert workspace
      .mockResolvedValueOnce({}) // insert user_workspace
      .mockResolvedValueOnce({}); // COMMIT

    const workspace = await createWorkspace({ name: "Test" }, "user-1");

    expect(workspace.id).toBe("ws-1");
    expect(workspace.ownerId).toBe("user-1");
    expect(mocks.queryMock).toHaveBeenCalled();
  });

  it("creates a user when missing", async () => {
    mocks.queryMock
      .mockResolvedValueOnce({}) // BEGIN
      .mockResolvedValueOnce({ rows: [] }) // user check
      .mockResolvedValueOnce({}) // insert user
      .mockResolvedValueOnce({
        rows: [{ id: "ws-1", name: "Test", createdAt: new Date("2025-01-01") }],
      }) // insert workspace
      .mockResolvedValueOnce({}) // insert user_workspace
      .mockResolvedValueOnce({}); // COMMIT

    const workspace = await createWorkspace({ name: "Test" }, "user-1");

    expect(workspace.id).toBe("ws-1");
    expect(mocks.queryMock).toHaveBeenCalled();
  });

  it("lists workspaces for a user", async () => {
    mocks.poolQueryMock.mockResolvedValueOnce({
      rows: [
        {
          id: "ws-1",
          name: "A",
          createdAt: new Date("2025-01-01"),
          ownerId: "user-1",
        },
      ],
    });

    const result = await listWorkspacesForUser("user-1");

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("ws-1");
  });

  it("returns undefined when workspace is missing", async () => {
    mocks.poolQueryMock.mockResolvedValueOnce({ rows: [] });

    const result = await getWorkspaceById("ws-missing");

    expect(result).toBeUndefined();
  });
});
