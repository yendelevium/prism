"use client";

import { useState } from "react";
import { useRequestStore } from "@/stores/useRequestStore";
import CodeEditor from "@/components/editors/CodeEditor";
import ResponseInfo from "./ResponseInfo";
import {
  KeyValueEditor,
  KeyValueRow,
  objectToRows,
} from "../editors/KeyValueEditor";
import { useEffect } from "react";
import { Clipboard, Copy, Save } from "lucide-react";
import { toast } from "sonner";
import xmlFormatter from "xml-formatter";

const tabs = ["Body", "Headers", "Cookies", "Tests"];

/**
 * Helper to detect MIME types
 * @param headers
 * @param body
 * @returns
 */
function detectLanguage(
  headers: Record<string, string> | undefined,
  body: string | null,
): string {
  const contentType =
    headers?.["content-type"] || headers?.["Content-Type"] || "";

  if (contentType.includes("application/json")) return "json";
  if (contentType.includes("text/html")) return "html";
  if (contentType.includes("application/xml")) return "xml";
  if (contentType.includes("text/xml")) return "xml";
  if (contentType.includes("text/css")) return "css";
  if (contentType.includes("javascript")) return "javascript";
  if (contentType.includes("text/plain")) return "plaintext";

  // Fallback: try JSON parse
  if (body) {
    try {
      JSON.parse(body);
      return "json";
    } catch {
      return "plaintext";
    }
  }

  return "plaintext";
}

export function formatBody(language: string, body: string | null): string {
  if (!body) return "";

  try {
    if (language === "json") {
      return JSON.stringify(JSON.parse(body), null, 2);
    }

    if (language === "xml") {
      return xmlFormatter(body, {
        indentation: "  ", // 2 spaces
        collapseContent: true,
        lineSeparator: "\n",
      });
    }

    return body;
  } catch {
    // If parsing fails, return original body
    return body;
  }
}

export default function ResponsePanel() {
  const [activeTab, setActiveTab] = useState("Body");
  const response = useRequestStore((s) => s.response);
  const isExecuting = useRequestStore((s) => s.isExecuting);
  const [highlight, setHighlight] = useState(false);
  const [copied, setCopied] = useState(false);

  const language = detectLanguage(response.headers, response.body);
  const formattedBody = formatBody(language, response.body);

  async function handleCopy() {
    try {
      let textToCopy = "";

      if (activeTab === "Body") {
        textToCopy = response.body ?? "";
      }

      if (activeTab === "Headers") {
        textToCopy = JSON.stringify(response.headers, null, 2);
      }

      if (activeTab === "Cookies") {
        textToCopy = "Cookies not implemented yet";
      }

      await navigator.clipboard.writeText(textToCopy);

      toast.success("Copied to clipboard");

      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch (err) {
      toast.error("Failed to copy");
      console.error("Copy failed", err);
    }
  }

  useEffect(() => {
    // if isExecuting changes to false i.e, finished executing
    if (isExecuting === false) {
      setHighlight(true);
      const t = setTimeout(() => setHighlight(false), 600);
      return () => clearTimeout(t);
    }
  }, [isExecuting]);

  if (response.status === null) {
    return (
      <div className="flex flex-1 items-center justify-center p-4 border-r border-[var(--border-color)] h-full bg-[var(--bg-secondary)]">
        <div className="flex flex-1 p-2 items-center justify-center h-full bg-[var(--bg-primary)]">
          <span className="text-sm text-[var(--text-secondary)]">
            Send a request to see the response
          </span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`flex flex-1 flex-col min-h-0 p-4 border-r h-full border-[var(--border-color)]
        transition-colors duration-500
        ${highlight ? "bg-[var(--bg-highlight)]" : "bg-[var(--bg-secondary)]"}
      `}
    >
      <div className="flex justify-between border-b border-[var(--border-color)] mb-3">
        {/* Tabs */}
        <div className="flex gap-4 text-sm">
          {tabs.map((tab) => (
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

        <div className="flex items-start gap-3">
          <button
            onClick={handleCopy}
            disabled={isExecuting || copied}
            className={`text-xs px-2 py-1
                ${isExecuting ? "opacity-50 cursor-not-allowed" : "hover:bg-[var(--bg-primary)]"}
            `}
          >
            <Clipboard size={16} stroke="#88C0D0" />
          </button>

          <ResponseInfo
            statusCode={response.status}
            responseTime={response.time}
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col min-h-0 opacity-70 select-text">
        {activeTab === "Body" && (
          <CodeEditor
            language={language}
            value={formattedBody}
            readOnly
            autoFormatOnExternalChange
          />
        )}

        {activeTab === "Headers" && (
          <div className="flex-1 min-h-0">
            <KeyValueEditor
              rows={objectToRows(response.headers)}
              onChange={() => {}}
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
              rows={[]}
              onChange={() => {}}
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
