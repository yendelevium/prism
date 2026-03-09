import type { GraphQLRequest as PrismaGraphQLRequest } from "@prisma/client";

export type GraphQLRequest = PrismaGraphQLRequest;

export interface CreateGraphQLRequestInput {
  name: string;
  url: string;
  query: string;
  variables?: string | null;
  operationName?: string | null;
  headers?: Record<string, string> | null;
  collectionId: string;
  createdById: string;
}

export interface UpdateGraphQLRequestInput {
  name?: string;
  url?: string;
  query?: string;
  variables?: string | null;
  operationName?: string | null;
  headers?: Record<string, string> | null;
}

export interface GraphQLRequestResponse {
  data: GraphQLRequest | GraphQLRequest[];
}
