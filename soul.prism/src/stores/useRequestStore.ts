// stores/useRequestStore.ts
import { InterceptorResponse, InterceptorSpan } from "@/@types/intercept";
import { create } from "zustand";

export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";

interface RequestState {
  method: HttpMethod;
  url: string;
  params: Record<string, string>;
  headers: Record<string, string>;
  body: string | null;

  // inside useRequestStore

response: {
  status: number | null;
  headers: Record<string, string>;
  body: string | null;
  time: number | null;
  error: string | null;
},

execution: {
  executionId: string | null;
  requestId: string | null;
  traceId: string | null;
  spans: InterceptorSpan[];
} | null,


  setMethod: (m: HttpMethod) => void;
  setUrl: (url: string) => void;
  setParams: (p: Record<string, string>) => void;
  setHeaders: (h: Record<string, string>) => void;
  setBody: (b: string | null) => void;

  execute: () => Promise<void>;
}

export const useRequestStore = create<RequestState>((set, get) => ({
  method: "GET",
  url: "",
  params: {},
  headers: {},
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

  setMethod: (method) => set({ method }),
  setUrl: (url) => set({ url }),
  setParams: (params) => set({ params }),
  setHeaders: (headers) => set({ headers }),
  setBody: (body) => set({ body }),

  execute: async () => {
    const { method, url, params, headers, body } = get();

    // Verify
    if (!url) {
      throw new Error("URL is required");
    }

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
    } catch {
      throw new Error("Invalid URL");
    }

    // Build final URL
    Object.entries(params).forEach(([k, v]) =>
      parsedUrl.searchParams.set(k, v)
    );

    const payload = {
        method,
        url: parsedUrl.toString(),
        headers,
        body,
        collection_id: 'c_1', // TODO: implement with actual collection id
        created_by_id: 'user_1' // TODO: implement with actual used id

    }

    console.log(payload);

    // Send to intercept.prism
    const res = await fetch("/api/intercept", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json() as InterceptorResponse;
    
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
}));


// Helper
function parseDurationMs(v: string): number {
  if (!v) return 0;

  const n = Number(v.replace(/ms$/, ""));
  return Number.isFinite(n) ? n : 0;
}
