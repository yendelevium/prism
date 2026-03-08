"use client";

import { Protocol } from "@/@types/collectionItem";
import { InterceptorSpan } from "@/@types/intercept";
import { requestParser } from "@/utils/variableParser";
import { create } from "zustand";
import { debounce } from "lodash";

import { updateRequestAction } from "@/backend/request/request.actions";
import { updateGraphQLRequestAction } from "@/backend/graphql-request/graphql-request.actions";
import { updateGRPCRequestAction } from "@/backend/grpc-request/grpc-request.actions";
import {
  GraphQLRequestItem,
  GRPCRequestItem,
  RequestItem,
} from "@/@types/collectionItem";
import { toast } from "sonner";
import { unwrap } from "@/@types/actionResult";
import {
  KeyValueRow,
  rowsToObject,
  rowsToSearchParams,
  objectToRows,
} from "@/components/editors/KeyValueEditor";

export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";

interface RestState {
  method: HttpMethod;
  url: string;
  params: KeyValueRow[];
  headers: KeyValueRow[];
  body: string | null;
}

interface GraphQLState {
  url: string;
  query: string;
  variables: string;
  operationName: string;
  headers: KeyValueRow[];
}

interface GRPCState {
  serverAddress: string;
  service: string;
  method: string;
  protoFile: string;
  metadata: KeyValueRow[];
  useTls: boolean;
  body: string;
}

interface RestResponse {
  status: number | null;
  headers: Record<string, string>;
  body: string | null;
  time: number | null;
  error: string | null;
}

interface GraphQLResponse {
  status: number | null;
  headers: Record<string, string>;
  body: string | null;
  time: number | null;
  error: string | null;
}

interface GRPCResponse {
  statusCode: number | null;
  statusName: string | null;
  headers: Record<string, string>;
  trailers: Record<string, string>;
  body: string | null;
  time: number | null;
  error: string | null;
}

interface RequestState {
  protocol: Protocol;
  id: string | null;
  collectionId: string | null;
  name: string;

  rest: RestState;
  graphql: GraphQLState;
  grpc: GRPCState;

  isLoading: boolean;
  isExecuting: boolean;

  restResponse: RestResponse;
  graphqlResponse: GraphQLResponse;
  grpcResponse: GRPCResponse;

  execution: {
    executionId: string | null;
    requestId: string | null;
    traceId: string | null;
    spans: InterceptorSpan[];
  } | null;

  setProtocol: (p: Protocol) => void;
  setId: (id: string | null) => void;
  setCollectionId: (collectionId: string | null) => void;

  setRequest: (r: RequestItem) => void;
  setGraphQLRequest: (r: GraphQLRequestItem) => void;
  setGRPCRequest: (r: GRPCRequestItem) => void;

  setName: (n: string) => void;

  setRestField: (field: Partial<RestState>) => void;
  setGraphQLField: (field: Partial<GraphQLState>) => void;
  setGRPCField: (field: Partial<GRPCState>) => void;

  setLoading: (l: boolean) => void;
  setExecuting: (e: boolean) => void;

  saveRequest: () => Promise<void>;
  saveGraphQLRequest: () => Promise<void>;
  saveGRPCRequest: () => Promise<void>;

  execute: (
    eV: Record<string, string>,
    userId: string,
    requestId: string,
    collectionId: string,
  ) => Promise<void>;
}

const defaultRestState: RestState = {
  method: "GET",
  url: "",
  params: [],
  headers: [],
  body: null,
};

const defaultGraphQLState: GraphQLState = {
  url: "",
  query: "",
  variables: "{}",
  operationName: "",
  headers: [],
};

const defaultGRPCState: GRPCState = {
  serverAddress: "",
  service: "",
  method: "",
  protoFile: "",
  metadata: [],
  useTls: false,
  body: "",
};

const defaultResponse: RestResponse = {
  status: null,
  headers: {},
  body: "",
  time: null,
  error: null,
};

