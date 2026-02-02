import CollectionsSidebarPanel from './CollectionsSidebarPanel';
import { Collection } from './types';

export default async function CollectionsServer() {
  const sampleCollections: Collection[] = [
    {
      id: 'col-1',
      name: 'User Management',
      workspace_id: 'ws-1',
      requests: [
        { id: 'req-1', name: 'Get All Users', method: 'GET', url: '/users', headers: {}, body: '', collection_id: 'col-1' },
        { id: 'req-2', name: 'Create Admin', method: 'POST', url: '/users', headers: {}, body: '', collection_id: 'col-1' },
      ]
    },
    {
      id: 'col-2',
      name: 'Analytics API',
      workspace_id: 'ws-1',
      requests: [
        { id: 'req-3', name: 'Fetch Metrics', method: 'GET', url: '/metrics', headers: {}, body: '', collection_id: 'col-2' },
        { id: 'req-4', name: 'Purge Logs', method: 'DELETE', url: '/logs', headers: {}, body: '', collection_id: 'col-2' },
      ]
    }
  ];

  return <CollectionsSidebarPanel collections={sampleCollections} />;
}