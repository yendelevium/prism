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
import { KeyValueRow, rowsToObject, rowsToSearchParams } from "@/components/editors/KeyValueEditor";

export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";

interface RequestState {
  id: string | null;
  name: string;

  method: HttpMethod;
  url: string;
  params: KeyValueRow[];
  headers: KeyValueRow[];
  body: string | null;

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

  setMethod: (m: HttpMethod) => void;
  setUrl: (url: string) => void;
  setParams: (p: KeyValueRow[]) => void;
  setHeaders: (h: KeyValueRow[]) => void;
  setBody: (b: string | null) => void;

  saveRequest: () => Promise<void>;

  execute: (eV: Record<string, string>) => Promise<void>;
}

export const useRequestStore = create<RequestState>((set, get) => {
  const debouncedSave = debounce(async () => {
    await get().saveRequest();
  }, 800);

  return {
    id: null,
    name: "",

    method: "GET",
    url: "",
    params: [],
    headers: [],
    body: null,

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
        url: new URL(r.url).origin + new URL(r.url).pathname,
        params: r.params ?? [],
        headers: r.headers ?? [],
        body: r.body,
      });
    },

    setMethod: (method) => {
      set({ method });
      debouncedSave();
    },

    setUrl: (url) => {
      set({ url });
      debouncedSave();
    },

    setParams: (params) => {
      set({ params });
      debouncedSave();
    },

    setHeaders: (headers) => {
      set({ headers });
      debouncedSave();
    },

    setBody: (body) => {
      set({ body });
      debouncedSave();
    },

    saveRequest: async () => {
      const { id, name, method, url, params, headers, body } = get();
      if (!id) return;

      const updateRequestInput = {
        body: body,
        headers: rowsToObject(headers),
        method: method,
        name: name,
        url: url + '?' + rowsToSearchParams(params).toString(),
      }

      try {
        unwrap(await updateRequestAction(id, updateRequestInput));
      }
      catch (err: any) {
        toast.error(err.message);
      }
    },

    execute: async (environmentVariables) => {
      const { method, url, params, headers, body } = get();

    // Verify
      if (!url) {
        throw new Error("URL is required");
      }

    // Parse env variables
      const envUrl = requestParser(url, environmentVariables);

      let parsedUrl: URL;
      try {
        parsedUrl = new URL(envUrl);
      } catch {
        throw new Error("Invalid URL");
      }

      const payload = {
        method,
        url: parsedUrl + '?' + rowsToSearchParams(params).toString(),
        headers: rowsToObject(headers),
        body,
        collection_id: "c_1",  // TODO: implement with actual collection id
        created_by_id: "user_1",  // TODO: implement with actual used id
      };

      console.log(payload);

      // Send to intercept.prism
      const res = await fetch("/api/intercept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = (await res.json()) as InterceptorResponse;

    console.log(data)

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
    },
  };
});

// Helper
function parseDurationMs(v: string): number {
  if (!v) return 0;
  const n = Number(v.replace(/ms$/, ""));
  return Number.isFinite(n) ? n : 0;
}

