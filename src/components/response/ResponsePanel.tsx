"use client";

import { useState } from "react";
import CodeEditor from "@/components/editor/CodeEditor";
import ResponseInfo from "./ResponseInfo";

const tabs = ["Body", "Headers", "Cookies", "Tests"];

export default function ResponsePanel() {
  const [activeTab, setActiveTab] = useState("Body");
  const [responeStatus, setResponseStatus] = useState(200)
  const [resposneTime, setResponseTime] = useState(432)

  const responseBody = `{
  "status": "ok",
  "data": {}
}`;

  return (
    <div className="p-4 h-full bg-[var(--bg-secondary)]">
      <div className="flex justify-between">

        {/* Tabs */}
        <div className="flex gap-4 text-sm border-b border-[var(--border-color)] mb-3">
          {tabs.map(tab => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                console.log("[UI]", "RESPONSE_TAB_CHANGED", { tab });
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

        <ResponseInfo statusCode={responeStatus} responseTime={resposneTime}/>

      </div>

      {/* Content */}
      <div className="h-[calc(100%-40px)]">
        {activeTab === "Body" && (
          <CodeEditor
            language="json"
            value={responseBody}
            readOnly
          />
        )}

        {activeTab !== "Body" && (
          <div className="text-[var(--text-secondary)] p-2">
            {activeTab} view coming soon
          </div>
        )}
      </div>
    </div>
  );
}

