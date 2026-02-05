import { KeyValueRow } from '../../editors/KeyValueEditor';

/**
 * Represents an execution environment for requests.
 *
 * @remarks
 * Environments provide scoped variables that may be interpolated
 * into request URLs, headers, and bodies at runtime.
 *
 * Variables are stored as structured key/value pairs and may be
 * selectively enabled or disabled.
 */
export interface Environment {
  /**
   * Unique identifier for the environment.
   */
  id: string;

  /**
   * Human-readable name of the environment.
   *
   * Displayed in environment selectors and editors.
   */
  name: string;

  /**
   * Variables associated with this environment.
   *
   * @remarks
   * Persisted as JSONB in Postgres. Each variable may be enabled,
   * disabled, or marked as secret.
   */
  variables: KeyValueRow[];

  /**
   * Identifier of the workspace that owns this environment.
   *
   * Environments are not shared across workspaces.
   */
  workspace_id: string;

  /**
   * ISO-8601 timestamp indicating when the environment was created.
   */
  created_at: string;
}

/**
 * Minimal payload for updating an existing environment.
 *
 * @remarks
 * This type intentionally excludes immutable and server-managed
 * fields such as `workspace_id` and `created_at`.
 */
export type EnvironmentUpdate = Pick<
  Environment,
  'id' | 'name' | 'variables'
>;
