'use client';

import React, { useState } from 'react';
import {
  Layers,
  Plus,
  Users,
  X,
  UserPlus,
  Trash2,
} from 'lucide-react';
import { Workspace, WorkspaceSidebarProps } from './types';


export function WorkspaceSidebarClient({
  initialWorkspaces,
}: WorkspaceSidebarProps) {
  const [workspaces, setWorkspaces] = useState<Workspace[]>(initialWorkspaces);
  const [editingWorkspace, setEditingWorkspace] = useState<Workspace | null>(null);
  const [newUserEmail, setNewUserEmail] = useState('');

  const addWorkspace = () => {
    const newWs: Workspace = {
      id: crypto.randomUUID(),
      name: 'New Workspace',
      created_by: 'Current User', // In production, get from auth context
      users: [],
      created_at: new Date().toISOString(),
    };
    setEditingWorkspace(newWs);
  };

  const saveChanges = () => {
    if (!editingWorkspace) return;
    
    setWorkspaces(prev => {
      const exists = prev.find(w => w.id === editingWorkspace.id);
      if (exists) {
        return prev.map(w => w.id === editingWorkspace.id ? editingWorkspace : w);
      }
      return [editingWorkspace, ...prev];
    });
    
    setEditingWorkspace(null);
  };

  const addUser = () => {
    if (!newUserEmail.trim() || !editingWorkspace) return;
    if (editingWorkspace.users.includes(newUserEmail)) return;

    setEditingWorkspace({
      ...editingWorkspace,
      users: [...editingWorkspace.users, newUserEmail.trim()],
    });
    setNewUserEmail('');
  };

  const removeUser = (userToRemove: string) => {
    if (!editingWorkspace) return;
    setEditingWorkspace({
      ...editingWorkspace,
      users: editingWorkspace.users.filter(u => u !== userToRemove),
    });
  };

  return (
    <aside
      className="w-full h-full flex flex-col border-r select-none overflow-hidden"
      style={{
        backgroundColor: 'var(--bg-primary)',
        borderColor: 'var(--border-color)',
      }}
    >
      {/* Sidebar Header */}
      <div
        className="p-4 flex items-center justify-between border-b shrink-0"
        style={{ borderColor: 'var(--border-color)' }}
      >
        <h2
          className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-2"
          style={{ color: 'var(--text-secondary)' }}
        >
          <Layers size={12} />
          Workspaces
        </h2>

        <button
          onClick={addWorkspace}
          className="p-1 rounded hover:bg-[var(--bg-secondary)] transition-colors"
          style={{ color: 'var(--accent)' }}
          aria-label="Add Workspace"
        >
          <Plus size={14} />
        </button>
      </div>

      {/* Workspace List */}
      <div className="flex-1 overflow-y-auto scrollbar-hide py-2">
        {workspaces.map(ws => (
          <div
            key={ws.id}
            onClick={() => setEditingWorkspace(ws)}
            className="group mx-2 mb-1 px-3 py-2 rounded border border-transparent hover:border-[var(--border-color)] hover:bg-[var(--bg-secondary)] transition-all cursor-pointer"
          >
            <div className="flex flex-col min-w-0">
              <span
                className="text-xs font-mono tracking-tight truncate"
                style={{ color: 'var(--text-primary)' }}
              >
                {ws.name}
              </span>
              <div className="flex items-center gap-2 mt-1 opacity-40">
                 <Users size={10} style={{ color: 'var(--text-secondary)' }} />
                 <span className="text-[9px] font-mono uppercase" style={{ color: 'var(--text-secondary)' }}>
                  {ws.users.length} members
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Editor */}
      {editingWorkspace && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#2E3440]/80 backdrop-blur-sm p-4">
          <div
            className="w-full max-w-md rounded-lg border shadow-2xl overflow-hidden"
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
                value={editingWorkspace.name}
                onChange={e => setEditingWorkspace({...editingWorkspace, name: e.target.value})}
              />
              <span className="text-[10px] uppercase font-bold tracking-tighter opacity-50" style={{ color: 'var(--text-secondary)' }}>
                Workspace Settings
              </span>
            </div>

            {/* Modal Content */}
            <div className="p-4 space-y-4">
              {/* Meta Info */}
              <div className="flex flex-col gap-1">
                <label className="text-[9px] uppercase font-bold opacity-40" style={{ color: 'var(--text-secondary)' }}>Created By</label>
                <span className="text-xs font-mono" style={{ color: 'var(--text-primary)' }}>{editingWorkspace.created_by}</span>
              </div>

              {/* User Management */}
              <div className="flex flex-col gap-2">
                <label className="text-[9px] uppercase font-bold opacity-40" style={{ color: 'var(--text-secondary)' }}>Manage Access</label>
                
                {/* Add User Input */}
                <div className="flex gap-2">
                  <input 
                    className="flex-1 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded px-2 py-1 text-xs font-mono outline-none focus:border-[var(--accent)]"
                    placeholder="user@example.com"
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addUser()}
                  />
                  <button 
                    onClick={addUser}
                    className="p-1.5 rounded bg-[var(--bg-secondary)] border border-[var(--border-color)] hover:text-[var(--accent)] transition-colors"
                  >
                    <UserPlus size={14} />
                  </button>
                </div>

                {/* Users List */}
                <div className="max-h-40 overflow-y-auto border border-[var(--border-color)] rounded bg-[var(--bg-secondary)]/30">
                  {editingWorkspace.users.map(user => (
                    <div key={user} className="flex items-center justify-between p-2 border-b last:border-0" style={{ borderColor: 'var(--border-color)' }}>
                      <span className="text-xs font-mono text-[var(--text-primary)]">{user}</span>
                      <button 
                        onClick={() => removeUser(user)}
                        className="text-[var(--text-secondary)] hover:text-[var(--error)] transition-colors"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="p-3 border-t flex justify-end gap-2" style={{ borderColor: 'var(--border-color)' }}>
              <button
                onClick={() => setEditingWorkspace(null)}
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
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}