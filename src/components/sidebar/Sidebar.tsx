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
import EnvironmentSidebarPanel from './EnvironmentSidebarPanel';

type SidebarSection = 'Collections' | 'Environments' | 'History' | null;

export default function Sidebar() {
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
          {activeSection === 'Environments' && (
            <EnvironmentSidebarPanel />
          )}

          {activeSection === 'Collections' && (
            <span className="text-sm text-[var(--text-primary)]">
              Collections Sidebar Expanded
            </span>
          )}

          {activeSection === 'History' && (
            <span className="text-sm text-[var(--text-primary)]">
              History Sidebar Expanded
            </span>
          )}

          {!activeSection && (
            <span className="text-sm text-[var(--text-secondary)]">
              No sidebar selected
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
