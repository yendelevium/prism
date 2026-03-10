"use client";

import React, { useState, useTransition, useEffect } from "react";
import {
  Layers,
  Plus,
  Users,
  X,
  UserPlus,
  Trash2,
  ChevronDown,
} from "lucide-react";
import {
  parseBackendWorkspace,
  Workspace,
  WorkspaceUser,
} from "@/@types/workspace";
import { createNewWorkspace } from "./WorkspaceServer";
import { toast } from "sonner";
import { useWorkspaceStore } from "@/stores/useWorkspaceStore";
import {
  createWorkspaceAction,
  deleteWorkspaceAction,
  updateWorkspaceAction,
  addUserToWorkspaceAction,
  removeUserFromWorkspaceAction,
  updateUserRoleAction,
  getWorkspaceUsersAction,
} from "@/backend/workspace/workspace.actions";
import { unwrap } from "@/@types/actionResult";
import { useSelectionStore } from "@/stores/useSelectionStore";

export function WorkspaceSidebarClient() {
  const workspaces = useWorkspaceStore((s) => s.workspaces);
  const isLoading = useWorkspaceStore((s) => s.isLoading);
  const setLoading = useWorkspaceStore((s) => s.setLoading);
  const setWorkspaces = useWorkspaceStore((s) => s.setWorkspaces);
  const setCurrentWorkspace = useSelectionStore((s) => s.setWorkspace);
  const [editingWorkspace, setEditingWorkspace] = useState<Workspace | null>(
    null,
  );
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserRole, setNewUserRole] = useState<"admin" | "editor" | "viewer">(
    "editor",
  );
  const [usersLoading, setUsersLoading] = useState(false);

  const openEditor = async (ws: Workspace) => {
    if (workspaces.find((w) => w.id === ws.id)) {
      setUsersLoading(true);
      try {
        const result = await getWorkspaceUsersAction(ws.id);
        if (result.success) {
          setEditingWorkspace({
            ...ws,
            users: result.data,
          });
        } else {
          toast.error(result.error);
        }
      } catch (err: any) {
        toast.error(err.message ?? "Failed to load users");
      }
      setUsersLoading(false);
    } else {
      setEditingWorkspace(ws);
    }
  };

  const addWorkspace = () => {
    const newWs: Workspace = {
      id: crypto.randomUUID(),
      name: "New Workspace",
      created_by: "",
      users: [],
      created_at: new Date().toISOString(),
    };

    setEditingWorkspace(newWs);
  };

  const saveChanges = async () => {
    if (!editingWorkspace || isLoading) return;

    setLoading(true);

    const exists = workspaces.find((w) => w.id === editingWorkspace.id);
    if (!exists) {
      try {
        const createdWorkspace = parseBackendWorkspace(
          unwrap(await createWorkspaceAction(editingWorkspace.name)),
        );
        setWorkspaces([createdWorkspace, ...workspaces]);
        setCurrentWorkspace(createdWorkspace);
        toast.success("Workspace Saved");
      } catch (err: any) {
        toast.error(err.message ?? "Something went wrong");
        return;
      }
    } else {
      // TODO: Implement updation for more than just names, need to include users in workspace schema
      try {
        const updatedWorkspace = parseBackendWorkspace(
          unwrap(
            await updateWorkspaceAction(
              editingWorkspace.id,
              editingWorkspace.name,
            ),
          ),
        );
        setWorkspaces(
          workspaces.map((ws) =>
            ws.id === editingWorkspace.id ? updatedWorkspace : ws,
          ),
        );
        toast.success("Successfully updated workspace");
      } catch (err: any) {
        toast.error(`Failed to update workspace: ${err.message}`);
      }
    }

    setLoading(false);

    setEditingWorkspace(null);
  };

  const deleteWorkspace = async (workspaceId: string) => {
    if (!workspaceId.trim() || isLoading) return;

    setLoading(true);

    try {
      unwrap(await deleteWorkspaceAction(workspaceId));
      toast.success("Successfully deleted workspace");
      setWorkspaces(workspaces.filter((ws) => ws.id !== workspaceId));
    } catch (err: any) {
      toast.error(`Failed to delete workspace: ${err.message}`);
    }

    setLoading(false);
  };

  const addUser = async () => {
    if (!newUserEmail.trim() || !editingWorkspace) return;
    if (editingWorkspace.users.some((u) => u.email === newUserEmail.trim())) {
      toast.error("User is already a member");
      return;
    }

    try {
      const result = unwrap(
        await addUserToWorkspaceAction(
          editingWorkspace.id,
          newUserEmail.trim(),
          newUserRole,
        ),
      );
      const newUsers = [
        ...editingWorkspace.users,
        { email: result.email, role: result.role },
      ];
      setEditingWorkspace({
        ...editingWorkspace,
        users: newUsers,
      });
      setWorkspaces(
        workspaces.map((ws) =>
          ws.id === editingWorkspace.id ? { ...ws, users: newUsers } : ws,
        ),
      );
      setNewUserEmail("");
      toast.success(`Added ${result.email} as ${result.role}`);
    } catch (err: any) {
      toast.error(err.message ?? "Failed to add user");
    }
  };

  const removeUser = async (userEmail: string) => {
    if (!editingWorkspace) return;

    try {
      unwrap(
        await removeUserFromWorkspaceAction(editingWorkspace.id, userEmail),
      );
      const newUsers = editingWorkspace.users.filter(
        (u) => u.email !== userEmail,
      );
      setEditingWorkspace({
        ...editingWorkspace,
        users: newUsers,
      });
      setWorkspaces(
        workspaces.map((ws) =>
          ws.id === editingWorkspace.id ? { ...ws, users: newUsers } : ws,
        ),
      );
      toast.success(`Removed ${userEmail}`);
    } catch (err: any) {
      toast.error(err.message ?? "Failed to remove user");
    }
  };

  const changeUserRole = async (
    userEmail: string,
    newRole: "admin" | "editor" | "viewer",
  ) => {
    if (!editingWorkspace) return;

    try {
      const result = unwrap(
        await updateUserRoleAction(editingWorkspace.id, userEmail, newRole),
      );
      const newUsers = editingWorkspace.users.map((u) =>
        u.email === userEmail ? { ...u, role: result.role } : u,
      );
      setEditingWorkspace({
        ...editingWorkspace,
        users: newUsers,
      });
      setWorkspaces(
        workspaces.map((ws) =>
          ws.id === editingWorkspace.id ? { ...ws, users: newUsers } : ws,
        ),
      );
      toast.success(`Updated role to ${result.role}`);
    } catch (err: any) {
      toast.error(err.message ?? "Failed to update role");
    }
  };

  return (
    <aside
      className="w-full h-full flex flex-col border-r select-none overflow-hidden"
      style={{
        backgroundColor: "var(--bg-primary)",
        borderColor: "var(--border-color)",
      }}
    >
      {/* Sidebar Header */}
      <div
        className="p-4 flex items-center justify-between border-b shrink-0"
        style={{ borderColor: "var(--border-color)" }}
      >
        <h2
          className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-2"
          style={{ color: "var(--text-secondary)" }}
        >
          <Layers size={12} />
          Workspaces
        </h2>

        <button
          onClick={addWorkspace}
          className="p-1 rounded hover:bg-[var(--bg-secondary)] transition-colors"
          style={{ color: "var(--accent)" }}
          aria-label="Add Workspace"
        >
          <Plus size={14} />
        </button>
      </div>

      {/* Workspace List */}
      <div className="flex-1 overflow-y-auto scrollbar-hide py-2">
        {isLoading && (
          <div className="px-4 py-6 flex items-center gap-2 text-xs text-[var(--text-secondary)]">
            <div className="h-4 w-4 border-2 border-[var(--border-color)] border-t-[var(--accent)] rounded-full animate-spin" />
            Loading workspaces…
          </div>
        )}
        {!isLoading &&
          workspaces.map((ws) => (
            <div
              key={ws.id}
              className="group mx-2 mb-1 px-3 py-2 rounded border border-transparent hover:border-[var(--border-color)] hover:bg-[var(--bg-secondary)] transition-all cursor-pointer"
            >
              <div className="flex justify-between min-w-0">
                <div
                  className="flex flex-col min-w-0"
                  onClick={() => openEditor(ws)}
                >
                  <span
                    className="text-xs font-mono tracking-tight truncate"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {ws.name}
                  </span>
                  <div className="flex items-center gap-2 mt-1 opacity-40">
                    <Users
                      size={10}
                      style={{ color: "var(--text-secondary)" }}
                    />
                    <span
                      className="text-[9px] font-mono uppercase"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      {ws.users.length} members
                    </span>
                  </div>
                </div>
                <div className="ml-auto flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteWorkspace(ws.id);
                    }}
                    className="p-1 rounded hover:bg-[var(--bg-secondary)] transition-colors"
                    style={{ color: "var(--error)" }}
                    title="Delete workspace"
                  >
                    <Trash2 size={12} />
                  </button>
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
              backgroundColor: "var(--bg-primary)",
              borderColor: "var(--border-color)",
            }}
          >
            {/* Modal Header */}
            <div
              className="flex items-center justify-between p-3 border-b"
              style={{
                backgroundColor: "var(--bg-secondary)",
                borderColor: "var(--border-color)",
              }}
            >
              <input
                autoFocus
                className="bg-transparent text-sm font-mono font-bold text-[var(--accent)] outline-none border-b border-transparent focus:border-[var(--accent)] px-1"
                value={editingWorkspace.name}
                onChange={(e) =>
                  setEditingWorkspace({
                    ...editingWorkspace,
                    name: e.target.value,
                  })
                }
              />
              <span
                className="text-[10px] uppercase font-bold tracking-tighter opacity-50"
                style={{ color: "var(--text-secondary)" }}
              >
                Workspace Settings
              </span>
            </div>

            {/* Modal Content */}
            <div className="p-4 space-y-4">
              {/* User Management */}
              <div className="flex flex-col gap-2">
                <label
                  className="text-[9px] uppercase font-bold opacity-40"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Manage Access
                </label>

                {/* Add User Input */}
                <div className="flex gap-2">
                  <input
                    className="flex-1 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded px-2 py-1 text-xs font-mono outline-none focus:border-[var(--accent)]"
                    placeholder="user@example.com"
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addUser()}
                  />
                  <select
                    className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded px-2 py-1 text-xs font-mono outline-none focus:border-[var(--accent)]"
                    value={newUserRole}
                    onChange={(e) =>
                      setNewUserRole(
                        e.target.value as "admin" | "editor" | "viewer",
                      )
                    }
                  >
                    <option value="editor">Editor</option>
                    <option value="viewer">Viewer</option>
                    <option value="admin">Admin</option>
                  </select>
                  <button
                    type="button"
                    onClick={addUser}
                    className="p-1.5 rounded bg-[var(--bg-secondary)] border border-[var(--border-color)] hover:text-[var(--accent)] transition-colors"
                  >
                    <UserPlus size={14} />
                  </button>
                </div>

                {/* Users List */}
                <div className="max-h-40 overflow-y-auto border border-[var(--border-color)] rounded bg-[var(--bg-secondary)]/30">
                  {usersLoading ? (
                    <div className="p-2 flex items-center justify-center">
                      <div className="h-4 w-4 border-2 border-[var(--border-color)] border-t-[var(--accent)] rounded-full animate-spin" />
                    </div>
                  ) : editingWorkspace.users.length === 0 ? (
                    <div className="p-2 text-xs font-mono text-[var(--text-secondary)] text-center">
                      No members yet
                    </div>
                  ) : (
                    editingWorkspace.users.map((user) => (
                      <div
                        key={user.email}
                        className="flex items-center justify-between p-2 border-b last:border-0"
                        style={{ borderColor: "var(--border-color)" }}
                      >
                        <div className="flex flex-col gap-1">
                          <span className="text-xs font-mono text-[var(--text-primary)]">
                            {user.email}
                          </span>
                          <select
                            className="bg-transparent border border-[var(--border-color)] rounded px-1 py-0.5 text-[9px] font-mono outline-none"
                            value={user.role}
                            onChange={(e) =>
                              changeUserRole(
                                user.email,
                                e.target.value as "admin" | "editor" | "viewer",
                              )
                            }
                          >
                            <option value="admin">Admin</option>
                            <option value="editor">Editor</option>
                            <option value="viewer">Viewer</option>
                          </select>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeUser(user.email)}
                          className="text-[var(--text-secondary)] hover:text-[var(--error)] transition-colors"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div
              className="p-3 border-t flex justify-end gap-2"
              style={{ borderColor: "var(--border-color)" }}
            >
              <button
                onClick={() => setEditingWorkspace(null)}
                className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={saveChanges}
                className="relative flex items-center justify-center px-3 py-1 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[10px] font-bold uppercase rounded transition-all"
              >
                <span className={isLoading ? "opacity-0" : "opacity-100"}>
                  Save Changes
                </span>
                {isLoading && (
                  <div className="absolute h-4 w-4 border-2 border-[var(--border-color)] border-t-[var(--accent)] rounded-full animate-spin" />
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
