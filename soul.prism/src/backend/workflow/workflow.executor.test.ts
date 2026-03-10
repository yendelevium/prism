import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getCollectionByIdMock: vi.fn(),
  getRequestByIdMock: vi.fn(),
  createWorkflowRunStepMock: vi.fn(),
  getWorkflowByIdMock: vi.fn(),
  getWorkflowStepsMock: vi.fn(),
  updateWorkflowRunStatusMock: vi.fn(),
  updateWorkflowRunStepMock: vi.fn(),
  fetchMock: vi.fn(),
}));

vi.mock("@/backend/collection/collection.service", () => ({
  getCollectionById: mocks.getCollectionByIdMock,
}));

vi.mock("@/backend/request/request.service", () => ({
  getRequestById: mocks.getRequestByIdMock,
}));

vi.mock("./workflow.service", () => ({
  createWorkflowRunStep: mocks.createWorkflowRunStepMock,
  getWorkflowById: mocks.getWorkflowByIdMock,
  getWorkflowSteps: mocks.getWorkflowStepsMock,
  updateWorkflowRunStatus: mocks.updateWorkflowRunStatusMock,
  updateWorkflowRunStep: mocks.updateWorkflowRunStepMock,
}));

import { executeWorkflow } from "./workflow.executor";

beforeEach(() => {
  vi.resetAllMocks();
  vi.stubGlobal("fetch", mocks.fetchMock);
});

describe("workflow.executor", () => {
  it("executes workflow steps sequentially and marks the run successful", async () => {
    mocks.getWorkflowByIdMock.mockResolvedValue({
      id: "wf-1",
      workspaceId: "ws-1",
      steps: [],
    });
    mocks.getWorkflowStepsMock.mockResolvedValue([
      {
        id: "step-1",
        requestId: "req-1",
        retryCount: 0,
      },
      {
        id: "step-2",
        requestId: "req-2",
        retryCount: 0,
      },
    ]);
    mocks.createWorkflowRunStepMock
      .mockResolvedValueOnce({ id: "run-step-1" })
      .mockResolvedValueOnce({ id: "run-step-2" });
    mocks.getRequestByIdMock
      .mockResolvedValueOnce({
        id: "req-1",
        method: "GET",
        url: "https://api.example.com/one",
        headers: { Authorization: "Bearer a" },
        body: null,
        collectionId: "col-1",
      })
      .mockResolvedValueOnce({
        id: "req-2",
        method: "POST",
        url: "https://api.example.com/two",
        headers: null,
        body: '{"ok":true}',
        collectionId: "col-2",
      });
    mocks.getCollectionByIdMock
      .mockResolvedValueOnce({ id: "col-1", workspaceId: "ws-1" })
      .mockResolvedValueOnce({ id: "col-2", workspaceId: "ws-1" });
    mocks.fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          execution_id: "exec-1",
          status: 200,
          request_duration: "15ms",
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          execution_id: "exec-2",
          status: 201,
          request_duration: "22ms",
        }),
      });

    const result = await executeWorkflow("wf-1", "run-1", {
      interceptBaseUrl: "https://prism.local",
      triggeredBy: "user-1",
      workflowWorkspaceId: "ws-1",
    });

    expect(mocks.fetchMock).toHaveBeenNthCalledWith(
      1,
      "https://prism.local/api/intercept",
      expect.objectContaining({
        method: "POST",
      }),
    );
    expect(mocks.fetchMock).toHaveBeenCalledTimes(2);
    expect(mocks.updateWorkflowRunStepMock).toHaveBeenNthCalledWith(
      1,
      "run-step-1",
      "SUCCESS",
      "exec-1",
      15,
    );
    expect(mocks.updateWorkflowRunStepMock).toHaveBeenNthCalledWith(
      2,
      "run-step-2",
      "SUCCESS",
      "exec-2",
      22,
    );
    expect(mocks.updateWorkflowRunStatusMock).toHaveBeenCalledWith(
      "run-1",
      "SUCCESS",
    );
    expect(result).toEqual({
      workflowRunId: "run-1",
      steps: [
        {
          stepId: "step-1",
          executionId: "exec-1",
          status: "SUCCESS",
          durationMs: 15,
        },
        {
          stepId: "step-2",
          executionId: "exec-2",
          status: "SUCCESS",
          durationMs: 22,
        },
      ],
    });
  });

  it("retries a failing step and marks the run failed after retries are exhausted", async () => {
    mocks.getWorkflowByIdMock.mockResolvedValue({
      id: "wf-1",
      workspaceId: "ws-1",
      steps: [],
    });
    mocks.getWorkflowStepsMock.mockResolvedValue([
      {
        id: "step-1",
        requestId: "req-1",
        retryCount: 1,
      },
    ]);
    mocks.createWorkflowRunStepMock.mockResolvedValue({ id: "run-step-1" });
    mocks.getRequestByIdMock.mockResolvedValue({
      id: "req-1",
      method: "GET",
      url: "https://api.example.com/one",
      headers: null,
      body: null,
      collectionId: "col-1",
    });
    mocks.getCollectionByIdMock.mockResolvedValue({
      id: "col-1",
      workspaceId: "ws-1",
    });
    mocks.fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          execution_id: "exec-1",
          status: 500,
          request_duration: "9ms",
          error_msg: "upstream failure",
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          execution_id: "exec-2",
          status: 502,
          request_duration: "11ms",
          error_msg: "upstream failure",
        }),
      });

    const result = await executeWorkflow("wf-1", "run-1", {
      interceptBaseUrl: "https://prism.local",
      triggeredBy: "user-1",
      workflowWorkspaceId: "ws-1",
    });

    expect(mocks.fetchMock).toHaveBeenCalledTimes(2);
    expect(mocks.updateWorkflowRunStepMock).toHaveBeenCalledWith(
      "run-step-1",
      "FAILED",
      "exec-2",
      11,
    );
    expect(mocks.updateWorkflowRunStatusMock).toHaveBeenCalledWith(
      "run-1",
      "FAILED",
    );
    expect(result).toEqual({
      workflowRunId: "run-1",
      steps: [
        {
          stepId: "step-1",
          executionId: "exec-2",
          status: "FAILED",
          durationMs: 11,
        },
      ],
    });
  });
});
