import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getCollectionByIdMock: vi.fn(),
  getRequestByIdMock: vi.fn(),
  getGraphQLRequestByIdMock: vi.fn(),
  getGRPCRequestByIdMock: vi.fn(),
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

vi.mock("@/backend/graphql-request/graphql-request.service", () => ({
  getGraphQLRequestById: mocks.getGraphQLRequestByIdMock,
}));

vi.mock("@/backend/grpc-request/grpc-request.service", () => ({
  getGRPCRequestById: mocks.getGRPCRequestByIdMock,
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
        protocol: "REST",
        retryCount: 0,
      },
      {
        id: "step-2",
        requestId: "gql-1",
        protocol: "GRAPHQL",
        retryCount: 0,
      },
      {
        id: "step-3",
        requestId: "grpc-1",
        protocol: "GRPC",
        retryCount: 0,
      },
    ]);
    mocks.createWorkflowRunStepMock
      .mockResolvedValueOnce({ id: "run-step-1" })
      .mockResolvedValueOnce({ id: "run-step-2" })
      .mockResolvedValueOnce({ id: "run-step-3" });
    mocks.getRequestByIdMock.mockResolvedValueOnce({
      id: "req-1",
      method: "GET",
      url: "https://api.example.com/one",
      headers: { Authorization: "Bearer a" },
      body: null,
      collectionId: "col-1",
    });
    mocks.getGraphQLRequestByIdMock.mockResolvedValueOnce({
      id: "gql-1",
      url: "https://api.example.com/graphql",
      query: "{ viewer { id } }",
      variables: null,
      operationName: null,
      headers: null,
      collectionId: "col-2",
    });
    mocks.getGRPCRequestByIdMock.mockResolvedValueOnce({
      id: "grpc-1",
      serverAddress: "localhost:50051",
      service: "Greeter",
      method: "SayHello",
      protoFile: 'syntax = "proto3";',
      metadata: null,
      useTls: false,
      body: "{}",
      collectionId: "col-3",
    });
    mocks.getCollectionByIdMock
      .mockResolvedValueOnce({ id: "col-1", workspaceId: "ws-1" })
      .mockResolvedValueOnce({ id: "col-2", workspaceId: "ws-1" })
      .mockResolvedValueOnce({ id: "col-3", workspaceId: "ws-1" });
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
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          execution_id: "exec-3",
          status_code: 0,
          request_duration: "31ms",
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
        body: JSON.stringify({
          protocol: "REST",
          request_id: "req-1",
        }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      }),
    );
    expect(mocks.fetchMock).toHaveBeenNthCalledWith(
      2,
      "https://prism.local/api/intercept",
      expect.objectContaining({
        body: JSON.stringify({
          protocol: "GRAPHQL",
          graphql_request_id: "gql-1",
        }),
      }),
    );
    expect(mocks.fetchMock).toHaveBeenNthCalledWith(
      3,
      "https://prism.local/api/intercept",
      expect.objectContaining({
        body: JSON.stringify({
          protocol: "GRPC",
          grpc_request_id: "grpc-1",
        }),
      }),
    );
    expect(mocks.fetchMock).toHaveBeenCalledTimes(3);
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
    expect(mocks.updateWorkflowRunStepMock).toHaveBeenNthCalledWith(
      3,
      "run-step-3",
      "SUCCESS",
      "exec-3",
      31,
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
        {
          stepId: "step-3",
          executionId: "exec-3",
          status: "SUCCESS",
          durationMs: 31,
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
        protocol: "REST",
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

  it("fails before intercept execution when a step request belongs to another workspace", async () => {
    mocks.getWorkflowByIdMock.mockResolvedValue({
      id: "wf-1",
      workspaceId: "ws-1",
      steps: [],
    });
    mocks.getWorkflowStepsMock.mockResolvedValue([
      {
        id: "step-1",
        requestId: "gql-9",
        protocol: "GRAPHQL",
        retryCount: 0,
      },
    ]);
    mocks.createWorkflowRunStepMock.mockResolvedValue({ id: "run-step-1" });
    mocks.getGraphQLRequestByIdMock.mockResolvedValue({
      id: "gql-9",
      url: "https://api.example.com/graphql",
      query: "{ ping }",
      variables: null,
      operationName: null,
      headers: null,
      collectionId: "col-9",
    });
    mocks.getCollectionByIdMock.mockResolvedValue({
      id: "col-9",
      workspaceId: "ws-2",
    });

    const result = await executeWorkflow("wf-1", "run-1", {
      interceptBaseUrl: "https://prism.local",
      triggeredBy: "user-1",
      workflowWorkspaceId: "ws-1",
    });

    expect(mocks.fetchMock).not.toHaveBeenCalled();
    expect(mocks.updateWorkflowRunStepMock).toHaveBeenCalledWith(
      "run-step-1",
      "FAILED",
      undefined,
      undefined,
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
          status: "FAILED",
        },
      ],
    });
  });
});