export const useRequestStore = create<RequestState>((set, get) => {
  const debouncedSave = debounce(async () => {
    const { protocol, saveRequest, saveGraphQLRequest, saveGRPCRequest } =
      get();
    if (protocol === "REST") {
      await saveRequest();
    } else if (protocol === "GRAPHQL") {
      await saveGraphQLRequest();
    } else if (protocol === "GRPC") {
      await saveGRPCRequest();
    }
    set({ isLoading: false });
  }, 800);

  return {
    protocol: "REST",
    id: null,
    collectionId: null,
    name: "",

    rest: { ...defaultRestState },
    graphql: { ...defaultGraphQLState },
    grpc: { ...defaultGRPCState },

    isLoading: false,
    isExecuting: false,

    restResponse: { ...defaultResponse },
    graphqlResponse: { ...defaultResponse },
    grpcResponse: {
      statusCode: null,
      statusName: null,
      headers: {},
      trailers: {},
      body: "",
      time: null,
      error: null,
    },

    execution: {
      executionId: null,
      requestId: null,
      traceId: null,
      spans: [],
    },

    setProtocol: (protocol) => set({ protocol }),

    setId: (id) => set({ id }),
    setCollectionId: (collectionId) => set({ collectionId }),

    setRequest: (r) => {
      set({
        id: r.id,
        name: r.name,
        rest: {
          method: r.method,
          url: r.url ? r.url.split("?")[0] : "",
          params: r.params ?? [],
          headers: r.headers ?? [],
          body: r.body,
        },
      });
    },

    setGraphQLRequest: (r) => {
      set({
        id: r.id,
        name: r.name,
        graphql: {
          url: r.url,
          query: r.query,
          variables: r.variables ?? "{}",
          operationName: r.operationName ?? "",
          headers: r.headers ?? [],
        },
      });
    },

    setGRPCRequest: (r) => {
      set({
        id: r.id,
        name: r.name,
        grpc: {
          serverAddress: r.serverAddress,
          service: r.service,
          method: r.method,
          protoFile: r.protoFile,
          metadata: r.metadata ?? [],
          useTls: r.useTls,
          body: r.body ?? "",
        },
      });
    },

    setName: (name) => {
      set({ isLoading: true, name });
      debouncedSave();
    },

    setRestField: (field) => {
      set({ isLoading: true });
      set((state) => ({
        rest: { ...state.rest, ...field },
      }));
      debouncedSave();
    },

    setGraphQLField: (field) => {
      set({ isLoading: true });
      set((state) => ({
        graphql: { ...state.graphql, ...field },
      }));
      debouncedSave();
    },

    setGRPCField: (field) => {
      set({ isLoading: true });
      set((state) => ({
        grpc: { ...state.grpc, ...field },
      }));
      debouncedSave();
    },

    setLoading: (isLoading) => set({ isLoading }),
    setExecuting: (isExecuting) => set({ isExecuting }),

    saveRequest: async () => {
      const { id, name, rest } = get();
      if (!id) return;

      const updateRequestInput = {
        body: rest.body,
        headers: rowsToObject(rest.headers),
        method: rest.method,
        name: name,
        url: rest.url + "?" + rowsToSearchParams(rest.params).toString(),
      };

      try {
        unwrap(await updateRequestAction(id, updateRequestInput));
      } catch (err: any) {
        toast.error(err.message);
      }
    },

    saveGraphQLRequest: async () => {
      const { id, name, graphql } = get();
      if (!id) return;

      const updateInput = {
        name,
        url: graphql.url,
        query: graphql.query,
        variables: graphql.variables,
        operationName: graphql.operationName || null,
        headers: rowsToObject(graphql.headers),
      };

      try {
        unwrap(await updateGraphQLRequestAction(id, updateInput));
      } catch (err: any) {
        toast.error(err.message);
      }
    },

    saveGRPCRequest: async () => {
      const { id, name, grpc } = get();
      if (!id) return;

      const updateInput = {
        name,
        serverAddress: grpc.serverAddress,
        service: grpc.service,
        method: grpc.method,
        protoFile: grpc.protoFile,
        metadata: rowsToObject(grpc.metadata),
        useTls: grpc.useTls,
        body: grpc.body || null,
      };

      try {
        unwrap(await updateGRPCRequestAction(id, updateInput));
      } catch (err: any) {
        toast.error(err.message);
      }
    },

    execute: async (environmentVariables, userId, requestId, collectionId) => {
      const { protocol, rest, graphql, grpc } = get();

      if (protocol === "REST") {
        await executeRest(
          rest,
          environmentVariables,
          userId,
          requestId,
          collectionId,
          set,
          get,
        );
      } else if (protocol === "GRAPHQL") {
        await executeGraphQL(
          graphql,
          environmentVariables,
          userId,
          requestId,
          collectionId,
          set,
          get,
        );
      } else if (protocol === "GRPC") {
        await executeGRPC(
          grpc,
          environmentVariables,
          userId,
          requestId,
          collectionId,
          set,
          get,
        );
      }
    },
  };
});

