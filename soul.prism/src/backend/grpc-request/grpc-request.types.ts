import type { GRPCRequest as PrismaGRPCRequest } from "@prisma/client";

export type GRPCRequest = PrismaGRPCRequest;

export interface CreateGRPCRequestInput {
  name: string;
  serverAddress: string;
  service: string;
  method: string;
  protoFile: string;
  metadata?: Record<string, string> | null;
  useTls?: boolean;
  body?: string | null;
  collectionId: string;
  createdById: string;
}

export interface UpdateGRPCRequestInput {
  name?: string;
  serverAddress?: string;
  service?: string;
  method?: string;
  protoFile?: string;
  metadata?: Record<string, string> | null;
  useTls?: boolean;
  body?: string | null;
}

export interface GRPCRequestResponse {
  data: GRPCRequest | GRPCRequest[];
}
