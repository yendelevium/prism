// Unit tests for collection.service: Prisma mocked, no real DB.
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  collectionCreate: vi.fn(),
  collectionFindMany: vi.fn(),
  collectionFindUnique: vi.fn(),
  collectionDelete: vi.fn(),
  workspaceFindUnique: vi.fn(),
  userUpsert: vi.fn(),
}));

vi.mock("@prisma/adapter-pg", () => {
  class PrismaPg {
    constructor() {}
  }
  return { PrismaPg };
});

vi.mock("@prisma/client", () => {
  class PrismaClient {
    collection = {
      create: mocks.collectionCreate,
      findMany: mocks.collectionFindMany,
      findUnique: mocks.collectionFindUnique,
      delete: mocks.collectionDelete,
    };
    workspace = {
      findUnique: mocks.workspaceFindUnique,
    };
    user = {
      upsert: mocks.userUpsert,
    };
    constructor() {}
  }
  return { PrismaClient };
});

import {
  createCollection,
  getCollectionById,
  listCollectionsByWorkspace,
  deleteCollection,
} from "./collection.service";

beforeEach(() => {
  vi.resetAllMocks();
  process.env.DATABASE_URL = "postgresql://user:pass@localhost:5432/test";
  // @ts-expect-error test shim
  delete globalThis.__prismPrismaClient;
});

describe("collection.service", () => {
  it("creates a collection (happy path)", async () => {
    mocks.workspaceFindUnique.mockResolvedValue({ id: "ws-1" });
    mocks.userUpsert.mockResolvedValue({ id: "user-1" });
    mocks.collectionCreate.mockResolvedValue({ id: "col-1" });

    const result = await createCollection(
      { name: "My Collection", workspaceId: "ws-1" },
      "user-1",
    );

    expect(mocks.collectionCreate).toHaveBeenCalledWith({
      data: {
        name: "My Collection",
        workspaceId: "ws-1",
        createdById: "user-1",
      },
    });
    expect(result.id).toBe("col-1");
  });

  it("throws when workspace is missing", async () => {
    mocks.workspaceFindUnique.mockResolvedValue(null);

    await expect(
      createCollection({ name: "Test", workspaceId: "missing" }, "user-1"),
    ).rejects.toThrow("Workspace not found");
  });

  it("lists collections for a workspace", async () => {
    mocks.collectionFindMany.mockResolvedValue([{ id: "col-1" }]);

    const result = await listCollectionsByWorkspace("ws-1");

    expect(mocks.collectionFindMany).toHaveBeenCalledWith({
      where: { workspaceId: "ws-1" },
      orderBy: { createdAt: "desc" },
    });
    expect(result).toHaveLength(1);
  });

  it("returns null when collection is not found", async () => {
    mocks.collectionFindUnique.mockResolvedValue(null);

    const result = await getCollectionById("missing");

    expect(result).toBeNull();
  });

  it("deletes a collection", async () => {
    mocks.collectionDelete.mockResolvedValue({ id: "col-1" });

    const result = await deleteCollection("col-1");

    expect(mocks.collectionDelete).toHaveBeenCalledWith({
      where: { id: "col-1" },
    });
    expect(result.id).toBe("col-1");
  });
});
