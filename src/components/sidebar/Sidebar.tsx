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

export default function Sidebar() {
  const [activeSection, setActiveSection] = useState<SidebarSection>(null);

  return (
    <div className="flex h-full">
      {/* ICON BAR */}
      <aside className="flex flex-col justify-between w-14 bg-[var(--bg-secondary)] border-r border-[var(--border-color)]">
        {/* TOP ICONS */}
        <div className="flex flex-col items-center gap-3 py-3">
          <IconButton
            icon={FolderIcon}
            onClick={() => setActiveSection('Collections')}
          />
          <IconButton
            icon={GlobeAltIcon}
            onClick={() => setActiveSection('Environments')}
          />
          <IconButton
            icon={ClockIcon}
            onClick={() => setActiveSection('History')}
          />
        </div>

        {/* BOTTOM ICONS */}
        <div className="flex flex-col items-center gap-3 py-3">
          <IconButton icon={ChartBarIcon} />
          <IconButton icon={Cog6ToothIcon} />
        </div>
      </aside>

      {/* SIDEBAR EXPANSION */}
      <div className="w-64 bg-[var(--bg-panel)] border-r border-[var(--border-color)] p-4">
        {activeSection ? (
          <span className="text-[var(--text-primary)] text-sm">
            {activeSection} Sidebar Expanded
          </span>
        ) : (
          <span className="text-[var(--text-secondary)] text-sm">
            No sidebar selected
          </span>
        )}
      </div>
    </div>
  );
}