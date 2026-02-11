'use client';

import { useState } from 'react';
import {
  FolderIcon,
  GlobeAltIcon,
  ClockIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import IconButton from '../common/IconButton';
import { Layers } from 'lucide-react';
import { useRouter } from 'next/navigation';

export type SidebarSection = 'Collections' | 'Environments' | 'Workspaces' | 'History' | null;

export default function Sidebar( {
  collections,
  environments,
  workspaces,
  history,
  none,
}: {
  collections: React.ReactNode;
  environments: React.ReactNode;
  workspaces: React.ReactNode;
  history: React.ReactNode;
  none: React.ReactNode;
}) {
  const [activeSection, setActiveSection] = useState<SidebarSection>(null);
  const router = useRouter();

  return (
    <div className="flex h-full overflow-hidden">
      {/* ICON BAR */}
      <aside className="flex w-14 shrink-0 flex-col justify-between bg-[var(--bg-secondary)] border-r border-[var(--border-color)] z-20">
        <div className="flex flex-col items-center gap-3 py-3">
          <IconButton
            icon={FolderIcon}
            onClick={() => setActiveSection('Collections')}
            variant={activeSection === 'Collections' ? 'active' : 'default'}
          />
          <IconButton
            icon={GlobeAltIcon}
            onClick={() => setActiveSection('Environments')}
            variant={activeSection === 'Environments' ? 'active' : 'default'}
          />
          <IconButton
            icon={Layers}
            onClick={() => setActiveSection('Workspaces')}
            variant={activeSection === 'Workspaces' ? 'active' : 'default'}
          />
          <IconButton
            icon={ClockIcon}
            onClick={() => setActiveSection('History')}
            variant={activeSection === 'History' ? 'active' : 'default'}
          />
        </div>

        <div className="flex flex-col items-center gap-3 py-3">
          <IconButton
            icon={ChartBarIcon}
            onClick={() => router.push('/analytics')}
          />
          <IconButton icon={Cog6ToothIcon} />
        </div>
      </aside>

      {/* SIDEBAR EXPANSION */}
      {/* We use a dynamic width and transition-all. 
          When activeSection is null, width is 0 and it's hidden.
      */}
      <div 
        className={`
          h-full bg-[var(--bg-panel)] border-[var(--border-color)]
          transition-all duration-300 ease-in-out overflow-hidden
          ${activeSection ? 'w-64 border-r' : 'w-0 border-r-0'}
        `}
      >
        <div className="flex flex-col h-full p-3 w-64"> 
          {/* Internal wrapper has fixed w-64 to prevent text-warping during animation */}
          
          {/* Close Button Header */}
          <div className="flex justify-between items-center mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
              {activeSection}
            </span>
            <button 
              onClick={() => setActiveSection(null)}
              className="p-1 rounded hover:bg-[var(--bg-secondary)] text-[var(--text-secondary)] transition-colors"
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto">

            {activeSection === 'Collections' && collections}
            
            {activeSection === 'Environments' && environments}

            {activeSection === 'Workspaces' && workspaces}

            {activeSection === 'History' && history}

            {!activeSection && none}
          </div>
        </div>
      </div>
    </div>
  );
}