async function executeRest(
  rest: RestState,
  environmentVariables: Record<string, string>,
  userId: string,
  requestId: string,
  collectionId: string,
  set: any,
  get: any,
) {
  const { setExecuting } = get();

  if (!rest.url) {
    setExecuting(false);
    throw new Error("URL is required");
  }
  if (!rest.method) {
    setExecuting(false);
    throw new Error("Method is required");
  }

  const envUrl = requestParser(rest.url, environmentVariables);

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(envUrl);
  } catch {
    setExecuting(false);
    throw new Error("Invalid URL");
  }

  const payload = {
    method: rest.method,
    url: parsedUrl + "?" + rowsToSearchParams(rest.params).toString(),
    headers: rowsToObject(rest.headers),
    body: rest.body,
    request_id: requestId,
    collection_id: collectionId,
    created_by_id: userId,
    protocol: "REST",
  };

  const res = await fetch("/api/intercept", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    setExecuting(false);
    throw new Error("Internal error");
  }
  const data = await res.json();

  set({
    restResponse: {
      status: data.status,
      headers: data.headers,
      body: data.body,
      time: parseDurationMs(data.request_duration),
      error: data.error_msg || null,
    },
    execution: {
      executionId: data.execution_id,
      requestId: data.request_id,
      traceId: data.trace_id,
      spans: data.spans,
    },
  });

  setExecuting(false);
}

async function executeGraphQL(
  graphql: GraphQLState,
  environmentVariables: Record<string, string>,
  userId: string,
  requestId: string,
  collectionId: string,
  set: any,
  get: any,
) {
  const { setExecuting } = get();

  if (!graphql.url) {
    setExecuting(false);
    throw new Error("URL is required");
  }

  const envUrl = requestParser(graphql.url, environmentVariables);

  let variables: Record<string, unknown> = {};
  try {
    variables = JSON.parse(graphql.variables || "{}");
  } catch {
    setExecuting(false);
    throw new Error("Invalid JSON in variables");
  }

  const payload = {
    url: envUrl,
    query: graphql.query,
    variables,
    operation_name: graphql.operationName || null,
    headers: rowsToObject(graphql.headers),
    request_id: requestId,
    collection_id: collectionId,
    created_by_id: userId,
  };

  const res = await fetch("/api/intercept", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...payload, protocol: "GRAPHQL" }),
  });

  if (!res.ok) {
    setExecuting(false);
    throw new Error("Internal error");
  }
  const data = await res.json();

  set({
    graphqlResponse: {
      status: data.status,
      headers: data.headers,
      body: data.body,
      time: parseDurationMs(data.request_duration),
      error: data.error_msg || null,
    },
    execution: {
      executionId: data.execution_id,
      requestId: data.request_id,
      traceId: data.trace_id,
      spans: data.spans,
    },
  });

  setExecuting(false);
}

async function executeGRPC(
  grpc: GRPCState,
  environmentVariables: Record<string, string>,
  userId: string,
  requestId: string,
  collectionId: string,
  set: any,
  get: any,
) {
  const { setExecuting } = get();

  if (!grpc.serverAddress) {
    setExecuting(false);
    throw new Error("Server address is required");
  }
  if (!grpc.service) {
    setExecuting(false);
    throw new Error("Service is required");
  }
  if (!grpc.method) {
    setExecuting(false);
    throw new Error("Method is required");
  }
  if (!grpc.protoFile) {
    setExecuting(false);
    throw new Error("Proto file is required");
  }

  const envServerAddress = requestParser(
    grpc.serverAddress,
    environmentVariables,
  );

  const payload = {
    server_address: envServerAddress,
    service: grpc.service,
    method: grpc.method,
    body: grpc.body || "",
    proto_file: grpc.protoFile,
    metadata: rowsToObject(grpc.metadata),
    use_tls: grpc.useTls,
    request_id: requestId,
    collection_id: collectionId,
    created_by_id: userId,
  };

  const res = await fetch("/api/intercept", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...payload, protocol: "GRPC" }),
  });

  if (!res.ok) {
    setExecuting(false);
    throw new Error("Internal error");
  }
  const data = await res.json();

  set({
    grpcResponse: {
      statusCode: data.status_code,
      statusName: data.status_name,
      headers: data.response_headers || {},
      trailers: data.response_trailers || {},
      body: data.body,
      time: parseDurationMs(data.request_duration),
      error: data.error_msg || null,
    },
    execution: {
      executionId: data.execution_id,
      requestId: data.request_id,
      traceId: data.trace_id,
      spans: data.spans,
    },
  });

  setExecuting(false);
}

function parseDurationMs(v: string): number {
  if (!v) return 0;
  const n = Number(v.replace(/ms$/, ""));
  return Number.isFinite(n) ? n : 0;
}
