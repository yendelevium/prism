"use client";

import { useState } from "react";

export default function RequestBar() {
  const [method, setMethod] = useState("GET");
  const [url, setUrl] = useState("");

  const handleSend = () => {
    console.log("[UI]", "SEND_REQUEST_CLICKED", { method, url });
  };

  return (
    <div className="flex items-center gap-2 p-3 bg-[var(--bg-panel)] border-b border-[var(--border-color)]">
      <select
        value={method}
        onChange={(e) => {
          setMethod(e.target.value);
          console.log("[UI]", "METHOD_CHANGED", { method: e.target.value });
        }}
        className="bg-transparent border border-[var(--border-color)] rounded px-2 py-1"
      >
        {["GET", "POST", "PUT", "DELETE", "PATCH"].map(m => (
          <option key={m}>{m}</option>
        ))}
      </select>

      <input
        value={url}
        onChange={(e) => {
          setUrl(e.target.value);
          console.log("[UI]", "URL_CHANGED", { url: e.target.value });
        }}
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

