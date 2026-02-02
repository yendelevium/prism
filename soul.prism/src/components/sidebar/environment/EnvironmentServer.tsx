import EnvSidebarClient from './EnvironmentSidebarPanel';
import { Environment } from './types';

export default async function EnvironmentServer() {
  // Mocking the database response from the Request/Trace schema
  const mockEnvironments: Environment[] = [
    {
      id: '1',
      name: 'Production',
      workspace_id: 'ws_01',
      created_at: new Date().toISOString(),
      variables: [
        { id: 'v1', key: 'API_URL', value: 'https://api.trace.com', enabled: true },
        { id: 'v2', key: 'DB_KEY', value: 'secret_hash_123', enabled: true, secret: true }
      ]
    },
    {
      id: '2',
      name: 'Staging',
      workspace_id: 'ws_01',
      created_at: new Date().toISOString(),
      variables: [
        { id: 'v3', key: 'API_URL', value: 'https://staging.trace.com', enabled: true }
      ]
    }
  ];

  return <EnvSidebarClient initialEnvironments={mockEnvironments} />;
}