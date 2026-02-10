"use client";

import React, { useState } from 'react';
import {
  ChevronRight,
  ChevronDown,
  Folder,
  Search,
  Plus,
  Trash2,
} from 'lucide-react';
import { CollectionItem, collectionToCollectionItem, HttpMethod, RequestItem, requestToRequestItem } from '../../../@types/collectionItem';
import { useCollectionStore } from '@/stores/useCollectionStore';
import { createCollectionAction } from '@/backend/collection/collection.actions';
import { unwrap } from '@/@types/actionResult';
import { useSelectionStore } from '@/stores/useSelectionStore';
import { toast } from 'sonner';
import { CreateRequestInput, Request } from '@/backend/request/request.types';
import { createRequestAction } from '@/backend/request/request.actions';
import { useRequestStore } from '@/stores/useRequestStore';


/**
 * Maps HTTP methods to CSS color variables.
 *
 * @remarks
 * This mapping centralizes the visual semantics of HTTP methods
 * (e.g. success, warning, error) and ensures consistent coloring
 * across the application.
 *
 * Consumers may reuse this mapping when rendering method badges,
 * labels, or request metadata elsewhere.
 */
export const methodColorMap: Record<string, string> = {
  GET: "var(--success)",
  POST: "var(--warning)",
  PUT: "var(--accent)",
  UPDATE: "var(--accent)",
  DELETE: "var(--error)",
};



/**
 * Sidebar navigation panel for browsing request collections.
 *
 * @remarks
 * Responsibilities:
 * - Render collections as expandable/collapsible folders
 * - Display requests as selectable leaf nodes
 * - Visually indicate the active request
 * - Provide affordances for future actions (add, context menu)
 *
 * This component is intentionally stateful but **UI-only**:
 * it does not perform routing, persistence, or data fetching.
 */
