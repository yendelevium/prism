import { beforeEach, describe, expect, it, vi } from "vitest";

// Hoisted mocks for the pg pool and auth utils
const mocks = vi.hoisted(() => {
  return {
    requireUserMock: vi.fn(),
    listSpansByTraceIdMock: vi.fn(),
    getSpanByIdMock: vi.fn(),
  };
});

vi.mock("@/backend/auth/auth.utils", () => ({
  requireUser: mocks.requireUserMock,
}));

vi.mock("@/backend/span/span.service", () => ({
  listSpansByTraceId: mocks.listSpansByTraceIdMock,
  getSpanById: mocks.getSpanByIdMock,
}));

import { listSpansByTraceIdAction, getSpanByIdAction } from "./span.actions";

beforeEach(() => {
  vi.resetAllMocks();
});

describe("span.actions", () => {
  it("rejects list when traceId is empty", async () => {
    const result = await listSpansByTraceIdAction("");

    expect(result.success).toBe(false);
    expect(mocks.listSpansByTraceIdMock).not.toHaveBeenCalled();
  });

  it("lists spans for authenticated user", async () => {
    mocks.requireUserMock.mockResolvedValue({ id: "user-1" });
    mocks.listSpansByTraceIdMock.mockResolvedValue([{ id: "span-1" }]);

    const result = await listSpansByTraceIdAction("trace-1");

    expect(mocks.requireUserMock).toHaveBeenCalled();
    expect(mocks.listSpansByTraceIdMock).toHaveBeenCalledWith("trace-1");
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual([{ id: "span-1" }]);
    }
  });

  it("returns error when service throws in list", async () => {
    mocks.requireUserMock.mockResolvedValue({ id: "user-1" });
    mocks.listSpansByTraceIdMock.mockRejectedValue(new Error("db error"));

    const result = await listSpansByTraceIdAction("trace-1");

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("db error");
    }
  });

  it("rejects get when spanId is empty", async () => {
    const result = await getSpanByIdAction("");

    expect(result.success).toBe(false);
    expect(mocks.getSpanByIdMock).not.toHaveBeenCalled();
  });

  it("returns span when found", async () => {
    mocks.requireUserMock.mockResolvedValue({ id: "user-1" });
    mocks.getSpanByIdMock.mockResolvedValue({
      id: "span-1",
    });

    const result = await getSpanByIdAction("span-1");

    expect(mocks.requireUserMock).toHaveBeenCalled();
    expect(mocks.getSpanByIdMock).toHaveBeenCalledWith("span-1");
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({ id: "span-1" });
    }
  });

  it("returns null when span not found", async () => {
    mocks.requireUserMock.mockResolvedValue({ id: "user-1" });
    mocks.getSpanByIdMock.mockResolvedValue(undefined);

    const result = await getSpanByIdAction("missing");

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBeNull();
    }
  });

  it("returns error when service throws in get", async () => {
    mocks.requireUserMock.mockResolvedValue({ id: "user-1" });
    mocks.getSpanByIdMock.mockRejectedValue(new Error("db failure"));

    const result = await getSpanByIdAction("span-1");

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("db failure");
    }
  });
});
