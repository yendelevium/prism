"use client";

import { useState } from "react";
import CodeEditor from "@/components/editors/CodeEditor";
import { KeyValueEditor, KeyValueRow } from "../editors/KeyValueEditor";
import { useRequestStore } from "@/stores/useRequestStore";
import { Check } from "lucide-react";

const tabs = ["Service", "Proto", "Metadata", "Body"];

export default function GRPCRequestEditor() {
  const [activeTab, setActiveTab] = useState("Service");
  const grpc = useRequestStore((s) => s.grpc);
  const isLoading = useRequestStore((s) => s.isLoading);
  const setGRPCField = useRequestStore((s) => s.setGRPCField);

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
                console.log("[UI]", "GRPC_TAB_CHANGED", { tab });
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
        {activeTab === "Service" && (
          <div className="flex-1 flex items-center justify-center text-[var(--text-secondary)] text-sm">
            <div className="text-center">
              <p>Service and method are configured above</p>
              <p className="mt-1 text-xs">
                Enter service name and method in the input fields
              </p>
            </div>
          </div>
        )}

        {activeTab === "Proto" && (
          <CodeEditor
            language="protobuf"
            value={grpc.protoFile}
            onChange={(value) => {
              setGRPCField({ protoFile: value ?? "" });
            }}
          />
        )}

        {activeTab === "Metadata" && (
          <div className="flex-1 min-h-0">
            <KeyValueEditor
              rows={grpc.metadata}
              onChange={(metadata) => setGRPCField({ metadata })}
              title="Metadata (Headers)"
              allowAdd
              allowDelete
              allowToggle
              keyPlaceholder="Key"
              valuePlaceholder="Value"
              emptyState="No metadata"
              rowHeight="sm"
              dense
            />
          </div>
        )}

        {activeTab === "Body" && (
          <CodeEditor
            language="json"
            value={grpc.body}
            onChange={(value) => {
              setGRPCField({ body: value ?? "" });
            }}
          />
        )}
      </div>
    </div>
  );
}
