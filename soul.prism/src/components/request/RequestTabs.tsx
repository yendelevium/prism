"use client";

import { useState } from "react";
import CodeEditor from "@/components/editors/CodeEditor";
import {
  KeyValueEditor,
  KeyValueRow,
  objectToRows,
  rowsToObject,
} from "../editors/KeyValueEditor";
import { useRequestStore } from "@/stores/useRequestStore";
import { Check } from "lucide-react";
import GraphQLRequestEditor from "./GraphQLRequestEditor";
import GRPCRequestEditor from "./GRPCRequestEditor";

const restTabs = ["Params", "Headers", "Body", "Auth", "Tests"];

export default function RequestTabs() {
  const protocol = useRequestStore((s) => s.protocol);
  const rest = useRequestStore((s) => s.rest);
  const isLoading = useRequestStore((s) => s.isLoading);
  const setRestField = useRequestStore((s) => s.setRestField);

  const [activeTab, setActiveTab] = useState("Params");

  if (protocol === "GRAPHQL") {
    return <GraphQLRequestEditor />;
  }

  if (protocol === "GRPC") {
    return <GRPCRequestEditor />;
  }

  return (
    <div data-testid="request-builder-panel" className="flex flex-1 flex-col min-h-0 p-4 border-r border-[var(--border-color)] h-full bg-[var(--bg-secondary)]">
      {/* Tabs */}
      <div className="flex gap-4 justify-between text-sm border-b border-[var(--border-color)] mb-3">
        <div className="flex gap-4 text-sm">
          {restTabs.map((tab) => (
            <button
              key={tab}
              data-testid={`tab-${tab.toLowerCase()}`}
              type="button"
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
        <div>
          {isLoading && (
            <div className="h-4 w-4 border-2 border-[var(--border-color)] border-t-[var(--accent)] rounded-full animate-spin" />
          )}
          {!isLoading && <Check stroke="#88C0D0" />}
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col min-h-0">
        {activeTab === "Body" && (
          <div data-testid="body-editor" className="flex-1 min-h-0">
            <CodeEditor
              language="json"
              value={rest.body ?? ""}
              onChange={(body) => {
                setRestField({ body: body ?? "" });
              }}
            />
          </div>
        )}

        {activeTab === "Params" && (
          <div className="flex-1 min-h-0">
            <KeyValueEditor
              rows={rest.params}
              onChange={(params) => setRestField({ params })}
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
              testidPrefix="header"
              rows={rest.headers}
              onChange={(headers) => setRestField({ headers })}
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
