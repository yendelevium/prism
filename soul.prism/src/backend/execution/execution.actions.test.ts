// Unit tests for execution.actions: auth + service calls mocked.
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/backend/auth/auth.utils", () => ({
  requireWorkspaceAccess: vi.fn(),
}));

vi.mock("@/backend/request/request.service", () => ({
  getRequestById: vi.fn(),
}));

vi.mock("@/backend/collection/collection.service", () => ({
  getCollectionById: vi.fn(),
}));

vi.mock("@/backend/execution/execution.service", () => ({
  listExecutionsByRequestId: vi.fn(),
  getExecutionById: vi.fn(),
}));

import {
  listExecutionsByRequestIdAction,
  getExecutionByIdAction,
} from "./execution.actions";
import { requireWorkspaceAccess } from "@/backend/auth/auth.utils";
import { getRequestById } from "@/backend/request/request.service";
import { getCollectionById } from "@/backend/collection/collection.service";
import {
  listExecutionsByRequestId,
  getExecutionById,
} from "@/backend/execution/execution.service";

beforeEach(() => {
  vi.resetAllMocks();
});

describe("execution.actions", () => {
  it("rejects list when requestId is missing", async () => {
    const result = await listExecutionsByRequestIdAction("");
    expect(result.success).toBe(false);
    expect(listExecutionsByRequestId).not.toHaveBeenCalled();
  });

  it("enforces workspace access when listing executions", async () => {
    (getRequestById as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "req-1",
      collectionId: "col-1",
    });
    (getCollectionById as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "col-1",
      workspaceId: "ws-1",
    });
    (requireWorkspaceAccess as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "user-1",
    });
    (listExecutionsByRequestId as ReturnType<typeof vi.fn>).mockResolvedValue(
      [],
    );

    const result = await listExecutionsByRequestIdAction("req-1");

    expect(requireWorkspaceAccess).toHaveBeenCalledWith("ws-1");
    expect(listExecutionsByRequestId).toHaveBeenCalledWith("req-1");
    expect(result.success).toBe(true);
  });

  it("returns error when request is missing for list", async () => {
    (getRequestById as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    const result = await listExecutionsByRequestIdAction("missing");

    expect(result.success).toBe(false);
    expect(listExecutionsByRequestId).not.toHaveBeenCalled();
  });

  it("enforces workspace access when fetching by id", async () => {
    (getExecutionById as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "ex-1",
      requestId: "req-1",
    });
    (getRequestById as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "req-1",
      collectionId: "col-1",
    });
    (getCollectionById as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "col-1",
      workspaceId: "ws-1",
    });
    (requireWorkspaceAccess as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "user-1",
    });

    const result = await getExecutionByIdAction("ex-1");

    expect(requireWorkspaceAccess).toHaveBeenCalledWith("ws-1");
    expect(result.success).toBe(true);
  });

  it("returns error when execution is missing for get", async () => {
    (getExecutionById as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    const result = await getExecutionByIdAction("missing");

    expect(result.success).toBe(true);
    expect(result.data).toBeNull();
  });
});
