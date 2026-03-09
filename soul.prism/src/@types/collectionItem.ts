import { Collection } from "@/backend/collection/collection.types";
import { unwrap } from "./actionResult";
import { Request } from "@/backend/request/request.types";
import { GraphQLRequest } from "@/backend/graphql-request/graphql-request.types";
import { GRPCRequest } from "@/backend/grpc-request/grpc-request.types";
import { getRequestsByCollectionAction } from "@/backend/request/request.actions";
import { getGraphQLRequestsByCollectionAction } from "@/backend/graphql-request/graphql-request.actions";
import { getGRPCRequestsByCollectionAction } from "@/backend/grpc-request/grpc-request.actions";
import {
  KeyValueRow,
  objectToRows,
  urlToKeyValueRows,
} from "@/components/editors/KeyValueEditor";
import { JsonValue } from "@prisma/client/runtime/client";

export type HttpMethod = "GET" | "POST" | "DELETE" | "PUT" | "PATCH";

export type Protocol = "REST" | "GRAPHQL" | "GRPC";

export type AnyRequestItem = RequestItem | GraphQLRequestItem | GRPCRequestItem;

export interface RequestItem {
  id: string;
  name: string;
  method: HttpMethod;
  url: string;
  params: KeyValueRow[];
  headers: KeyValueRow[];
  body: string;
  collection_id: string;
}

export interface GraphQLRequestItem {
  id: string;
  name: string;
  url: string;
  query: string;
  variables: string | null;
  operationName: string | null;
  headers: KeyValueRow[];
  collection_id: string;
}

export interface GRPCRequestItem {
  id: string;
  name: string;
  serverAddress: string;
  service: string;
  method: string;
  protoFile: string;
  metadata: KeyValueRow[];
  useTls: boolean;
  body: string | null;
  collection_id: string;
}

export interface CollectionItem {
  id: string;
  name: string;
  workspace_id: string;
  requests: RequestItem[];
  graphqlRequests: GraphQLRequestItem[];
  grpcRequests: GRPCRequestItem[];
}

export const requestToRequestItem = (request: Request) => {
  return {
    body: request.body,
    collection_id: request.collectionId,
    headers: objectToRows(
      request.headers ? (request.headers as Record<string, string>) : {},
    ),
    params: urlToKeyValueRows(request.url),
    id: request.id,
    method: request.method,
    name: request.name,
    url: request.url,
  } as RequestItem;
};

export const graphqlRequestToGraphQLRequestItem = (request: GraphQLRequest) => {
  return {
    id: request.id,
    name: request.name,
    url: request.url,
    query: request.query,
    variables: request.variables,
    operationName: request.operationName,
    headers: objectToRows(
      request.headers ? (request.headers as Record<string, string>) : {},
    ),
    collection_id: request.collectionId,
  } as GraphQLRequestItem;
};

export const grpcRequestToGRPCRequestItem = (request: GRPCRequest) => {
  return {
    id: request.id,
    name: request.name,
    serverAddress: request.serverAddress,
    service: request.service,
    method: request.method,
    protoFile: request.protoFile,
    metadata: objectToRows(
      request.metadata ? (request.metadata as Record<string, string>) : {},
    ),
    useTls: request.useTls,
    body: request.body,
    collection_id: request.collectionId,
  } as GRPCRequestItem;
};

export const collectionToCollectionItem = async (collection: Collection) => {
  const restRequests = unwrap(
    await getRequestsByCollectionAction(collection.id),
  );
  const graphqlRequests = unwrap(
    await getGraphQLRequestsByCollectionAction(collection.id),
  );
  const grpcRequests = unwrap(
    await getGRPCRequestsByCollectionAction(collection.id),
  );

  return {
    id: collection.id,
    name: collection.name,
    requests: restRequests.map((r) => requestToRequestItem(r)),
    graphqlRequests: graphqlRequests.map((r) =>
      graphqlRequestToGraphQLRequestItem(r),
    ),
    grpcRequests: grpcRequests.map((r) => grpcRequestToGRPCRequestItem(r)),
    workspace_id: collection.workspaceId,
  } as CollectionItem;
};
