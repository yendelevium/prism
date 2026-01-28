'use client';

import { useState } from 'react';
import {
  DocumentTextIcon,
  ChartBarSquareIcon,
} from '@heroicons/react/24/outline';
import IconButton from '../common/IconButton';

type BottomView = 'logs' | 'gantt';

export default function BottomPanel() {
  const [activeView, setActiveView] = useState<BottomView>('logs');

  return (
    <div className="flex flex-col h-full border-t border-l-1 border-[var(--border-color)]">
      {/* SWITCHER BAR */}
      <div className="flex items-center gap-2 px-2 h-11 bg-[var(--bg-panel)]">
        <IconButton
          icon={DocumentTextIcon}
          variant={activeView === 'logs' ? 'active' : 'default'}
          onClick={() => setActiveView('logs')}
        />
        <IconButton
          icon={ChartBarSquareIcon}
          variant={activeView === 'gantt' ? 'active' : 'default'}
          onClick={() => setActiveView('gantt')}
        />
      </div>

      {/* VIEWER */}
      <div className="flex-1 min-h-0 bg-[var(--bg-secondary)] p-4">
        {activeView === 'logs' && (
          <span className="text-sm text-[var(--text-primary)]">
            Log Viewer Displayed
          </span>
        )}

        {activeView === 'gantt' && (
          <span className="text-sm text-[var(--text-primary)]">
            Gantt Chart Viewer Displayed
          </span>
        )}
      </div>
    </div>
  );
}