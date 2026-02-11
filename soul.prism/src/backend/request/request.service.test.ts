// Unit tests for request.service: Prisma mocked, no real DB.
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requestCreate: vi.fn(),
  requestFindMany: vi.fn(),
  requestFindUnique: vi.fn(),
  collectionFindUnique: vi.fn(),
  userFindUnique: vi.fn(),
}));

vi.mock("@prisma/adapter-pg", () => {
  class PrismaPg {
    constructor() {}
  }
  return { PrismaPg };
});

vi.mock("@prisma/client", () => {
  class PrismaClient {
    request = {
      create: mocks.requestCreate,
      findMany: mocks.requestFindMany,
      findUnique: mocks.requestFindUnique,
    };
    collection = {
      findUnique: mocks.collectionFindUnique,
    };
    user = {
      findUnique: mocks.userFindUnique,
    };
    constructor() {}
  }
  return { PrismaClient };
});

import {
  createRequest,
  getRequestById,
  getRequestsByCollection,
} from "./request.service";

beforeEach(() => {
  vi.resetAllMocks();
  process.env.DATABASE_URL = "postgresql://user:pass@localhost:5432/test";
  // reset cached prisma client between tests
  // @ts-expect-error test shim
  delete globalThis.__prismPrismaClient;
});

describe("request.service", () => {
  it("creates a request (happy path)", async () => {
    mocks.collectionFindUnique.mockResolvedValue({ id: "col-1" });
    mocks.userFindUnique.mockResolvedValue({ id: "user-1" });
    mocks.requestCreate.mockResolvedValue({ id: "req-1" });

    const result = await createRequest({
      name: " Get Users ",
      method: "GET",
      url: " https://api.example.com/users ",
      headers: { " X-Token ": "abc" },
      body: null,
      collectionId: "col-1",
      createdById: "user-1",
    });

    expect(mocks.requestCreate).toHaveBeenCalledWith({
      data: {
        name: "Get Users",
        method: "GET",
        url: "https://api.example.com/users",
        headers: { "X-Token": "abc" },
        body: null,
        collectionId: "col-1",
        createdById: "user-1",
      },
    });
    expect(result.id).toBe("req-1");
  });

  it("throws when collection is missing", async () => {
    mocks.collectionFindUnique.mockResolvedValue(null);

    await expect(
      createRequest({
        name: "Test",
        method: "GET",
        url: "https://api.example.com",
        headers: null,
        body: null,
        collectionId: "missing",
        createdById: "user-1",
      }),
    ).rejects.toThrow("Collection not found");
  });

  it("throws when user is missing", async () => {
    mocks.collectionFindUnique.mockResolvedValue({ id: "col-1" });
    mocks.userFindUnique.mockResolvedValue(null);

    await expect(
      createRequest({
        name: "Test",
        method: "GET",
        url: "https://api.example.com",
        headers: null,
        body: null,
        collectionId: "col-1",
        createdById: "missing",
      }),
    ).rejects.toThrow("User not found");
  });

  it("lists requests for a collection", async () => {
    mocks.requestFindMany.mockResolvedValue([{ id: "req-1" }]);

    const result = await getRequestsByCollection("col-1");

    expect(mocks.requestFindMany).toHaveBeenCalledWith({
      where: { collectionId: "col-1" },
      orderBy: { createdAt: "desc" },
    });
    expect(result).toHaveLength(1);
  });

  it("returns null when request is not found", async () => {
    mocks.requestFindUnique.mockResolvedValue(null);

    const result = await getRequestById("missing");

    expect(result).toBeNull();
  });
});
