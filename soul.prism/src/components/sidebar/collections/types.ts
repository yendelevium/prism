export type HttpMethod = 'GET' | 'POST' | 'DELETE' | 'PUT' | 'PATCH';

export interface RequestItem {
  id: string;
  name: string;
  method: HttpMethod;
  url: string;
  headers: Record<string, string>;
  body: string;
  collection_id: string;
}

export interface Collection {
  id: string;
  name: string;
  workspace_id: string;
  requests: RequestItem[];
}