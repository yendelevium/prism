'use client';

import { useState } from 'react';
import Dropdown from '@/components/common/Dropdown';
import { UserCircleIcon } from '@heroicons/react/24/solid';
import IconButton from '../common/IconButton';
import { useWorkspaceStore } from '@/stores/useWorkspaceStore';
import { useSelectionStore } from '@/stores/useSelectionStore';

type Protocol = 'REST' | 'GraphQL' | 'gRPC';

export default function Topbar() {
  const [protocol, setProtocol] = useState<Protocol>('REST');
  const workspaces = useWorkspaceStore(s => s.workspaces);
  const currentWorkspace = useSelectionStore(s => s.workspace);
  const setCurrentWorkspace = useSelectionStore(s => s.setWorkspace);
  const [env, setEnv] = useState('Development');

  return (
    <header className="flex items-center justify-between h-14 px-4 border-[var(--border-color)] bg-[var(--bg-primary)]">
      {/* LEFT SIDE */}
      <div className="flex items-center gap-4">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full overflow-clip">
            <img src={"/prism_logo_1.jpg"} />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 justify-between">
        {/* Protocol Switcher */}
        <Dropdown
          label="Protocol"
          value={protocol}
          options={["REST", "GraphQL", "gRPC"].map(protocol => ({
            value: protocol as Protocol,
            label: protocol,
          }))}
          onChange={(v) => setProtocol(v)}
        />

        {/* Current Workspace */}
        <Dropdown
          label="Workspace"
          value={currentWorkspace?.id ?? ""}
          options={workspaces.map(ws => ({
            value: ws.id,
            label: ws.name,
          }))}
          onChange={(newWsId) => setCurrentWorkspace(workspaces.find(w => w.id === newWsId) ?? null)}
        />

        {/* Environment Selector */}
        <Dropdown
          label="Env"
          value={env}
          options={['Development', 'Staging', 'Production'].map(env => ({
            value: env,
            label: env
          }))}
          onChange={setEnv}
        />
      </div>

      {/* RIGHT SIDE */}
      <div className="flex items-center">
        {/* Account Button */}
        <IconButton icon={UserCircleIcon} />
      </div>
    </header>
  );
}