"use client";

import React, { useState } from 'react';
import { ChevronRight, ChevronDown, Folder, Search, Plus, MoreHorizontal } from 'lucide-react';
import { Collection, RequestItem, HttpMethod } from './types';

interface Props {
  collections: Collection[];
}

// Map HTTP methods to CSS variables for dynamic coloring
const methodColorMap: Record<string, string> = {
  GET: "var(--success)",
  POST: "var(--warning)",
  PUT: "var(--accent)",
  UPDATE: "var(--accent)",
  DELETE: "var(--error)",
};

const CollectionsSidebarPanel: React.FC<Props> = ({ collections }) => {
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({ 'col-1': true });
  const [activeReqId, setActiveReqId] = useState<string | null>(null);

  const toggleFolder = (id: string) => {
    setExpandedFolders(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <aside 
      className="w-full h-full flex flex-col border-r select-none transition-colors duration-300"
      style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-color)' }}
    >
      {/* Header */}
      <div className="p-4 flex items-center justify-between border-b shrink-0" style={{ borderColor: 'var(--border-color)' }}>
        <h2 className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
          <Folder size={12} />
          Collections
        </h2>
        <button 
          className="p-1 rounded hover:bg-[var(--bg-secondary)] transition-colors"
          style={{ color: 'var(--accent)' }}
        >
          <Plus size={14} />
        </button>
      </div>

      {/* Search Input */}
      <div className="p-3">
        <div 
          className="flex items-center px-2 py-1.5 rounded border transition-all"
          style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}
        >
          <Search size={14} className="mr-2" style={{ color: 'var(--border-color)' }} />
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
        {collections.map((col) => (
          <div key={col.id} className="mb-1">
            {/* Collection Header */}
            <div 
              onClick={() => toggleFolder(col.id)}
              className="group flex items-center px-4 py-1.5 cursor-pointer hover:bg-[var(--bg-secondary)] transition-colors"
            >
              <span className="mr-1" style={{ color: 'var(--border-color)' }}>
                {expandedFolders[col.id] ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </span>
              <Folder 
                size={14} 
                className="mr-2" 
                style={{ color: expandedFolders[col.id] ? 'var(--accent)' : 'var(--border-color)' }} 
              />
              <span className="text-sm truncate flex-1" style={{ color: 'var(--text-primary)' }}>
                {col.name}
              </span>
              <MoreHorizontal 
                size={14} 
                className="opacity-0 group-hover:opacity-100 transition-opacity" 
                style={{ color: 'var(--border-color)' }}
              />
            </div>

            {/* Requests (Child elements) */}
            {expandedFolders[col.id] && (
              <div className="ml-6 border-l" style={{ borderColor: 'var(--border-color)' }}>
                {col.requests.map((req) => (
                  <div 
                    key={req.id}
                    onClick={() => setActiveReqId(req.id)}
                    className={`
                      flex items-center py-1.5 pl-4 pr-3 cursor-pointer transition-all border-l-2
                      ${activeReqId === req.id 
                        ? 'bg-[var(--bg-panel)] border-[var(--accent)]' 
                        : 'border-transparent hover:bg-[var(--bg-secondary)]'
                      }
                    `}
                  >
                    <span 
                      className="text-[9px] font-bold w-10 shrink-0"
                      style={{ color: methodColorMap[req.method.toUpperCase()] || 'var(--text-secondary)' }}
                    >
                      {req.method.toUpperCase()}
                    </span>
                    <span 
                      className="text-xs truncate"
                      style={{ color: activeReqId === req.id ? 'var(--text-primary)' : 'var(--text-secondary)' }}
                    >
                      {req.name}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>
    </aside>
  );
};

export default CollectionsSidebarPanel;