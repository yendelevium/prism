import { KeyValueRow } from '../../editors/KeyValueEditor';

export interface Environment {
  id: string;
  name: string;
  variables: KeyValueRow[]; // Stored as JSONB in Postgres
  workspace_id: string;
  created_at: string;
}

export type EnvironmentUpdate = Pick<Environment, 'id' | 'name' | 'variables'>;