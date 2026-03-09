"use client";

import React, { useState } from "react";
import {
  ChevronRight,
  ChevronDown,
  Folder,
  Search,
  Plus,
  Trash2,
} from "lucide-react";
import {
  CollectionItem,
  collectionToCollectionItem,
  HttpMethod,
  RequestItem,
  GraphQLRequestItem,
  GRPCRequestItem,
  AnyRequestItem,
  requestToRequestItem,
  graphqlRequestToGraphQLRequestItem,
  grpcRequestToGRPCRequestItem,
} from "../../../@types/collectionItem";
import { useCollectionStore } from "@/stores/useCollectionStore";
import {
  createCollectionAction,
  deleteCollectionAction,
  updateCollectionAction,
} from "@/backend/collection/collection.actions";
import { unwrap } from "@/@types/actionResult";
import { useSelectionStore } from "@/stores/useSelectionStore";
import { toast } from "sonner";
import { CreateRequestInput, Request } from "@/backend/request/request.types";
import {
  createRequestAction,
  deleteRequestAction,
} from "@/backend/request/request.actions";
import {
  createGraphQLRequestAction,
  deleteGraphQLRequestAction,
} from "@/backend/graphql-request/graphql-request.actions";
import {
  createGRPCRequestAction,
  deleteGRPCRequestAction,
} from "@/backend/grpc-request/grpc-request.actions";
import { useRequestStore } from "@/stores/useRequestStore";
import { UpdateCollectionInput } from "@/backend/collection/collection.types";

export const methodColorMap: Record<string, string> = {
  GET: "var(--success)",
  POST: "var(--warning)",
  PUT: "var(--accent)",
  UPDATE: "var(--accent)",
  DELETE: "var(--error)",
};

export const protocolColorMap: Record<string, string> = {
  REST: "var(--success)",
  GRAPHQL: "#A855F7",
  GRPC: "var(--accent)",
};

