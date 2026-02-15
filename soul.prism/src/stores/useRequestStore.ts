"use client";

// stores/useRequestStore.ts
import { InterceptorResponse, InterceptorSpan } from "@/@types/intercept";
import { requestParser } from "@/utils/variableParser";
import { create } from "zustand";
import { debounce } from "lodash";

import { updateRequestAction } from "@/backend/request/request.actions";
import { RequestItem } from "@/@types/collectionItem";
import { toast } from "sonner";
import { unwrap } from "@/@types/actionResult";
import {
  KeyValueRow,
  rowsToObject,
  rowsToSearchParams,
} from "@/components/editors/KeyValueEditor";
import { useSelectionStore } from "./useSelectionStore";
import { useAuth } from "@clerk/nextjs";

export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";

interface RequestState {
  id: string | null;
  name: string;

  method: HttpMethod;
  url: string;
  params: KeyValueRow[];
  headers: KeyValueRow[];
  body: string | null;

  isLoading: boolean;
  isExecuting: boolean;

  // inside useRequestStore

  response: {
    status: number | null;
    headers: Record<string, string>;
    body: string | null;
    time: number | null;
    error: string | null;
  };

  execution: {
    executionId: string | null;
    requestId: string | null;
    traceId: string | null;
    spans: InterceptorSpan[];
  } | null;

  setRequest: (r: RequestItem) => void;

  setName: (n: string) => void;
  setMethod: (m: HttpMethod) => void;
  setUrl: (url: string) => void;
  setParams: (p: KeyValueRow[]) => void;
  setHeaders: (h: KeyValueRow[]) => void;
  setBody: (b: string | null) => void;

  setLoading: (l: boolean) => void;
  setExecuting: (e: boolean) => void;

  saveRequest: () => Promise<void>;

  execute: (
    eV: Record<string, string>,
    userId: string,
    requestId: string,
    collectionId: string,
  ) => Promise<void>;
}

export const useRequestStore = create<RequestState>((set, get) => {
  const debouncedSave = debounce(async () => {
    await get().saveRequest();
    set({ isLoading: false });
  }, 800);

  return {
    id: null,
    name: "",

    method: "GET",
    url: "",
    params: [],
    headers: [],
    body: null,

    isLoading: false,
    isExecuting: false,

    response: {
      status: null,
      headers: {},
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

    setRequest: (r) => {
      set({
        id: r.id,
        name: r.name,
        method: r.method,
        url:
          r.url === "" ? "" : new URL(r.url).origin + new URL(r.url).pathname,
        params: r.params ?? [],
        headers: r.headers ?? [],
        body: r.body,
      });
    },

    setName: (name) => {
      set({ isLoading: true });
      set({ name });
      debouncedSave();
    },

    setMethod: (method) => {
      set({ isLoading: true });
      set({ method });
      debouncedSave();
    },

    setUrl: (url) => {
      set({ isLoading: true });
      set({ url });
      debouncedSave();
    },

    setParams: (params) => {
      set({ isLoading: true });
      set({ params });
      debouncedSave();
    },

    setHeaders: (headers) => {
      set({ isLoading: true });
      set({ headers });
      debouncedSave();
    },

    setBody: (body) => {
      set({ isLoading: true });
      set({ body });
      debouncedSave();
    },

    setLoading: (isLoading) => set({ isLoading }),
    setExecuting: (isExecuting) => set({ isExecuting }),

    saveRequest: async () => {
      const { id, name, method, url, params, headers, body } = get();
      if (!id) return;

      const updateRequestInput = {
        body: body,
        headers: rowsToObject(headers),
        method: method,
        name: name,
        url: url + "?" + rowsToSearchParams(params).toString(),
      };

      try {
        unwrap(await updateRequestAction(id, updateRequestInput));
      } catch (err: any) {
        toast.error(err.message);
      }
    },

    execute: async (environmentVariables, userId, requestId, collectionId) => {
      const { method, url, params, headers, body } = get();

      // Verify
      if (!url) {
        throw new Error("URL is required");
      }
      if (!method) {
        throw new Error("Method is required");
      }

      // Parse env variables
      const envUrl = requestParser(url, environmentVariables);

      let parsedUrl: URL;
      try {
        parsedUrl = new URL(envUrl);
      } catch {
        set({ isExecuting: false });
        throw new Error("Invalid URL");
      }

      const payload = {
        method,
        url: parsedUrl + "?" + rowsToSearchParams(params).toString(),
        headers: rowsToObject(headers),
        body,
        request_id: requestId,
        collection_id: collectionId,
        created_by_id: userId,
      };

      // Send to intercept.prism
      const res = await fetch("/api/intercept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error("Internal error");
      }
      const data = (await res.json()) as InterceptorResponse;

      // Store response
      set({
        response: {
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

      set({ isExecuting: false });
    },
  };
});

// Helper
function parseDurationMs(v: string): number {
  if (!v) return 0;
  const n = Number(v.replace(/ms$/, ""));
  return Number.isFinite(n) ? n : 0;
}
