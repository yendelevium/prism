"use client";

import { useState } from "react";
import CodeEditor from "@/components/editor/CodeEditor";

const tabs = ["Params", "Headers", "Body", "Auth", "Tests"];

export default function RequestTabs() {
  const [activeTab, setActiveTab] = useState("Params");
  const [body, setBody] = useState(`{
  "example": true
}`);

  return (
    <div className="p-4 border-r border-[var(--border-color)] h-full bg-[var(--bg-secondary)]">
      {/* Tabs */}
      <div className="flex gap-4 text-sm border-b border-[var(--border-color)] mb-3">
        {tabs.map(tab => (
          <button
            key={tab}
            onClick={() => {
              setActiveTab(tab);
              console.log("[UI]", "REQUEST_TAB_CHANGED", { tab });
            }}
            className={`pb-2 ${
              activeTab === tab
                ? "text-[var(--accent)] border-b-2 border-[var(--accent)]"
                : "text-[var(--text-secondary)]"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="h-[calc(100%-40px)]">
        {activeTab === "Body" && (
          <CodeEditor
            language="json"
            value={body}
            onChange={() => {
              setBody(body)
            }}
          />
        )}

        {activeTab !== "Body" && (
          <div className="text-[var(--text-secondary)] p-2">
            {activeTab} editor coming soon
          </div>
        )}
      </div>
    </div>
  );
}