export const CollectionsSidebarPanel: React.FC = () => {
  const collections = useCollectionStore((s) => s.collections);
  const isLoading = useCollectionStore((s) => s.isLoading);
  const setLoading = useCollectionStore((s) => s.setLoading);
  const setCollections = useCollectionStore((s) => s.setCollections);
  const currentWorkspace = useSelectionStore((s) => s.workspace);
  const currentRequest = useSelectionStore((s) => s.request);
  const setRequest = useSelectionStore((s) => s.setRequest);
  const setRequestName = useRequestStore((s) => s.setName);
  const setProtocol = useRequestStore((s) => s.setProtocol);

  const setRequestStore = useRequestStore((s) => s.setRequest);
  const setGraphQLRequestStore = useRequestStore((s) => s.setGraphQLRequest);
  const setGRPCRequestStore = useRequestStore((s) => s.setGRPCRequest);

  const [editingCollectionId, setEditingCollectionId] = useState<string | null>(
    null,
  );
  const [editingCollectionName, setEditingCollectionName] = useState("");

  const [editingRequestId, setEditingRequestId] = useState<string | null>(null);
  const [editingRequestName, setEditingRequestName] = useState("");

  const [isLoadingRequest, setLoadingRequest] = useState<boolean>(false);

  const [expandedFolders, setExpandedFolders] = useState<
    Record<string, boolean>
  >({ "col-1": true });

  const [showProtocolMenu, setShowProtocolMenu] = useState<string | null>(null);

  const toggleFolder = (id: string) => {
    setExpandedFolders((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const createCollection = async () => {
    setLoading(true);
    try {
      const newCollection = unwrap(
        await createCollectionAction("Untitled", currentWorkspace!.id),
      );
      const newCollectionItem = await collectionToCollectionItem(newCollection);
      setCollections([...collections, newCollectionItem]);
      toast.success("Successfully created collection");
    } catch (err: any) {
      toast.error(err.message);
    }
    setLoading(false);
    return;
  };

  const createRequest = async (collectionId: string) => {
    setLoadingRequest(true);
    try {
      const newRequestInput = {
        body: "",
        collectionId: collectionId,
        headers: {},
        method: "GET" as HttpMethod,
        name: "Untitled",
        url: "https://prism-amrita-app.com/exampleURL",
      } as CreateRequestInput;

      const newRequest = unwrap(await createRequestAction(newRequestInput));
      toast.success("Successfully created request");

      const newRequestItem = requestToRequestItem(newRequest);
      setCollections(
        collections.map((c) =>
          c.id === collectionId
            ? { ...c, requests: [...c.requests, newRequestItem] }
            : c,
        ),
      );

      setExpandedFolders((prev) => ({
        ...prev,
        [collectionId]: true,
      }));

      setProtocol("REST");
      setRequest(newRequestItem);
    } catch (err: any) {
      toast.error(err.message);
    }
    setLoadingRequest(false);
    setShowProtocolMenu(null);
  };

  const createGraphQLRequest = async (collectionId: string) => {
    setLoadingRequest(true);
    try {
      const newRequestInput = {
        name: "Untitled",
        url: "https://api.example.com/graphql",
        query: "{\n\t\n}",
        variables: null,
        operationName: null,
        headers: {},
        collectionId: collectionId,
        createdById: "", // Actually set in the backend
      };

      const newRequest = unwrap(
        await createGraphQLRequestAction(newRequestInput),
      );
      toast.success("Successfully created GraphQL request");

      const newRequestItem = graphqlRequestToGraphQLRequestItem(newRequest);
      setCollections(
        collections.map((c) =>
          c.id === collectionId
            ? { ...c, graphqlRequests: [...c.graphqlRequests, newRequestItem] }
            : c,
        ),
      );

      setExpandedFolders((prev) => ({
        ...prev,
        [collectionId]: true,
      }));

      setProtocol("GRAPHQL");
      setRequest(newRequestItem);
    } catch (err: any) {
      toast.error(err.message);
    }
    setLoadingRequest(false);
    setShowProtocolMenu(null);
  };

  const createGRPCRequest = async (collectionId: string) => {
    setLoadingRequest(true);
    try {
      const newRequestInput = {
        name: "Untitled",
        serverAddress: "localhost:50051",
        service: "Protobuf",
        method: "SampleMethod",
        protoFile: "Enter your .proto file contents here...",
        metadata: {},
        useTls: false,
        body: null,
        collectionId: collectionId,
        createdById: "", // Actually set by backend
      };

      const newRequest = unwrap(await createGRPCRequestAction(newRequestInput));
      toast.success("Successfully created gRPC request");

      const newRequestItem = grpcRequestToGRPCRequestItem(newRequest);
      setCollections(
        collections.map((c) =>
          c.id === collectionId
            ? { ...c, grpcRequests: [...c.grpcRequests, newRequestItem] }
            : c,
        ),
      );

      setExpandedFolders((prev) => ({
        ...prev,
        [collectionId]: true,
      }));

      setProtocol("GRPC");
      setRequest(newRequestItem);
    } catch (err: any) {
      toast.error(err.message);
    }
    setLoadingRequest(false);
    setShowProtocolMenu(null);
  };

  const commitRenameCollection = async (collectionId: string) => {
    const newName = editingCollectionName.trim();

    setEditingCollectionId(null);

    if (!newName) return;

    setCollections(
      collections.map((c) =>
        c.id === collectionId ? { ...c, name: newName } : c,
      ),
    );

    try {
      await updateCollectionAction(collectionId, {
        name: newName,
      } as UpdateCollectionInput);
      toast.success("Collection renamed");
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const cancelRenameCollection = () => {
    setEditingCollectionId(null);
    setEditingCollectionName("");
  };

  const commitRenameRequest = async (requestId: string) => {
    const newName = editingRequestName.trim();

    setEditingRequestId(null);

    if (!newName) return;

    setCollections(
      collections.map((col) => ({
        ...col,
        requests: col.requests.map((r) =>
          r.id === requestId ? { ...r, name: newName } : r,
        ),
        graphqlRequests: col.graphqlRequests.map((r) =>
          r.id === requestId ? { ...r, name: newName } : r,
        ),
        grpcRequests: col.grpcRequests.map((r) =>
          r.id === requestId ? { ...r, name: newName } : r,
        ),
      })),
    );

    try {
      setRequestName(newName);
      toast.success("Request renamed");
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const cancelRenameRequest = () => {
    setEditingRequestId(null);
    setEditingRequestName("");
  };

  const deleteRequest = async (requestId: string) => {
    // Find which collection and type contains this request
    let requestType: "REST" | "GRAPHQL" | "GRPC" = "REST";

    for (const col of collections) {
      if (col.requests.find((r) => r.id === requestId)) {
        requestType = "REST";
        break;
      }
      if (col.graphqlRequests.find((r) => r.id === requestId)) {
        requestType = "GRAPHQL";
        break;
      }
      if (col.grpcRequests.find((r) => r.id === requestId)) {
        requestType = "GRPC";
        break;
      }
    }

    // Optimistic update
    if (requestType === "REST") {
      setCollections(
        collections.map((col) => ({
          ...col,
          requests: col.requests.filter((r) => r.id !== requestId),
        })),
      );
    } else if (requestType === "GRAPHQL") {
      setCollections(
        collections.map((col) => ({
          ...col,
          graphqlRequests: col.graphqlRequests.filter(
            (r) => r.id !== requestId,
          ),
        })),
      );
    } else {
      setCollections(
        collections.map((col) => ({
          ...col,
          grpcRequests: col.grpcRequests.filter((r) => r.id !== requestId),
        })),
      );
    }

    if (currentRequest?.id === requestId) {
      setRequest(null);
      setRequestStore({ url: "" } as RequestItem);
      setGraphQLRequestStore({} as GraphQLRequestItem);
      setGRPCRequestStore({} as GRPCRequestItem);
    }

    try {
      if (requestType === "REST") {
        await deleteRequestAction(requestId);
      } else if (requestType === "GRAPHQL") {
        await deleteGraphQLRequestAction(requestId);
      } else {
        await deleteGRPCRequestAction(requestId);
      }
      toast.success("Request deleted");
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const deleteCollection = async (collectionId: string) => {
    const collectionToDelete = collections.find((c) => c.id === collectionId);

    setCollections(collections.filter((c) => c.id !== collectionId));

    if (
      currentRequest &&
      collectionToDelete?.requests.some((r) => r.id === currentRequest.id)
    ) {
      setRequest(null);
      setRequestStore({ url: "" } as RequestItem);
    }

    setExpandedFolders((prev) => {
      const next = { ...prev };
      delete next[collectionId];
      return next;
    });

    try {
      await deleteCollectionAction(collectionId);
      toast.success("Collection deleted");
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleRequestClick = (req: AnyRequestItem) => {
    if (editingRequestId) return;

    // Determine protocol and call appropriate store method
    if ("method" in req && "url" in req && !("serverAddress" in req)) {
      // REST request
      setProtocol("REST");
      setRequestStore(req as RequestItem);
    } else if ("serverAddress" in req) {
      // gRPC request
      setProtocol("GRPC");
      setGRPCRequestStore(req as GRPCRequestItem);
    } else {
      // GraphQL request
      setProtocol("GRAPHQL");
      setGraphQLRequestStore(req as GraphQLRequestItem);
    }
    setRequest(req);
  };

  const renderRequestBadge = (req: AnyRequestItem) => {
    if ("serverAddress" in req) {
      // gRPC
      return (
        <span
          className="text-[9px] font-bold w-10 shrink-0"
          style={{ color: protocolColorMap.GRPC }}
        >
          gRPC
        </span>
      );
    } else if ("query" in req && "url" in req) {
      // GraphQL
      return (
        <span
          className="text-[9px] font-bold w-10 shrink-0"
          style={{ color: protocolColorMap.GRAPHQL }}
        >
          GQL
        </span>
      );
    } else {
      // REST
      const restReq = req as RequestItem;
      return (
        <span
          className="text-[9px] font-bold w-10 shrink-0"
          style={{
            color:
              methodColorMap[restReq.method.toUpperCase()] ||
              "var(--text-secondary)",
          }}
        >
          {restReq.method.toUpperCase()}
        </span>
      );
    }
  };

  return (
    <aside
      className="w-full h-full flex flex-col border-r select-none transition-colors duration-300"
      style={{
        backgroundColor: "var(--bg-primary)",
        borderColor: "var(--border-color)",
      }}
    >
      <div
        className="p-4 flex items-center justify-between border-b shrink-0"
        style={{ borderColor: "var(--border-color)" }}
      >
        <h2
          className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-2"
          style={{ color: "var(--text-secondary)" }}
        >
          <Folder size={12} />
          Collections
        </h2>

        <button
          type="button"
          className="p-1 rounded hover:bg-[var(--bg-secondary)] transition-colors"
          style={{ color: "var(--accent)" }}
          onClick={createCollection}
        >
          <Plus size={14} />
        </button>
      </div>

      <div className="p-3">
        <div
          className="flex items-center px-2 py-1.5 rounded border transition-all"
          style={{
            backgroundColor: "var(--bg-secondary)",
            borderColor: "var(--border-color)",
          }}
        >
          <Search
            size={14}
            className="mr-2"
            style={{ color: "var(--border-color)" }}
          />
          <input
            type="text"
            placeholder="Search..."
            className="bg-transparent text-xs w-full outline-none"
            style={{ color: "var(--text-primary)" }}
          />
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto pt-2 scrollbar-hide">
        {isLoading && (
          <div className="px-4 py-6 flex items-center gap-2 text-xs text-[var(--text-secondary)]">
            <div className="h-4 w-4 border-2 border-[var(--border-color)] border-t-[var(--accent)] rounded-full animate-spin" />
            Loading collections…
          </div>
        )}
        {!isLoading &&
          collections.map((col) => (
            <div key={col.id} className="mb-1">
              <div
                onClick={() => {
                  if (editingCollectionId) return;
                  toggleFolder(col.id);
                }}
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  setEditingCollectionId(col.id);
                  setEditingCollectionName(col.name);
                }}
                className="group flex items-center px-4 py-1.5 hover:bg-[var(--bg-secondary)] transition-colors"
              >
                <span className="mr-1" style={{ color: "var(--border-color)" }}>
                  <button
                    type="button"
                    className="mr-1 p-1 rounded cursor-pointer hover:bg-[var(--bg-secondary)] transition-colors"
                    aria-label="Toggle collection"
                  >
                    {expandedFolders[col.id] ? (
                      <ChevronDown size={14} />
                    ) : (
                      <ChevronRight size={14} />
                    )}
                  </button>
                </span>

                <Folder
                  size={14}
                  className="mr-2"
                  style={{
                    color: expandedFolders[col.id]
                      ? "var(--accent)"
                      : "var(--border-color)",
                  }}
                />

                {editingCollectionId === col.id ? (
                  <input
                    autoFocus
                    value={editingCollectionName}
                    onChange={(e) => setEditingCollectionName(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        commitRenameCollection(col.id);
                      }
                      if (e.key === "Escape") {
                        cancelRenameCollection();
                      }
                    }}
                    onBlur={() => commitRenameCollection(col.id)}
                    className="text-sm flex-1 bg-transparent outline-none border-none px-1"
                    style={{ color: "var(--text-primary)" }}
                  />
                ) : (
                  <span
                    className="text-sm truncate flex-1"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {col.name}
                  </span>
                )}

                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity relative">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowProtocolMenu(
                        showProtocolMenu === col.id ? null : col.id,
                      );
                    }}
                    className="p-1 rounded cursor-pointer hover:bg-[var(--bg-secondary)] transition-colors"
                    style={{ color: "var(--accent)" }}
                    title="Add request"
                  >
                    {isLoadingRequest && (
                      <div className="h-4 w-4 border-2 border-[var(--border-color)] border-t-[var(--accent)] rounded-full animate-spin" />
                    )}
                    {!isLoadingRequest && <Plus size={12} />}
                  </button>

                  {showProtocolMenu === col.id && (
                    <div
                      className="absolute top-full left-0 mt-1 w-40 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded shadow-lg z-50"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        className="w-full px-3 py-2 text-left text-xs hover:bg-[var(--bg-primary)] transition-colors"
                        style={{ color: methodColorMap.GET }}
                        onClick={() => createRequest(col.id)}
                      >
                        REST Request
                      </button>
                      <button
                        type="button"
                        className="w-full px-3 py-2 text-left text-xs hover:bg-[var(--bg-primary)] transition-colors"
                        style={{ color: "#A855F7" }}
                        onClick={() => createGraphQLRequest(col.id)}
                      >
                        GraphQL Request
                      </button>
                      <button
                        type="button"
                        className="w-full px-3 py-2 text-left text-xs hover:bg-[var(--bg-primary)] transition-colors"
                        style={{ color: "var(--accent)" }}
                        onClick={() => createGRPCRequest(col.id)}
                      >
                        gRPC Request
                      </button>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteCollection(col.id);
                    }}
                    className="p-1 rounded cursor-pointer hover:bg-[var(--bg-secondary)] transition-colors"
                    style={{ color: "var(--error)" }}
                    title="Delete collection"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>

              {expandedFolders[col.id] && (
                <div
                  className="ml-6 border-l"
                  style={{ borderColor: "var(--border-color)" }}
                >
                  {/* REST Requests */}
                  {col.requests.map((req) => (
                    <div
                      key={req.id}
                      onClick={() => {
                        if (editingRequestId) return;
                        handleRequestClick(req);
                      }}
                      onDoubleClick={(e) => {
                        e.stopPropagation();
                        setEditingRequestId(req.id);
                        setEditingRequestName(req.name);
                      }}
                      className={`
                      group
                      flex items-center py-1.5 pl-4 pr-3 cursor-pointer transition-all border-l-2
                      ${
                        currentRequest?.id === req.id
                          ? "bg-[var(--bg-panel)] border-[var(--accent)]"
                          : "border-transparent hover:bg-[var(--bg-secondary)]"
                      }
                    `}
                    >
                      {renderRequestBadge(req)}

                      {editingRequestId === req.id ? (
                        <input
                          autoFocus
                          value={editingRequestName}
                          onChange={(e) =>
                            setEditingRequestName(e.target.value)
                          }
                          onClick={(e) => e.stopPropagation()}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              commitRenameRequest(req.id);
                            }
                            if (e.key === "Escape") {
                              cancelRenameRequest();
                            }
                          }}
                          onBlur={() => commitRenameRequest(req.id)}
                          className="text-xs bg-transparent outline-none border-none flex-1"
                          style={{ color: "var(--text-primary)" }}
                        />
                      ) : (
                        <span
                          className="text-xs truncate"
                          style={{
                            color:
                              currentRequest?.id === req.id
                                ? "var(--text-primary)"
                                : "var(--text-secondary)",
                          }}
                        >
                          {req.name}
                        </span>
                      )}

                      <div className="ml-auto flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteRequest(req.id);
                          }}
                          className="p-1 rounded hover:bg-[var(--bg-secondary)] transition-colors"
                          style={{ color: "var(--error)" }}
                          title="Delete request"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* GraphQL Requests */}
                  {col.graphqlRequests.map((req) => (
                    <div
                      key={req.id}
                      onClick={() => {
                        if (editingRequestId) return;
                        handleRequestClick(req);
                      }}
                      onDoubleClick={(e) => {
                        e.stopPropagation();
                        setEditingRequestId(req.id);
                        setEditingRequestName(req.name);
                      }}
                      className={`
                      group
                      flex items-center py-1.5 pl-4 pr-3 cursor-pointer transition-all border-l-2
                      ${
                        currentRequest?.id === req.id
                          ? "bg-[var(--bg-panel)] border-[var(--accent)]"
                          : "border-transparent hover:bg-[var(--bg-secondary)]"
                      }
                    `}
                    >
                      {renderRequestBadge(req)}

                      {editingRequestId === req.id ? (
                        <input
                          autoFocus
                          value={editingRequestName}
                          onChange={(e) =>
                            setEditingRequestName(e.target.value)
                          }
                          onClick={(e) => e.stopPropagation()}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              commitRenameRequest(req.id);
                            }
                            if (e.key === "Escape") {
                              cancelRenameRequest();
                            }
                          }}
                          onBlur={() => commitRenameRequest(req.id)}
                          className="text-xs bg-transparent outline-none border-none flex-1"
                          style={{ color: "var(--text-primary)" }}
                        />
                      ) : (
                        <span
                          className="text-xs truncate"
                          style={{
                            color:
                              currentRequest?.id === req.id
                                ? "var(--text-primary)"
                                : "var(--text-secondary)",
                          }}
                        >
                          {req.name}
                        </span>
                      )}

                      <div className="ml-auto flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteRequest(req.id);
                          }}
                          className="p-1 rounded hover:bg-[var(--bg-secondary)] transition-colors"
                          style={{ color: "var(--error)" }}
                          title="Delete request"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* gRPC Requests */}
                  {col.grpcRequests.map((req) => (
                    <div
                      key={req.id}
                      onClick={() => {
                        if (editingRequestId) return;
                        handleRequestClick(req);
                      }}
                      onDoubleClick={(e) => {
                        e.stopPropagation();
                        setEditingRequestId(req.id);
                        setEditingRequestName(req.name);
                      }}
                      className={`
                      group
                      flex items-center py-1.5 pl-4 pr-3 cursor-pointer transition-all border-l-2
                      ${
                        currentRequest?.id === req.id
                          ? "bg-[var(--bg-panel)] border-[var(--accent)]"
                          : "border-transparent hover:bg-[var(--bg-secondary)]"
                      }
                    `}
                    >
                      {renderRequestBadge(req)}

                      {editingRequestId === req.id ? (
                        <input
                          autoFocus
                          value={editingRequestName}
                          onChange={(e) =>
                            setEditingRequestName(e.target.value)
                          }
                          onClick={(e) => e.stopPropagation()}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              commitRenameRequest(req.id);
                            }
                            if (e.key === "Escape") {
                              cancelRenameRequest();
                            }
                          }}
                          onBlur={() => commitRenameRequest(req.id)}
                          className="text-xs bg-transparent outline-none border-none flex-1"
                          style={{ color: "var(--text-primary)" }}
                        />
                      ) : (
                        <span
                          className="text-xs truncate"
                          style={{
                            color:
                              currentRequest?.id === req.id
                                ? "var(--text-primary)"
                                : "var(--text-secondary)",
                          }}
                        >
                          {req.name}
                        </span>
                      )}

                      <div className="ml-auto flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteRequest(req.id);
                          }}
                          className="p-1 rounded hover:bg-[var(--bg-secondary)] transition-colors"
                          style={{ color: "var(--error)" }}
                          title="Delete request"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
      </nav>
    </aside>
  );
};

export default CollectionsSidebarPanel;
