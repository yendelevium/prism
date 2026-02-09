import type { HttpMethod, Request as PrismaRequest } from "@prisma/client";

export type Request = PrismaRequest;

export interface CreateRequestInput {
  name: string;
  method: HttpMethod;
  url: string;
  headers?: Record<string, string> | null;
  body?: string | null;
  collectionId: string;
}

export interface UpdateRequestInput {
  name?: string;
  method?: HttpMethod;
  url?: string;
  headers?: Record<string, string> | null;
  body?: string | null;
}

export interface RequestResponse {
  data: Request | Request[];
}
