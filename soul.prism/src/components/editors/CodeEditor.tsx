"use client";

import dynamic from "next/dynamic";
import { nordTheme } from "./nordTheme";

/**
 * Client-only Monaco Editor wrapper.
 *
 * Monaco relies on browser APIs (DOM, workers) and cannot be rendered
 * during server-side rendering. The editor is therefore loaded dynamically
 * with SSR explicitly disabled.
 */
const MonacoEditor = dynamic(
  () => import("@monaco-editor/react"),
  { ssr: false }
);

/**
 * Props for {@link CodeEditor}.
 */
export type CodeEditorProps = {
  /**
   * Source code displayed in the editor.
   *
   * This value is controlled by the parent and should be updated via
   * {@link CodeEditorProps.onChange}.
   */
  value: string;

  /**
   * Language identifier used by Monaco for syntax highlighting and
   * language services (e.g. `"typescript"`, `"json"`, `"sql"`).
   */
  language: string;

  /**
   * Callback invoked when the editor contents change.
   *
   * The value may be `undefined` during certain editor lifecycle events,
   * such as initialization or model disposal.
   */
  onChange?: (value: string | undefined) => void;

  /**
   * Whether the editor should be read-only.
   *
   * When enabled, the editor remains scrollable and selectable but
   * disallows text modifications.
   *
   * @defaultValue false
   */
  readOnly?: boolean;
};

/**
 * Client-side code editor component based on Monaco.
 *
 * @remarks
 * Responsibilities:
 * - Provide a consistent, themed code editing experience
 * - Encapsulate Monaco configuration and Next.js SSR constraints
 * - Expose a minimal, controlled API for value and language selection
 *
 * The editor uses a custom Nord theme and disables nonessential UI
 * elements (such as the minimap) to remain visually lightweight.
 */
export default function CodeEditor({
  value,
  language,
  onChange,
  readOnly = false,
}: CodeEditorProps) {
  return (
    <MonacoEditor
      /**
       * Fill the available vertical space of the parent container.
       */
      height="100%"

      /**
       * Language mode used for syntax highlighting and tooling.
       */
      language={language}

      /**
       * Controlled editor value.
       */
      value={value}

      /**
       * Change handler for editor content updates.
       */
      onChange={onChange}

      /**
       * Register the custom Nord theme before the editor mounts.
       */
      beforeMount={(monaco) => {
        monaco.editor.defineTheme("nord", nordTheme);
      }}

      /**
       * Apply the registered Nord theme.
       */
      theme="nord"

      /**
       * Monaco editor configuration options.
       */
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
