"use client";

import { useState, useEffect } from "react";
import {
  ArrowLeft,
  Save,
  AlertCircle,
  Plus,
  Trash2,
  GripVertical,
  Loader2,
} from "lucide-react";
import {
  createWorkflowAction,
  addWorkflowStepAction,
} from "@/backend/workflow/workflow.actions";
import { listCollectionsByWorkspaceAction } from "@/backend/collection/collection.actions";
import { getRequestsByCollectionAction } from "@/backend/request/request.actions";
import { getGraphQLRequestsByCollectionAction } from "@/backend/graphql-request/graphql-request.actions";
import { getGRPCRequestsByCollectionAction } from "@/backend/grpc-request/grpc-request.actions";
import type { WorkflowRequestProtocol } from "@prisma/client";

interface RequestOption {
  id: string;
  name: string;
  protocol: WorkflowRequestProtocol;
  collectionName: string;
  method?: string;
}

interface PendingStep {
  id: string; // local ID for key
  requestId: string;
  requestName: string;
  protocol: WorkflowRequestProtocol;
  retryCount: number;
}

interface WorkflowEditorProps {
  workspaceId: string;
  onClose: () => void;
}

export default function WorkflowEditor({
  workspaceId,
  onClose,
}: WorkflowEditorProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Steps state
  const [steps, setSteps] = useState<PendingStep[]>([]);
  const [availableRequests, setAvailableRequests] = useState<RequestOption[]>(
    [],
  );
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [selectedRequestId, setSelectedRequestId] = useState("");
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    loadAvailableRequests();
  }, [workspaceId]);

  const loadAvailableRequests = async () => {
    setLoadingRequests(true);
    try {
      const collectionsResult =
        await listCollectionsByWorkspaceAction(workspaceId);
      if (!collectionsResult.success) {
        console.error("Failed to load collections:", collectionsResult.error);
        return;
      }

      const allRequests: RequestOption[] = [];

      for (const collection of collectionsResult.data) {
        // Load REST requests
        const restResult = await getRequestsByCollectionAction(collection.id);
        if (restResult.success) {
          for (const req of restResult.data) {
            allRequests.push({
              id: req.id,
              name: req.name,
              protocol: "REST",
              collectionName: collection.name,
              method: req.method,
            });
          }
        }

        // Load GraphQL requests
        const graphqlResult = await getGraphQLRequestsByCollectionAction(
          collection.id,
        );
        if (graphqlResult.success) {
          for (const req of graphqlResult.data) {
            allRequests.push({
              id: req.id,
              name: req.name,
              protocol: "GRAPHQL",
              collectionName: collection.name,
            });
          }
        }

        // Load gRPC requests
        const grpcResult = await getGRPCRequestsByCollectionAction(
          collection.id,
        );
        if (grpcResult.success) {
          for (const req of grpcResult.data) {
            allRequests.push({
              id: req.id,
              name: req.name,
              protocol: "GRPC",
              collectionName: collection.name,
            });
          }
        }
      }

      setAvailableRequests(allRequests);
    } catch (error) {
      console.error("Failed to load requests:", error);
    } finally {
      setLoadingRequests(false);
    }
  };

  const handleAddStep = () => {
    if (!selectedRequestId) return;

    const request = availableRequests.find((r) => r.id === selectedRequestId);
    if (!request) return;

    setSteps((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        requestId: request.id,
        requestName: request.name,
        protocol: request.protocol,
        retryCount,
      },
    ]);

    setSelectedRequestId("");
    setRetryCount(0);
  };

  const handleRemoveStep = (stepId: string) => {
    setSteps((prev) => prev.filter((s) => s.id !== stepId));
  };

  const moveStep = (index: number, direction: "up" | "down") => {
    const newSteps = [...steps];
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= steps.length) return;

    [newSteps[index], newSteps[newIndex]] = [
      newSteps[newIndex],
      newSteps[index],
    ];
    setSteps(newSteps);
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = "Workflow name is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setSaving(true);
    try {
      // 1. Create the workflow
      const result = await createWorkflowAction(
        workspaceId,
        name,
        description || undefined,
      );
      if (!result.success) {
        setErrors({ save: result.error });
        return;
      }

      const workflowId = result.data.id;

      // 2. Add each step
      for (let i = 0; i < steps.length; i++) {
        const step = steps[i];
        const stepResult = await addWorkflowStepAction(
          workflowId,
          workspaceId,
          step.requestId,
          step.protocol,
          i + 1, // stepOrder (1-based)
          step.retryCount,
        );
        if (!stepResult.success) {
          console.error(`Failed to add step ${i + 1}:`, stepResult.error);
        }
      }

      onClose();
    } catch (error) {
      console.error("Failed to save workflow:", error);
      setErrors({ save: "Failed to create workflow" });
    } finally {
      setSaving(false);
    }
  };

  const getProtocolColor = (protocol: WorkflowRequestProtocol) => {
    switch (protocol) {
      case "REST":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "GRAPHQL":
        return "bg-pink-500/20 text-pink-400 border-pink-500/30";
      case "GRPC":
        return "bg-orange-500/20 text-orange-400 border-orange-500/30";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  return (
    <div className="h-full flex flex-col bg-[var(--bg-primary)]">
      {/* Header */}
      <div className="flex-shrink-0 px-6 py-4 border-b border-[var(--border-color)]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="p-2 -ml-2 rounded-md text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-semibold text-[var(--text-primary)]">
              New Workflow
            </h1>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 rounded-md bg-[var(--accent)] text-[var(--bg-primary)] font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? "Saving..." : "Save Workflow"}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-4xl mx-auto p-6 space-y-6">
          {/* Basic Info */}
          <section className="p-4 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-color)]">
            <h2 className="text-sm font-medium text-[var(--text-secondary)] uppercase tracking-wider mb-4">
              Basic Information
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
                  Name <span className="text-[var(--error)]">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter workflow name"
                  className={`w-full px-3 py-2 rounded-md bg-[var(--bg-panel)] border text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:outline-none focus:border-[var(--accent)] ${
                    errors.name
                      ? "border-[var(--error)]"
                      : "border-[var(--border-color)]"
                  }`}
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-[var(--error)] flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.name}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe what this workflow does"
                  rows={3}
                  className="w-full px-3 py-2 rounded-md bg-[var(--bg-panel)] border border-[var(--border-color)] text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:outline-none focus:border-[var(--accent)] resize-none"
                />
              </div>
              {errors.save && (
                <p className="mt-2 text-sm text-[var(--error)] flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.save}
                </p>
              )}
            </div>
          </section>

          {/* Steps Section */}
          <section className="p-4 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-color)]">
            <h2 className="text-sm font-medium text-[var(--text-secondary)] uppercase tracking-wider mb-4">
              Steps ({steps.length})
            </h2>

            {/* Add Step */}
            <div className="p-3 rounded-lg bg-[var(--bg-panel)] border border-[var(--border-color)] mb-4">
              <div className="flex gap-3 items-end">
                <div className="flex-1">
                  <label className="block text-xs text-[var(--text-secondary)] mb-1">
                    Select Request
                  </label>
                  {loadingRequests ? (
                    <div className="flex items-center gap-2 px-3 py-2 text-sm text-[var(--text-secondary)]">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Loading requests...
                    </div>
                  ) : availableRequests.length === 0 ? (
                    <p className="text-sm text-[var(--text-secondary)] px-3 py-2">
                      No requests found. Create some requests first.
                    </p>
                  ) : (
                    <select
                      value={selectedRequestId}
                      onChange={(e) => setSelectedRequestId(e.target.value)}
                      className="w-full px-3 py-2 rounded-md bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
                    >
                      <option value="">Choose a request...</option>
                      {availableRequests.map((req) => (
                        <option key={req.id} value={req.id}>
                          [{req.protocol}] {req.collectionName} /{" "}
                          {req.method ? `${req.method} ` : ""}
                          {req.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
                <div className="w-24">
                  <label className="block text-xs text-[var(--text-secondary)] mb-1">
                    Retries
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={10}
                    value={retryCount}
                    onChange={(e) =>
                      setRetryCount(parseInt(e.target.value) || 0)
                    }
                    className="w-full px-3 py-2 rounded-md bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
                  />
                </div>
                <button
                  onClick={handleAddStep}
                  disabled={!selectedRequestId}
                  className="flex items-center gap-1 px-3 py-2 rounded-md bg-[var(--accent)] text-[var(--bg-primary)] font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  <Plus className="w-4 h-4" />
                  Add
                </button>
              </div>
            </div>

            {/* Steps List */}
            {steps.length === 0 ? (
              <p className="text-center text-[var(--text-secondary)] py-6">
                No steps added yet. Select a request above to add steps.
              </p>
            ) : (
              <div className="space-y-2">
                {steps.map((step, index) => (
                  <div
                    key={step.id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-[var(--bg-panel)] border border-[var(--border-color)]"
                  >
                    <div className="flex flex-col gap-1">
                      <button
                        onClick={() => moveStep(index, "up")}
                        disabled={index === 0}
                        className="p-0.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] disabled:opacity-30"
                      >
                        <GripVertical className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => moveStep(index, "down")}
                        disabled={index === steps.length - 1}
                        className="p-0.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] disabled:opacity-30"
                      >
                        <GripVertical className="w-3 h-3" />
                      </button>
                    </div>
                    <span className="w-6 h-6 flex items-center justify-center rounded-full bg-[var(--bg-secondary)] text-xs font-medium text-[var(--text-secondary)]">
                      {index + 1}
                    </span>
                    <span
                      className={`px-2 py-0.5 text-xs rounded font-medium border ${getProtocolColor(step.protocol)}`}
                    >
                      {step.protocol}
                    </span>
                    <span className="flex-1 text-sm text-[var(--text-primary)] truncate">
                      {step.requestName}
                    </span>
                    {step.retryCount > 0 && (
                      <span className="text-xs text-[var(--text-secondary)]">
                        {step.retryCount} retries
                      </span>
                    )}
                    <button
                      onClick={() => handleRemoveStep(step.id)}
                      className="p-1 text-[var(--text-secondary)] hover:text-[var(--error)] transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
