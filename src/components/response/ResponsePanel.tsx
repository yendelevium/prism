"use client";

import { useState } from "react";

const tabs = ["Body", "Headers", "Cookies", "Tests"];

export default function ResponsePanel() {
  const [activeTab, setActiveTab] = useState("Body");

  const handleTabClick = (tab: string) => {
    setActiveTab(tab);
    console.log("[UI]", "RESPONSE_TAB_CHANGED", { tab });
  };

  return (
    <div className="p-4">
      <div className="flex gap-4 text-sm border-b border-[var(--border-color)] mb-4">
        {tabs.map(tab => (
          <button
            key={tab}
            onClick={() => handleTabClick(tab)}
            className={`pb-2 ${
              activeTab === tab
                ? "text-[var(--accent)]"
                : "hover:text-[var(--accent)]"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <pre className="text-xs bg-black/30 p-3 rounded overflow-auto">
{`[${activeTab}]
{
  "status": "ok",
  "data": {}
}`}
      </pre>
    </div>
  );
}