export const CollectionsSidebarPanel: React.FC = () => {

  const collections = useCollectionStore(s => s.collections);
  const isLoading = useCollectionStore(s => s.isLoading);
  const setCollections = useCollectionStore(s => s.setCollections);
  const currentWorkspace = useSelectionStore(s => s.workspace);
  const currentRequest = useSelectionStore(s => s.request);
  const setRequest = useSelectionStore(s => s.setRequest);
  const setRequestName = useRequestStore(s => s.setName);

  // For renaming collections
  const [editingCollectionId, setEditingCollectionId] = useState<string | null>(null);
  const [editingCollectionName, setEditingCollectionName] = useState("");

  // For renaming requests
  const [editingRequestId, setEditingRequestId] = useState<string | null>(null);
  const [editingRequestName, setEditingRequestName] = useState("");


  /**
   * Tracks which collection folders are expanded.
   *
   * The record key corresponds to a collection id.
   */
  const [expandedFolders, setExpandedFolders] = useState<
    Record<string, boolean>
  >({ 'col-1': true });

  /**
   * Toggle the expanded state of a collection folder.
   */
  const toggleFolder = (id: string) => {
    setExpandedFolders(prev => ({ ...prev, [id]: !prev[id] }));
  };

  

  const createCollection = async () => {
    
    try {
      const newCollection = unwrap(await createCollectionAction('Untitled', currentWorkspace!.id));
      const newCollectionItem = await collectionToCollectionItem(newCollection);
      setCollections([...collections, newCollectionItem]);
      toast.success("Successfully created collection");
    }
    catch (err: any) {
      toast.error(err.message);
      return;
    }
  }

  const createRequest = async (collectionId: string) => {
    try {
      // Create a blank request
      const newRequestInput = {
        body: "",
        collectionId: collectionId,
        headers: {},
        method: "GET" as HttpMethod,
        name: "Untitled",
        url: "https://prism-amrita-app.com/exampleURL",
      } as CreateRequestInput;

      const newRequest = unwrap(await createRequestAction(newRequestInput));
      toast.success("Successfully created request");

      const newRequestItem = requestToRequestItem(newRequest);
      setCollections(
        collections.map(c => 
          c.id === collectionId 
            ? { ...c, requests: [...c.requests, newRequestItem] } // Update the requests for this particular collection
            : c
        )
      );

      setExpandedFolders(prev => ({
        ...prev,
        [collectionId]: true,
      }));

      setRequest(newRequestItem);
    }
    catch (err: any) {
      toast.error(err.message);
    }
  }

  const commitRenameCollection = async (collectionId: string) => {
    const newName = editingCollectionName.trim();

    setEditingCollectionId(null);

    if (!newName) return;

    // Optimistic UI update
    setCollections(
      collections.map(c =>
        c.id === collectionId ? { ...c, name: newName } : c
      )
    );

    try {
      // await renameCollectionAction(collectionId, newName);
      toast.success("Collection renamed");
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const cancelRenameCollection = () => {
    setEditingCollectionId(null);
    setEditingCollectionName("");
  };

  const commitRenameRequest = async (requestId: string) => {
    const newName = editingRequestName.trim();

    setEditingRequestId(null);

    if (!newName) return;

    // Optimistic UI update (collection sidebar)
    setCollections(
      collections.map(col => ({
        ...col,
        requests: col.requests.map(r =>
          r.id === requestId ? { ...r, name: newName } : r
        ),
      }))
    );

    try {
      await setRequestName(newName);
      toast.success("Request renamed");
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const cancelRenameRequest = () => {
    setEditingRequestId(null);
    setEditingRequestName("");
  };



  return (
    <aside
      className="w-full h-full flex flex-col border-r select-none transition-colors duration-300"
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
          <Folder size={12} />
          Collections
        </h2>

        {/* Add collection */}
        <button
          className="p-1 rounded hover:bg-[var(--bg-secondary)] transition-colors"
          style={{ color: 'var(--accent)' }}
          onClick={createCollection}
        >
          <Plus size={14} />
        </button>
      </div>

      {/* Search Input */}
      <div className="p-3">
        <div
          className="flex items-center px-2 py-1.5 rounded border transition-all"
          style={{
            backgroundColor: 'var(--bg-secondary)',
            borderColor: 'var(--border-color)',
          }}
        >
          <Search
            size={14}
            className="mr-2"
            style={{ color: 'var(--border-color)' }}
          />
          <input
            type="text"
            placeholder="Search..."
            className="bg-transparent text-xs w-full outline-none"
            style={{ color: 'var(--text-primary)' }}
          />
        </div>
      </div>

      {/* Navigation Tree */}
      <nav className="flex-1 overflow-y-auto pt-2 scrollbar-hide">
        {isLoading && (
          <div className="px-4 py-6 flex items-center gap-2 text-xs text-[var(--text-secondary)]">
            <div className="h-4 w-4 border-2 border-[var(--border-color)] border-t-[var(--accent)] rounded-full animate-spin" />
            Loading collections…
          </div>
        )}
        {!isLoading && (collections.map(col => (
          <div key={col.id} className="mb-1">
            {/* Collection Header */}
            <div
              onClick={() => {
                  if(editingCollectionId) return;
                  toggleFolder(col.id)
                }
              }
              onDoubleClick={(e) => {
                  e.stopPropagation();
                  setEditingCollectionId(col.id);
                  setEditingCollectionName(createCollection.name);
                }
              }
              className="group flex items-center px-4 py-1.5 hover:bg-[var(--bg-secondary)] transition-colors"
            >
              <span
                className="mr-1"
                style={{ color: 'var(--border-color)' }}
              >
                <button
                  className="mr-1 p-1 rounded cursor-pointer hover:bg-[var(--bg-secondary)] transition-colors"
                  aria-label="Toggle collection"
                >
                  {expandedFolders[col.id] ? (
                    <ChevronDown size={14} />
                  ) : (
                    <ChevronRight size={14} />
                  )}
                </button>
              </span>

              <Folder
                size={14}
                className="mr-2"
                style={{
                  color: expandedFolders[col.id]
                    ? 'var(--accent)'
                    : 'var(--border-color)',
                }}
              />

              {editingCollectionId === col.id ? (
                <input
                  autoFocus
                  value={editingCollectionName}
                  onChange={(e) => setEditingCollectionName(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      commitRenameCollection(col.id);
                    }
                    if (e.key === "Escape") {
                      cancelRenameCollection();
                    }
                  }}
                  onBlur={() => commitRenameCollection(col.id)}
                  className="text-sm flex-1 bg-transparent outline-none border-none px-1"
                  style={{ color: 'var(--text-primary)' }}
                />
              ) : (
                <span
                  className="text-sm truncate flex-1"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {col.name}
                </span>
              )}


              {/* Actions */}
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {/* Create request */}
                <button
                  onClick={(e) => {
                      e.stopPropagation();
                      createRequest(col.id);
                    }
                  }
                  className="p-1 rounded cursor-pointer hover:bg-[var(--bg-secondary)] transition-colors"
                  style={{ color: 'var(--accent)' }}
                  title="Add request"
                >
                  <Plus size={12} />
                </button>

                {/* Delete collection */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    // TODO: add delete functionality for collections
                  }}
                  className="p-1 rounded cursor-pointer hover:bg-[var(--bg-secondary)] transition-colors"
                  style={{ color: 'var(--error)' }}
                  title="Delete collection"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>

            {/* Requests */}
            {expandedFolders[col.id] && (
              <div
                className="ml-6 border-l"
                style={{ borderColor: 'var(--border-color)' }}
              >
                {col.requests.map(req => (
                  <div
                    key={req.id}
                    onClick={() => {
                      if (editingRequestId) return;
                      setRequest(req); // Selection Store
                    }}
                    onDoubleClick={(e) => {
                      e.stopPropagation();
                      setEditingRequestId(req.id);
                      setEditingRequestName(req.name);
                    }}
                    className={`
                      flex items-center py-1.5 pl-4 pr-3 cursor-pointer transition-all border-l-2
                      ${
                        currentRequest?.id === req.id
                          ? 'bg-[var(--bg-panel)] border-[var(--accent)]'
                          : 'border-transparent hover:bg-[var(--bg-secondary)]'
                      }
                    `}
                  >

                    {/* HTTP method */}
                    <span
                      className="text-[9px] font-bold w-10 shrink-0"
                      style={{
                        color:
                          methodColorMap[
                            req.method.toUpperCase()
                          ] || 'var(--text-secondary)',
                      }}
                    >
                      {req.method.toUpperCase()}
                    </span>

                    {/* Request name */}
                    {editingRequestId === req.id ? (
                      <input
                        autoFocus
                        value={editingRequestName}
                        onChange={(e) => setEditingRequestName(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            commitRenameRequest(req.id);
                          }
                          if (e.key === "Escape") {
                            cancelRenameRequest();
                          }
                        }}
                        onBlur={() => commitRenameRequest(req.id)}
                        className="text-xs bg-transparent outline-none border-none flex-1"
                        style={{ color: 'var(--text-primary)' }}
                      />
                    ) : (
                      <span
                        className="text-xs truncate"
                        style={{
                          color:
                            currentRequest?.id === req.id
                              ? 'var(--text-primary)'
                              : 'var(--text-secondary)',
                        }}
                      >
                        {req.name}
                      </span>
                    )}

                  </div>
                ))}
              </div>
            )}
          </div>
        )))}
      </nav>
    </aside>
  );
};

export default CollectionsSidebarPanel;
