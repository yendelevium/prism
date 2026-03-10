import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireUserMock: vi.fn(),
  requireWorkspaceAccessMock: vi.fn(),
  createWorkflowMock: vi.fn(),
  listWorkflowsMock: vi.fn(),
  getWorkflowByIdMock: vi.fn(),
  createWorkflowRunMock: vi.fn(),
  executeWorkflowMock: vi.fn(),
  headersMock: vi.fn(),
}));

vi.mock("@/backend/auth/auth.utils", () => ({
  requireUser: mocks.requireUserMock,
  requireWorkspaceAccess: mocks.requireWorkspaceAccessMock,
}));

vi.mock("./workflow.service", () => ({
  createWorkflow: mocks.createWorkflowMock,
  listWorkflows: mocks.listWorkflowsMock,
  getWorkflowById: mocks.getWorkflowByIdMock,
  createWorkflowRun: mocks.createWorkflowRunMock,
}));

vi.mock("./workflow.executor", () => ({
  executeWorkflow: mocks.executeWorkflowMock,
}));

vi.mock("next/headers", () => ({
  headers: mocks.headersMock,
}));

import {
  createWorkflowAction,
  getWorkflowAction,
  listWorkflowsAction,
  runWorkflowAction,
} from "./workflow.actions";

beforeEach(() => {
  vi.resetAllMocks();
  delete process.env.NEXT_PUBLIC_APP_URL;
  delete process.env.APP_URL;
  delete process.env.NEXTAUTH_URL;
  delete process.env.VERCEL_URL;
});

describe("workflow.actions", () => {
  it("creates a workflow for an authorized user", async () => {
    mocks.requireUserMock.mockResolvedValue({ id: "user-1" });
    mocks.requireWorkspaceAccessMock.mockResolvedValue({ id: "user-1" });
    mocks.createWorkflowMock.mockResolvedValue({ id: "wf-1" });

    const result = await createWorkflowAction("ws-1", "Deploy flow", "desc");

    expect(mocks.requireUserMock).toHaveBeenCalled();
    expect(mocks.requireWorkspaceAccessMock).toHaveBeenCalledWith("ws-1");
    expect(mocks.createWorkflowMock).toHaveBeenCalledWith(
      "ws-1",
      "Deploy flow",
      "desc",
      "user-1",
    );
    expect(result.success).toBe(true);
  });

  it("lists workflows after workspace access is verified", async () => {
    mocks.requireUserMock.mockResolvedValue({ id: "user-1" });
    mocks.requireWorkspaceAccessMock.mockResolvedValue({ id: "user-1" });
    mocks.listWorkflowsMock.mockResolvedValue([{ id: "wf-1" }]);

    const result = await listWorkflowsAction("ws-1");

    expect(mocks.requireWorkspaceAccessMock).toHaveBeenCalledWith("ws-1");
    expect(mocks.listWorkflowsMock).toHaveBeenCalledWith("ws-1");
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual([{ id: "wf-1" }]);
    }
  });

  it("returns forbidden when workflow does not belong to the requested workspace", async () => {
    mocks.requireUserMock.mockResolvedValue({ id: "user-1" });
    mocks.requireWorkspaceAccessMock.mockResolvedValue({ id: "user-1" });
    mocks.getWorkflowByIdMock.mockResolvedValue({
      id: "wf-1",
      workspaceId: "ws-2",
      steps: [],
    });

    const result = await getWorkflowAction("wf-1", "ws-1");

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("Forbidden");
    }
  });

  it("creates a workflow run and executes the workflow using the request origin", async () => {
    mocks.requireUserMock.mockResolvedValue({ id: "user-1" });
    mocks.requireWorkspaceAccessMock.mockResolvedValue({ id: "user-1" });
    mocks.getWorkflowByIdMock.mockResolvedValue({
      id: "wf-1",
      workspaceId: "ws-1",
      steps: [],
    });
    mocks.createWorkflowRunMock.mockResolvedValue({ id: "run-1" });
    mocks.executeWorkflowMock.mockResolvedValue({
      workflowRunId: "run-1",
      steps: [],
    });
    mocks.headersMock.mockResolvedValue({
      get: vi.fn((name: string) => {
        if (name === "x-forwarded-host") return "prism.local";
        if (name === "x-forwarded-proto") return "https";
        return null;
      }),
    });

    const result = await runWorkflowAction("wf-1", "ws-1");

    expect(mocks.createWorkflowRunMock).toHaveBeenCalledWith("wf-1", "user-1");
    expect(mocks.executeWorkflowMock).toHaveBeenCalledWith("wf-1", "run-1", {
      interceptBaseUrl: "https://prism.local",
      triggeredBy: "user-1",
      workflowWorkspaceId: "ws-1",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({ workflowRunId: "run-1", steps: [] });
    }
  });
});
