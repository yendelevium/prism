'use client';

import { useState } from 'react';
import Dropdown from '@/components/common/Dropdown';
import { UserCircleIcon } from '@heroicons/react/24/solid';
import IconButton from '../common/IconButton';

export default function Topbar() {
  const [protocol, setProtocol] = useState<'REST' | 'GraphQL' | 'gRPC'>('REST');
  const [collection, setCollection] = useState('Collection 1');
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
          options={['REST', 'GraphQL', 'gRPC']}
          onChange={(v) => setProtocol(v as 'REST' | 'GraphQL' | 'gRPC')}
        />

        {/* Current Collection */}
        <Dropdown
          label="Collection"
          value={collection}
          options={[
            'Collection 1',
            'Collection 2',
            'Collection 3',
            'Collection 4',
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
        <IconButton icon={UserCircleIcon} />
      </div>
    </header>
  );
}