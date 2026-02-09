"use client";

import { useState } from "react";
import CodeEditor from "@/components/editors/CodeEditor";
import { KeyValueEditor, KeyValueRow, objectToRows, rowsToObject } from "../editors/KeyValueEditor";
import { useRequestStore } from "@/stores/useRequestStore";

const tabs = ["Params", "Headers", "Body", "Auth", "Tests"];

export default function RequestTabs() {
  const [activeTab, setActiveTab] = useState("Params");
  const params = useRequestStore(s => s.params);
  const headers = useRequestStore(s => s.headers);
  const body = useRequestStore(s => s.body);
  const setParams = useRequestStore(s => s.setParams);
  const setHeaders = useRequestStore(s => s.setHeaders);
  const setBody = useRequestStore(s => s.setBody);

  return (
    <div className="flex flex-1 flex-col min-h-0 p-4 border-r border-[var(--border-color)] h-full bg-[var(--bg-secondary)]">
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
      <div className="flex flex-1 flex-col min-h-0">
        {activeTab === "Body" && (
          <CodeEditor
            language="json"
            value={body ?? ""}
            onChange={(body) => {
              setBody(body ?? "");
            }}
          />
        )}

        {activeTab === "Params" && (
          <div className="flex-1 min-h-0">
            <KeyValueEditor
              rows={objectToRows(params)}
              onChange={(rows) => {
                setParams(rowsToObject(rows));
              }}
              title="Query Parameters"
              allowAdd
              allowDelete
              allowToggle
              keyPlaceholder="Variable"
              valuePlaceholder="Value"
              emptyState="No query parameters"
              rowHeight="sm"
              dense
            />
          </div>
        )}


        {activeTab === "Headers" && (
          <div className="flex-1 min-h-0">
            <KeyValueEditor
              rows={objectToRows(headers)}
              onChange={(rows) => {
                setHeaders(rowsToObject(rows))
              }}
              title="Request Headers"
              allowAdd
              allowDelete
              allowToggle
              keyPlaceholder="Variable"
              valuePlaceholder="Value"
              emptyState="No request headers"
              rowHeight="sm"
              dense
            />
          </div>
        )}



        {(activeTab === "Auth" || activeTab === "Tests") && (
          <div className="text-[var(--text-secondary)] p-2">
            {activeTab} editor coming soon
          </div>
        )}
      </div>
    </div>
  );
}
