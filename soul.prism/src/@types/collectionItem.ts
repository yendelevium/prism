import { Collection } from "@/backend/collection/collection.types";
import { unwrap } from "./actionResult";
import { Request } from "@/backend/request/request.types";
import { getRequestsByCollectionAction } from "@/backend/request/request.actions";
import { KeyValueRow, objectToRows, urlToKeyValueRows } from "@/components/editors/KeyValueEditor";
import { JsonValue } from "@prisma/client/runtime/client";

/**
 * Supported HTTP methods for request execution.
 *
 * @remarks
 * This union is intentionally restrictive to enforce method
 * normalization across the application. Values are always
 * uppercase and map directly to wire-level HTTP verbs.
 */
export type HttpMethod =
  | 'GET'
  | 'POST'
  | 'DELETE'
  | 'PUT'
  | 'PATCH';

/**
 * Represents a single HTTP request definition.
 *
 * @remarks
 * A request is a reusable, named operation that belongs to a
 * {@link CollectionItem} and may be executed against an external API.
 */
export interface RequestItem {
  /**
   * Unique identifier for the request.
   */
  id: string;

  /**
   * Human-readable name of the request.
   *
   * Displayed in navigation trees and editors.
   */
  name: string;

  /**
   * HTTP method used when executing the request.
   */
  method: HttpMethod;

  /**
   * Fully qualified or relative request URL.
   *
   * Environment variable interpolation may be applied at runtime.
   */
  url: string;

  /**
   * Search params associated with the request.
   */
  params: KeyValueRow[];

  /**
   * HTTP headers associated with the request.
   *
   * Keys should be treated as case-insensitive, though they are
   * stored as provided.
   */
  headers: KeyValueRow[];

  /**
   * Raw request body payload.
   *
   * The interpretation of this field depends on the request
   * content type (e.g. JSON, form-data, plain text).
   */
  body: string;

  /**
   * Identifier of the collection this request belongs to.
   *
   * Used for grouping and navigation purposes.
   */
  collection_id: string;
}

/**
 * Logical grouping of related HTTP requests.
 *
 * @remarks
 * Collections are rendered as folders in the UI and are scoped
 * to a specific workspace.
 */
export interface CollectionItem {
  /**
   * Unique identifier for the collection.
   */
  id: string;

  /**
   * Display name of the collection.
   */
  name: string;

  /**
   * Identifier of the workspace that owns this collection.
   */
  workspace_id: string;

  /**
   * Requests contained within this collection.
   */
  requests: RequestItem[];
}


export const requestToRequestItem = (request: Request) => {
  return {
    body: request.body,
    collection_id: request.collectionId,
    headers: objectToRows(request.headers ? request.headers as Record<string, string> : {}),
    params: urlToKeyValueRows(request.url),
    id: request.id,
    method: request.method,
    name: request.name,
    url: request.url,
  } as RequestItem;
}

export const collectionToCollectionItem = async (collection: Collection) => {
  return {
    id: collection.id,
    name: collection.name,
    requests: unwrap(await getRequestsByCollectionAction(collection.id)).map(c => requestToRequestItem(c)),
    workspace_id: collection.workspaceId
  } as CollectionItem;
}
