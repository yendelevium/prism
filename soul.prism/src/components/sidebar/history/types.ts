/**
 * Represents a single entry in the request execution history.
 *
 * @remarks
 * History items are immutable snapshots captured at the moment
 * a request is executed. They are intended for display and
 * inspection only, not re-execution.
 */
export type HistoryItem = {
  /**
   * Unique identifier for the history entry.
   */
  id: string;

  /**
   * HTTP method used for the request.
   */
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';

  /**
   * Final resolved request URL at execution time.
   *
   * @remarks
   * Environment variables should already be interpolated before
   * this value is stored.
   */
  url: string;

  /**
   * ISO-8601 timestamp indicating when the request was executed.
   */
  timestamp: string;
};
