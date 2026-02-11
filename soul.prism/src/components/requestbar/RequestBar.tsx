"use client";

import { useRequestStore } from "@/stores/useRequestStore";
import Dropdown from "../common/Dropdown";
import { toast } from "sonner";
import { useEnvironment } from "../context/EnvironmentContext";
import { useSelectionStore } from "@/stores/useSelectionStore";
import { useAuth } from "@clerk/nextjs";

export default function RequestBar() {
  const {
    method,
    url,
    setMethod,
    setUrl,
    execute,
    isExecuting,
  } = useRequestStore();
  const currentRequest = useSelectionStore(s => s.request);
  const currentCollection = useSelectionStore(s => s.collection)
  const currentAuth = useAuth();
  const { variables } = useEnvironment();

  const handleSend = async () => {
    if (isExecuting) return;
    try {
      await execute(variables, currentAuth.userId!, currentCollection!.id, currentRequest!.id);
    } catch (err: any) {
      toast.error(err.message ?? "Failed to send request");
    }
  };

  const METHODS = ["GET", "POST", "PUT", "DELETE", "PATCH"] as const;

  return (
    <div className="flex items-center gap-2 p-3 bg-[var(--bg-secondary)] border-b border-[var(--border-color)]">
      <Dropdown
        label="Method"
        value={method}
        options={METHODS.map(m => ({
          value: m,
          label: m,
        }))}
        onChange={setMethod}
      />

      <input
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="https://api.example.com"
        className="flex-1 bg-transparent border border-[var(--border-color)] rounded px-3 py-1"
      />

      <button 
        onClick={handleSend}
        className="relative bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-black px-4 py-1 rounded flex items-center justify-center"
      >
        <span className={isExecuting ? "opacity-0" : "opacity-100"}>
          Send
        </span>
        {isExecuting && <div className="absolute h-4 w-4 border-2 border-[var(--border-color)] border-t-[var(--accent)] rounded-full animate-spin" />}
      </button>
    </div>
  );
}
