"use client";

import { useState } from "react";
import Dropdown from "../common/Dropdown";

export default function RequestBar() {
  const [method, setMethod] = useState("GET");
  const [url, setUrl] = useState("");

  const handleSend = () => {
    console.log("[UI]", "SEND_REQUEST_CLICKED", { method, url });
  };

  return (
    <div className="flex items-center gap-2 p-3 bg-[var(--bg-secondary)] border-b border-[var(--border-color)]">
       <Dropdown
          label="Method"
          value={method}
          options={["GET", "POST", "PUT", "DELETE", "PATCH"]}
          onChange={setMethod}
        />

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

