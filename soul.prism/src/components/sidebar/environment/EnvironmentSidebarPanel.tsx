'use client';

import React, { useState } from 'react';
import { Settings2, Plus, Trash2, Globe } from 'lucide-react';
import { KeyValueEditor, KeyValueRow } from '../../editors/KeyValueEditor';
import { Environment } from './types';

type Props = {
  initialEnvironments: Environment[];
};

export default function EnvSidebarClient({ initialEnvironments }: Props) {
  const [envs, setEnvs] = useState<Environment[]>(initialEnvironments);
  const [editingEnv, setEditingEnv] = useState<Environment | null>(null);

  // TODO: change workspace_id to be derived from current workspace
  const addEnvironment = () => {
    const newEnv: Environment = {
      id: crypto.randomUUID(),
      name: 'New Environment',
      variables: [],
      workspace_id: 'default', // Ideally passed from context
      created_at: new Date().toISOString(),
    };
    setEnvs([newEnv, ...envs]);
    setEditingEnv(newEnv); // Open editor immediately
  };

  const deleteEnvironment = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setEnvs(envs.filter(env => env.id !== id));
  };

  const handleUpdateVariables = (newRows: KeyValueRow[]) => {
    if (!editingEnv) return;
    setEditingEnv({ ...editingEnv, variables: newRows });
  };

  const saveChanges = () => {
    if (!editingEnv) return;
    setEnvs(prev => prev.map(e => e.id === editingEnv.id ? editingEnv : e));
    setEditingEnv(null);
  };

  return (
    <aside 
      className="w-full h-full flex flex-col border-r select-none overflow-hidden"
      style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-color)' }}
    >
      {/* Header */}
      <div className="p-4 flex items-center justify-between border-b shrink-0" style={{ borderColor: 'var(--border-color)' }}>
        <h2 className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
          <Globe size={12} />
          Environments
        </h2>
        <button 
          onClick={addEnvironment}
          className="p-1 rounded hover:bg-[var(--bg-secondary)] transition-colors"
          style={{ color: 'var(--accent)' }}
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
          envs.map((env) => (
            <div
              key={env.id}
              onClick={() => setEditingEnv(env)}
              className="group mx-2 mb-1 px-3 py-2 rounded border border-transparent hover:border-[var(--border-color)] hover:bg-[var(--bg-secondary)] transition-all cursor-pointer"
            >
              <div className="flex justify-between items-center">
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-mono tracking-tight truncate" style={{ color: 'var(--text-primary)' }}>
                    {env.name}
                  </span>
                  <span className="text-[9px] font-mono opacity-40 uppercase" style={{ color: 'var(--text-secondary)' }}>
                    {env.variables.length} Variables
                  </span>
                </div>
                
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    className="p-1 text-[var(--text-secondary)] hover:text-[var(--accent)]"
                    title="Edit Environment"
                  >
                    <Settings2 size={12} />
                  </button>
                  <button 
                    onClick={(e) => deleteEnvironment(e, env.id)}
                    className="p-1 text-[var(--text-secondary)] hover:text-[var(--error)]"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal / Popup Editor */}
      {editingEnv && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#2E3440]/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-lg border shadow-2xl overflow-hidden" style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-color)' }}>
            <div className="flex items-center justify-between p-3 border-b" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}>
              <input 
                autoFocus
                className="bg-transparent text-sm font-mono font-bold text-[var(--accent)] outline-none border-b border-transparent focus:border-[var(--accent)] px-1"
                value={editingEnv.name}
                onChange={(e) => setEditingEnv({...editingEnv, name: e.target.value})}
              />
              <span className="text-[10px] uppercase font-bold tracking-tighter opacity-50" style={{ color: 'var(--text-secondary)' }}>
                Env Editor
              </span>
            </div>
            
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

            <div className="p-3 border-t flex justify-end gap-2" style={{ borderColor: 'var(--border-color)' }}>
              <button 
                onClick={() => setEditingEnv(null)}
                className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={saveChanges}
                className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded transition-all"
                style={{ backgroundColor: 'var(--accent)', color: 'var(--bg-primary)' }}
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