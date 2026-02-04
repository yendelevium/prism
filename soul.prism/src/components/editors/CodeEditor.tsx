"use client";

import dynamic from "next/dynamic";
import { nordTheme } from "./nordTheme";

const MonacoEditor = dynamic(
  () => import("@monaco-editor/react"),
  { ssr: false }
);

export type CodeEditorProps = {
  value: string;
  language: string;
  onChange?: (value: string | undefined) => void;
  readOnly?: boolean;
};

export default function CodeEditor({
  value,
  language,
  onChange,
  readOnly = false,
}: CodeEditorProps) {
  return (
    <MonacoEditor
      height="100%"
      language={language}
      value={value}
      onChange={onChange}
      beforeMount={(monaco) => {  monaco.editor.defineTheme("nord", nordTheme);  }}
      theme="nord"
      options={{
        readOnly,
        minimap: { enabled: false },
        fontSize: 13,
        lineNumbers: "on",
        scrollBeyondLastLine: false,
        wordWrap: "on",
        smoothScrolling: true,
      }}
    />
  );
}
