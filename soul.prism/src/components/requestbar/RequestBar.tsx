"use client";

import { useRequestStore } from "@/stores/useRequestStore";
import Dropdown from "../common/Dropdown";
import { toast } from "sonner";

export default function RequestBar() {
  const {
    method,
    url,
    setMethod,
    setUrl,
    execute,
  } = useRequestStore();

  const handleSend = async () => {
    try {
      await execute();
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
        options={METHODS}
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
        className="bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-black px-4 py-1 rounded"
      >
        Send
      </button>
    </div>
  );
}
