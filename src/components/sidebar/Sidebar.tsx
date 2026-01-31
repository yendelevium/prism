'use client';

import { useState } from 'react';
import {
  FolderIcon,
  GlobeAltIcon,
  ClockIcon,
  ChartBarIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline';
import IconButton from '../common/IconButton';

type SidebarSection = 'Collections' | 'Environments' | 'History' | null;

export default function Sidebar( {
  collections,
  environments,
  history,
  none,
}: {
  collections: React.ReactNode;
  environments: React.ReactNode;
  history: React.ReactNode;
  none: React.ReactNode;
}) {
  const [activeSection, setActiveSection] = useState<SidebarSection>(null);

  return (
    <div className="flex h-full">
      {/* ICON BAR */}
      <aside className="flex w-14 flex-col justify-between bg-[var(--bg-secondary)] border-r border-[var(--border-color)]">
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
            icon={ClockIcon}
            onClick={() => setActiveSection('History')}
            variant={activeSection === 'History' ? 'active' : 'default'}
          />
        </div>

        <div className="flex flex-col items-center gap-3 py-3">
          <IconButton icon={ChartBarIcon} />
          <IconButton icon={Cog6ToothIcon} />
        </div>
      </aside>

      {/* SIDEBAR EXPANSION */}
      <div className="w-64 bg-[var(--bg-panel)] border-r border-[var(--border-color)] p-3">
        <div className="h-full min-h-0">
          {activeSection === 'Environments' && environments}

          {activeSection === 'Collections' && collections}

          {activeSection === 'History' && history}

          {!activeSection && none}
        </div>
      </div>
    </div>
  );
}
