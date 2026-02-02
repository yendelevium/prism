"use client";

import { useState } from "react";
import CodeEditor from "@/components/editors/CodeEditor";
import ResponseInfo from "./ResponseInfo";
import { KeyValueEditor, KeyValueRow } from "../editors/KeyValueEditor";

const tabs = ["Body", "Headers", "Cookies", "Tests"];

export default function ResponsePanel() {
  const [activeTab, setActiveTab] = useState("Body");
  const [responeStatus, setResponseStatus] = useState(200)
  const [resposneTime, setResponseTime] = useState(432)
  const [rows, setRows] = useState<KeyValueRow[]>([
    {
      id: '1',
      key: 'API_BASE_URL_WITH_A_REALLY_LONG_NAME',
      value: 'https://api.example.com',
    },
    {
      id: '2',
      key: 'API_KEY',
      value: 'secret-key',
      secret: true,
    },
  ])

  const responseBody = `{
  "status": "ok",
  "data": {}
}`;

  return (
    <div className="flex flex-1 flex-col min-h-0 p-4 border-r border-[var(--border-color)] h-full bg-[var(--bg-secondary)]">
      <div className="flex justify-between border-b border-[var(--border-color)] mb-3">

        {/* Tabs */}
        <div className="flex gap-4 text-sm">
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
      <div className="flex flex-1 flex-col min-h-0">
        {activeTab === "Body" && (
          <CodeEditor
            language="json"
            value={responseBody}
            readOnly
          />
        )}

        {activeTab === "Headers" && (
          <div className="flex-1 min-h-0">
            <KeyValueEditor
              rows={rows}
              onChange={setRows}
              title="Response Headers"
              mode="view"
              allowAdd
              allowDelete
              allowToggle
              keyPlaceholder="Variable"
              valuePlaceholder="Value"
              emptyState="No response headers"
              rowHeight="sm"
              dense
            />
          </div>
        )}

        {activeTab === "Cookies" && (
          <div className="flex-1 min-h-0">
            <KeyValueEditor
              rows={rows}
              onChange={setRows}
              title="Cookies"
              mode="view"
              allowAdd
              allowDelete
              allowToggle
              keyPlaceholder="Variable"
              valuePlaceholder="Value"
              emptyState="No cookies"
              rowHeight="sm"
              dense
            />
          </div>
        )}

        {activeTab === "Tests" && (
          <div className="text-[var(--text-secondary)] p-2">
            {activeTab} view coming soon
          </div>
        )}
      </div>
    </div>
  );
}

