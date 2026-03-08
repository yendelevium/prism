"use client";

import { useRequestStore } from "@/stores/useRequestStore";
import { toast } from "sonner";
import { useEnvironment } from "../context/EnvironmentContext";
import { useSelectionStore } from "@/stores/useSelectionStore";
import { useAuth } from "@clerk/nextjs";
import { Protocol } from "@/@types/collectionItem";

export default function RequestBar() {
  const protocol = useRequestStore((s) => s.protocol);
  const rest = useRequestStore((s) => s.rest);
  const graphql = useRequestStore((s) => s.graphql);
  const grpc = useRequestStore((s) => s.grpc);

  const setRestField = useRequestStore((s) => s.setRestField);
  const setGraphQLField = useRequestStore((s) => s.setGraphQLField);
  const setGRPCField = useRequestStore((s) => s.setGRPCField);

  const execute = useRequestStore((s) => s.execute);
  const isExecuting = useRequestStore((s) => s.isExecuting);
  const setExecuting = useRequestStore((s) => s.setExecuting);

  const currentRequest = useSelectionStore((s) => s.request);
  const currentCollection = useSelectionStore((s) => s.collection);
  const currentAuth = useAuth();
  const { variables } = useEnvironment();

  const handleSend = async () => {
    if (isExecuting) return;
    try {
      console.log(currentCollection, currentRequest);
      if (!currentAuth.userId) {
        throw new Error("No user detected. Please sign-in again");
      }
      if (!currentCollection?.id || !currentRequest?.id) {
        throw new Error("Please select a request to execute");
      }

      setExecuting(true);
      await execute(
        variables,
        currentAuth.userId!,
        currentRequest!.id,
        currentCollection!.id,
      );
    } catch (err: any) {
      toast.error(`Failed to send request: ${err.message}`);
    } finally {
      setExecuting(false);
    }
  };

  const METHODS = ["GET", "POST", "PUT", "DELETE", "PATCH"] as const;

  const renderRestBar = () => (
    <>
      <select
        value={rest.method}
        onChange={(e) => setRestField({ method: e.target.value as any })}
        className="px-3 py-1.5 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
      >
        {METHODS.map((m) => (
          <option key={m} value={m}>
            {m}
          </option>
        ))}
      </select>
      <input
        value={rest.url}
        onChange={(e) => setRestField({ url: e.target.value })}
        placeholder="Enter request URL"
        className="flex-1 bg-transparent border border-[var(--border-color)] rounded px-3 py-1.5 text-sm"
      />
    </>
  );

  const renderGraphQLBar = () => (
    <input
      value={graphql.url}
      onChange={(e) => setGraphQLField({ url: e.target.value })}
      placeholder="GraphQL Endpoint URL"
      className="flex-1 bg-transparent border border-[var(--border-color)] rounded px-3 py-1.5 text-sm"
    />
  );

  const renderGRPCBar = () => (
    <>
      <input
        value={grpc.serverAddress}
        onChange={(e) => setGRPCField({ serverAddress: e.target.value })}
        placeholder="Server Address (e.g., localhost:50051)"
        className="flex-1 bg-transparent border border-[var(--border-color)] rounded px-3 py-1.5 text-sm"
      />
      <input
        value={grpc.service}
        onChange={(e) => setGRPCField({ service: e.target.value })}
        placeholder="Service (e.g., mypackage.MyService)"
        className="w-48 bg-transparent border border-[var(--border-color)] rounded px-3 py-1.5 text-sm"
      />
      <input
        value={grpc.method}
        onChange={(e) => setGRPCField({ method: e.target.value })}
        placeholder="Method"
        className="w-32 bg-transparent border border-[var(--border-color)] rounded px-3 py-1.5 text-sm"
      />
      <label className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)] whitespace-nowrap">
        <input
          type="checkbox"
          checked={grpc.useTls}
          onChange={(e) => setGRPCField({ useTls: e.target.checked })}
          className="rounded"
        />
        TLS
      </label>
    </>
  );

  return (
    <div className="flex items-center gap-2 p-2 bg-[var(--bg-secondary)] border-b border-[var(--border-color)]">
      {protocol === "REST" && renderRestBar()}
      {protocol === "GRAPHQL" && renderGraphQLBar()}
      {protocol === "GRPC" && renderGRPCBar()}

      <button
        type="button"
        onClick={handleSend}
        className="relative bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-black px-4 py-1.5 rounded flex items-center justify-center text-sm font-medium"
      >
        <span className={isExecuting ? "opacity-0" : "opacity-100"}>Send</span>
        {isExecuting && (
          <div className="absolute h-4 w-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
        )}
      </button>
    </div>
  );
}
