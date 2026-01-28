'use client';

import { useState } from 'react';
import Dropdown from '@/components/common/Dropdown';
import { UserCircleIcon } from '@heroicons/react/16/solid';

export default function Topbar() {
  const [protocol, setProtocol] = useState<'HTTP' | 'HTTPS'>('HTTP');
  const [collection, setCollection] = useState('User Service');
  const [env, setEnv] = useState('Development');

  return (
    <header className="flex items-center justify-between h-14 px-4 border-[var(--border-color)] bg-[var(--bg-primary)]">
      {/* LEFT SIDE */}
      <div className="flex items-center gap-4">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-red-500" />
        </div>
      </div>

      <div className="flex items-center gap-2 justify-between">
        {/* Protocol Switcher */}
        <Dropdown
          label="Protocol"
          value={protocol}
          options={['HTTP', 'HTTPS']}
          onChange={(v) => setProtocol(v as 'HTTP' | 'HTTPS')}
        />

        {/* Current Collection */}
        <Dropdown
          label="Collection"
          value={collection}
          options={[
            'User Service',
            'Payments API',
            'Analytics',
            'Internal Tools',
          ]}
          onChange={setCollection}
        />

        {/* Environment Selector */}
        <Dropdown
          label="Env"
          value={env}
          options={['Development', 'Staging', 'Production']}
          onChange={setEnv}
        />
      </div>

      {/* RIGHT SIDE */}
      <div className="flex items-center">
        {/* Account Button */}
        <button className="flex items-center gap-2 px-1 py-1 rounded-full bg-[var(--accent)] hover:bg-[var(--accent-hover)]">
          <UserCircleIcon className="w-8 h-8" />
        </button>
      </div>
    </header>
  );
}