import { WorkspaceSidebarClient } from './WorkspaceSidebarPanel';
import { Workspace } from './types';

export default async function WorkspaceServer() {
  // Mocking the database response from the Request/Trace schema
  const mockWorkspaces: Workspace[] = [
    {
      id: '1',
      name: 'Workspace 1',
      users: [
        'user 2',
        'user 3'
      ],
      created_by: 'user 1',
      created_at: new Date().toISOString(),
    },
    {
      id: '2',
      name: 'Workspace 2',
      users: [
      ],
      created_by: 'user 2',
      created_at: new Date().toISOString(),
    },
  ];

  return <WorkspaceSidebarClient initialWorkspaces={mockWorkspaces} />;
}