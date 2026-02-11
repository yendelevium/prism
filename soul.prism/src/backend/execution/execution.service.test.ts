// Unit tests for execution.service: Prisma mocked, no real DB.
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  executionFindMany: vi.fn(),
  executionFindUnique: vi.fn(),
}));

vi.mock("@prisma/adapter-pg", () => {
  class PrismaPg {
    constructor() {}
  }
  return { PrismaPg };
});

vi.mock("@prisma/client", () => {
  class PrismaClient {
    execution = {
      findMany: mocks.executionFindMany,
      findUnique: mocks.executionFindUnique,
    };
    constructor() {}
  }
  return { PrismaClient };
});

import { getExecutionById, listExecutionsByRequestId } from "./execution.service";

beforeEach(() => {
  vi.resetAllMocks();
  process.env.DATABASE_URL = "postgresql://user:pass@localhost:5432/test";
  // @ts-expect-error test shim
  delete globalThis.__prismPrismaClient;
});

describe("execution.service", () => {
  it("lists executions by request id", async () => {
    mocks.executionFindMany.mockResolvedValue([{ id: "ex-1" }]);

    const result = await listExecutionsByRequestId("req-1");

    expect(mocks.executionFindMany).toHaveBeenCalledWith({
      where: { requestId: "req-1" },
      orderBy: { executedAt: "desc" },
    });
    expect(result).toHaveLength(1);
  });

  it("returns empty list when no executions exist", async () => {
    mocks.executionFindMany.mockResolvedValue([]);

    const result = await listExecutionsByRequestId("req-1");

    expect(result).toEqual([]);
  });

  it("returns null when execution is not found", async () => {
    mocks.executionFindUnique.mockResolvedValue(null);

    const result = await getExecutionById("missing");

    expect(result).toBeNull();
  });
});
