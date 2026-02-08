'use client';

import React, { useState, useEffect } from 'react';
import {
  Settings2,
  Plus,
  Trash2,
  Globe,
  Star,
} from 'lucide-react';
import { useEnvironment } from '../../context/EnvironmentContext';
import {
  KeyValueEditor,
  KeyValueRow,
} from '../../editors/KeyValueEditor';
import { Environment } from './types';

/**
 * Props for {@link EnvSidebarClient}.
 */
export type EnvironmentSidebarProps = {
  /**
   * Initial list of environments available in the workspace.
   *
   * These values are copied into local state on mount and are not
   * mutated directly.
   */
  initialEnvironments: Environment[];
};

/**
 * Sidebar panel for managing request environments.
 *
 * @remarks
 * Responsibilities:
 * - Display a list of environments scoped to the current workspace
 * - Allow creating and deleting environments
 * - Provide a modal editor for environment variables
 *
 * This component is intentionally client-only and stateful.
 * Persistence and workspace context are expected to be handled
 * by a higher-level coordinator.
 */
export function EnvSidebarClient({
  initialEnvironments,
}: EnvironmentSidebarProps) {
  /**
   * Local environment state.
   *
   * Acts as a working copy of the provided environments until
   * changes are explicitly saved.
   */
  const [envs, setEnvs] = useState<Environment[]>(
    initialEnvironments
  );

  /**
   * Currently edited environment.
   *
   * When non-null, the modal editor is displayed.
   */
  const [editingEnv, setEditingEnv] =
    useState<Environment | null>(null);

  const [activeEnvId, setActiveEnvId] = useState<string | null>(
    initialEnvironments.length > 0 ? initialEnvironments[0].id : null
  );

  const { setVariables } = useEnvironment();

  // Sync active environment variables to context
  useEffect(() => {
    const active = envs.find(e => e.id === activeEnvId);
    const vars: Record<string, string> = {};

    if (active) {
      active.variables.forEach(row => {
        if (row.enabled !== false && row.key) {
          vars[row.key] = row.value;
        }
      });
    }

    console.log('[ENV] Setting variables:', { activeEnvId, vars, activeEnvName: active?.name });
    setVariables(vars);
  }, [activeEnvId, envs, setVariables]);

  /**
   * Create and open a new environment.
   *
   * @remarks
   * Workspace scoping is currently hardcoded and should eventually
   * be derived from workspace context.
   */
  const addEnvironment = () => {
    const newEnv: Environment = {
      id: crypto.randomUUID(),
      name: 'New Environment',
      variables: [],
      workspace_id: 'default', // TODO: derive from workspace context
      created_at: new Date().toISOString(),
    };

    setEnvs([newEnv, ...envs]);
    setEditingEnv(newEnv);
  };

  /**
   * Remove an environment by id.
   *
   * Click propagation is stopped to avoid triggering edit mode.
   */
  const deleteEnvironment = (
    e: React.MouseEvent,
    id: string
  ) => {
    e.stopPropagation();
    setEnvs(envs.filter(env => env.id !== id));
  };

  /**
   * Update variables for the currently edited environment.
   *
   * Changes are staged locally until explicitly saved.
   */
  const handleUpdateVariables = (
    newRows: KeyValueRow[]
  ) => {
    if (!editingEnv) return;
    setEditingEnv({
      ...editingEnv,
      variables: newRows,
    });
  };

  /**
   * Persist staged changes to the environment list.
   *
   * Closes the modal editor after saving.
   */
  const saveChanges = () => {
    if (!editingEnv) return;

    setEnvs(prev =>
      prev.map(env =>
        env.id === editingEnv.id ? editingEnv : env
      )
    );

    setEditingEnv(null);
  };

  return (
    <aside
      className="w-full h-full flex flex-col border-r select-none overflow-hidden"
      style={{
        backgroundColor: 'var(--bg-primary)',
        borderColor: 'var(--border-color)',
      }}
    >
      {/* Header */}
      <div
        className="p-4 flex items-center justify-between border-b shrink-0"
        style={{ borderColor: 'var(--border-color)' }}
      >
        <h2
          className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-2"
          style={{ color: 'var(--text-secondary)' }}
        >
          <Globe size={12} />
          Environments
        </h2>

        {/* Add environment */}
        <button
          onClick={addEnvironment}
          className="p-1 rounded hover:bg-[var(--bg-secondary)] transition-colors"
          style={{ color: 'var(--accent)' }}
          aria-label='add'
        >
          <Plus size={14} />
        </button>
      </div>

      {/* Environment List */}
      <div className="flex-1 overflow-y-auto scrollbar-hide py-2">
        {envs.length === 0 ? (
          <div className="p-4 text-center text-[var(--text-secondary)] text-xs opacity-50 italic">
            No environments set
          </div>
        ) : (
          envs.map(env => (
            <div
              key={env.id}
              onClick={() => setEditingEnv(env)}
              className="group mx-2 mb-1 px-3 py-2 rounded border border-transparent hover:border-[var(--border-color)] hover:bg-[var(--bg-secondary)] transition-all cursor-pointer"
            >
              <div className="flex justify-between items-center">
                <div className="flex flex-col min-w-0">
                  <span
                    className="text-xs font-mono tracking-tight truncate"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {env.name}
                  </span>
                  <span
                    className="text-[9px] font-mono opacity-40 uppercase"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    {env.variables.length} Variables
                  </span>
                </div>

                {/* Row actions */}
                <div className="flex items-center gap-1 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveEnvId(env.id === activeEnvId ? null : env.id);
                    }}
                    className="p-1 text-[var(--text-secondary)] hover:text-[var(--accent)]"
                    title={env.id === activeEnvId ? "Deactivate Environment" : "Set Active"}
                  >
                    <Star
                      size={12}
                      fill={env.id === activeEnvId ? "currentColor" : "none"}
                      className={env.id === activeEnvId ? "text-[var(--accent)]" : ""}
                    />
                  </button>
                  <button
                    className="p-1 text-[var(--text-secondary)] hover:text-[var(--accent)]"
                    title="Edit Environment"
                  >
                    <Settings2 size={12} />
                  </button>
                  <button
                    onClick={e =>
                      deleteEnvironment(e, env.id)
                    }
                    className="p-1 text-[var(--text-secondary)] hover:text-[var(--error)]"
                    aria-label='delete'
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal Editor */}
      {editingEnv && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#2E3440]/80 backdrop-blur-sm p-4">
          <div
            className="w-full max-w-lg rounded-lg border shadow-2xl overflow-hidden"
            style={{
              backgroundColor: 'var(--bg-primary)',
              borderColor: 'var(--border-color)',
            }}
          >
            {/* Modal Header */}
            <div
              className="flex items-center justify-between p-3 border-b"
              style={{
                backgroundColor: 'var(--bg-secondary)',
                borderColor: 'var(--border-color)',
              }}
            >
              <input
                autoFocus
                className="bg-transparent text-sm font-mono font-bold text-[var(--accent)] outline-none border-b border-transparent focus:border-[var(--accent)] px-1"
                value={editingEnv.name}
                onChange={e =>
                  setEditingEnv({
                    ...editingEnv,
                    name: e.target.value,
                  })
                }
              />

              <span
                className="text-[10px] uppercase font-bold tracking-tighter opacity-50"
                style={{ color: 'var(--text-secondary)' }}
              >
                Env Editor
              </span>
            </div>

            {/* Variables */}
            <div className="h-[300px] overflow-hidden bg-[var(--bg-primary)]">
              <KeyValueEditor
                rows={editingEnv.variables}
                onChange={handleUpdateVariables}
                allowAdd
                allowDelete
                allowToggle
                keyPlaceholder="VARIABLE_NAME"
                valuePlaceholder="value"
                rowHeight="sm"
              />
            </div>

            {/* Actions */}
            <div
              className="p-3 border-t flex justify-end gap-2"
              style={{ borderColor: 'var(--border-color)' }}
            >
              <button
                onClick={() => setEditingEnv(null)}
                className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={saveChanges}
                className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded transition-all"
                style={{
                  backgroundColor: 'var(--accent)',
                  color: 'var(--bg-primary)',
                }}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}

export default EnvSidebarClient;
