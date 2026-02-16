import { beforeEach, describe, expect, it, vi } from "vitest";

// Hoisted mocks for the pg pool
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

import { listSpansByTraceId, getSpanById } from "./span.service";

beforeEach(() => {
  vi.resetAllMocks();
  process.env.DATABASE_URL = "postgresql://user:pass@localhost:5432/test";
  mocks.connectMock.mockReturnValue({
    query: mocks.queryMock,
    release: mocks.releaseMock,
  });
});

describe("span.service", () => {
  it("lists spans by traceId and maps to correct structure", async () => {
    const now = new Date();

    mocks.poolQueryMock.mockResolvedValueOnce({
      rows: [
        {
          id: "1",
          traceId: "trace-1",
          spanId: "span-1",
          parentSpanId: null,
          operation: "op",
          serviceName: "svc",
          startTime: "1000",
          duration: "200",
          status: "ok",
          tags: { a: 1 },
          createdAt: now,
        },
      ],
    });

    const result = await listSpansByTraceId("trace-1");

    expect(result).toEqual([
      {
        id: "1",
        traceId: "trace-1",
        spanId: "span-1",
        parentSpanId: null,
        operation: "op",
        serviceName: "svc",
        startTime: BigInt(1000),
        duration: BigInt(200),
        status: "ok",
        tags: { a: 1 },
        createdAt: new Date(now),
      },
    ]);
    expect(mocks.poolQueryMock).toHaveBeenCalledWith(expect.any(String), [
      "trace-1",
    ]);
  });

  it("returns undefined when span is not found", async () => {
    mocks.poolQueryMock.mockResolvedValueOnce({ rows: [] });

    const result = await getSpanById("missing");

    expect(result).toBeUndefined();
  });

  it("correctly maps the span when found", async () => {
    const now = new Date();

    mocks.poolQueryMock.mockResolvedValueOnce({
      rows: [
        {
          id: "1",
          traceId: "trace-1",
          spanId: "span-1",
          parentSpanId: null,
          operation: "op",
          serviceName: "svc",
          startTime: "500",
          duration: "50",
          status: null,
          tags: null,
          createdAt: now,
        },
      ],
    });

    const result = await getSpanById("1");

    expect(result).toEqual({
      id: "1",
      traceId: "trace-1",
      spanId: "span-1",
      parentSpanId: null,
      operation: "op",
      serviceName: "svc",
      startTime: BigInt(500),
      duration: BigInt(50),
      status: null,
      tags: null,
      createdAt: new Date(now),
    });
  });
});
