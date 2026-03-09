"use client";

import { useState } from "react";
import CodeEditor from "@/components/editors/CodeEditor";
import { KeyValueEditor, KeyValueRow } from "../editors/KeyValueEditor";
import { useRequestStore } from "@/stores/useRequestStore";
import { Check } from "lucide-react";

const tabs = ["Query", "Variables", "Headers"];

export default function GraphQLRequestEditor() {
  const [activeTab, setActiveTab] = useState("Query");
  const graphql = useRequestStore((s) => s.graphql);
  const isLoading = useRequestStore((s) => s.isLoading);
  const setGraphQLField = useRequestStore((s) => s.setGraphQLField);

  return (
    <div className="flex flex-1 flex-col min-h-0 p-4 border-r border-[var(--border-color)] h-full bg-[var(--bg-secondary)]">
      {/* Tabs */}
      <div className="flex gap-4 justify-between text-sm border-b border-[var(--border-color)] mb-3">
        <div className="flex gap-4 text-sm">
          {tabs.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => {
                setActiveTab(tab);
                console.log("[UI]", "GRAPHQL_TAB_CHANGED", { tab });
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
        {activeTab === "Query" && (
          <CodeEditor
            language="graphql"
            value={graphql.query}
            onChange={(value) => {
              setGraphQLField({ query: value ?? "" });
            }}
          />
        )}

        {activeTab === "Variables" && (
          <CodeEditor
            language="json"
            value={graphql.variables}
            onChange={(value) => {
              setGraphQLField({ variables: value ?? "{}" });
            }}
          />
        )}

        {activeTab === "Headers" && (
          <div className="flex-1 min-h-0">
            <KeyValueEditor
              rows={graphql.headers}
              onChange={(headers) => setGraphQLField({ headers })}
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
      </div>
    </div>
  );
}
