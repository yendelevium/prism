"use client";

import { useState } from "react";

const tabs = ["Params", "Headers", "Body", "Auth", "Tests"];

export default function RequestTabs() {
  const [activeTab, setActiveTab] = useState("Params");

  const handleTabClick = (tab: string) => {
    setActiveTab(tab);
    console.log("[UI]", "REQUEST_TAB_CHANGED", { tab });
  };

  return (
    <div className="p-4 border-r border-[var(--border-color)]">
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

      <div className="text-[var(--text-secondary)]">
        Active tab: {activeTab}
      </div>
    </div>
  );
}

