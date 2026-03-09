"use client";

import { unwrap } from "@/@types/actionResult";
import {
  requestToRequestItem,
  graphqlRequestToGraphQLRequestItem,
  grpcRequestToGRPCRequestItem,
  AnyRequestItem,
  RequestItem,
  GraphQLRequestItem,
  GRPCRequestItem,
  Protocol,
} from "@/@types/collectionItem";
import { getCollectionByIdAction } from "@/backend/collection/collection.actions";
import { getRequestByIdAction } from "@/backend/request/request.actions";
import { getGraphQLRequestByIdAction } from "@/backend/graphql-request/graphql-request.actions";
import { getGRPCRequestByIdAction } from "@/backend/grpc-request/grpc-request.actions";
import { useCollectionStore } from "@/stores/useCollectionStore";
import { useRequestStore } from "@/stores/useRequestStore";
import { useSelectionStore } from "@/stores/useSelectionStore";
import { useEffect } from "react";
import { toast } from "sonner";

export function RequestDetailsSync() {
  const request = useSelectionStore((s) => s.request);
  const collections = useCollectionStore((s) => s.collections);
  const setCollection = useSelectionStore((s) => s.setCollection);
  const setLoading = useRequestStore((s) => s.setLoading);
  const setRequest = useRequestStore((s) => s.setRequest);
  const setGraphQLRequest = useRequestStore((s) => s.setGraphQLRequest);
  const setGRPCRequest = useRequestStore((s) => s.setGRPCRequest);
  const setProtocol = useRequestStore((s) => s.setProtocol);

  useEffect(() => {
    if (!request) {
      return;
    }

    const loadRequest = async () => {
      try {
        setLoading(true);

        // Find which collection contains this request and determine its type
        let requestType: Protocol = "REST";
        let collectionId: string | null = null;

        // Check REST requests
        for (const col of collections) {
          const restReq = col.requests.find((r) => r.id === request.id);
          if (restReq) {
            requestType = "REST";
            collectionId = col.id;
            break;
          }
          const gqlReq = col.graphqlRequests.find((r) => r.id === request.id);
          if (gqlReq) {
            requestType = "GRAPHQL";
            collectionId = col.id;
            break;
          }
          const grpcReq = col.grpcRequests.find((r) => r.id === request.id);
          if (grpcReq) {
            requestType = "GRPC";
            collectionId = col.id;
            break;
          }
        }

        setProtocol(requestType);

        if (requestType === "REST") {
          const raw = unwrap(await getRequestByIdAction(request.id));
          const requestItem = requestToRequestItem(raw!);
          setRequest(requestItem);
          if (collectionId) {
            setCollection(
              collections.find((c) => c.id === collectionId) ?? null,
            );
          }
        } else if (requestType === "GRAPHQL") {
          const raw = unwrap(await getGraphQLRequestByIdAction(request.id));
          const requestItem = graphqlRequestToGraphQLRequestItem(raw!);
          setGraphQLRequest(requestItem);
          if (collectionId) {
            setCollection(
              collections.find((c) => c.id === collectionId) ?? null,
            );
          }
        } else if (requestType === "GRPC") {
          const raw = unwrap(await getGRPCRequestByIdAction(request.id));
          const requestItem = grpcRequestToGRPCRequestItem(raw!);
          setGRPCRequest(requestItem);
          if (collectionId) {
            setCollection(
              collections.find((c) => c.id === collectionId) ?? null,
            );
          }
        }

        setLoading(false);
      } catch (err: any) {
        toast.error(`Could not load that request: ${err.message}`);
        return;
      }
    };

    loadRequest();
  }, [
    request?.id,
    collections,
    setRequest,
    setGraphQLRequest,
    setGRPCRequest,
    setLoading,
    setCollection,
    setProtocol,
  ]);

  return null;
}
