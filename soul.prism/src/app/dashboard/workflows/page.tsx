"use client";

import { useState, useEffect } from "react";
import { Plus, Play, GitBranch, Clock, Loader2, ArrowLeft, Eye } from "lucide-react";
import { useSelectionStore } from "@/stores/useSelectionStore";
import { listWorkflowsAction, runWorkflowAction, getWorkflowAction } from "@/backend/workflow/workflow.actions";
import WorkflowEditor from "@/components/workflow/WorkflowEditor";
import type { Workflow, WorkflowWithSteps, WorkflowStep, WorkflowExecutionResult } from "@/backend/workflow/workflow.types";
import { CheckCircle2, XCircle } from "lucide-react";

type ViewMode = "list" | "editor" | "view";

export default function WorkflowsPage() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [selectedWorkflow, setSelectedWorkflow] = useState<WorkflowWithSteps | null>(null);
  const [runningWorkflows, setRunningWorkflows] = useState<Set<string>>(new Set());
  const [runResult, setRunResult] = useState<WorkflowExecutionResult | null>(null);
  const [runError, setRunError] = useState<string | null>(null);
  
  const workspace = useSelectionStore((state) => state.workspace);
  const selectedWorkspaceId = workspace?.id;

  useEffect(() => {
    if (selectedWorkspaceId) {
      loadWorkflows();
    } else {
      setWorkflows([]);
      setLoading(false);
    }
  }, [selectedWorkspaceId]);

  const loadWorkflows = async () => {
    if (!selectedWorkspaceId) return;
    
    setLoading(true);
    try {
      const result = await listWorkflowsAction(selectedWorkspaceId);
      if (result.success) {
        setWorkflows(result.data);
      } else {
        console.error("Failed to load workflows:", result.error);
      }
    } catch (error) {
      console.error("Failed to load workflows:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNew = () => {
    setSelectedWorkflow(null);
    setViewMode("editor");
  };

  const handleViewDetails = async (workflowId: string) => {
    if (!selectedWorkspaceId) return;
    
    try {
      const result = await getWorkflowAction(workflowId, selectedWorkspaceId);
      if (result.success) {
        if (result.data) {
          setSelectedWorkflow(result.data);
          setViewMode("view");
        } else {
          console.error("Workflow not found");
        }
      } else {
        console.error("Failed to get workflow:", result.error);
      }
    } catch (error) {
      console.error("Failed to get workflow:", error);
    }
  };

  const handleViewAndRun = async (workflowId: string) => {
    if (!selectedWorkspaceId) return;
    
    // First navigate to detail view
    try {
      const result = await getWorkflowAction(workflowId, selectedWorkspaceId);
      if (result.success && result.data) {
        setSelectedWorkflow(result.data);
        setViewMode("view");
        // Then run the workflow
        handleRun(workflowId);
      }
    } catch (error) {
      console.error("Failed to view workflow:", error);
    }
  };

  const handleRun = async (workflowId: string) => {
    if (!selectedWorkspaceId) return;
    
    setRunningWorkflows((prev) => new Set(prev).add(workflowId));
    setRunResult(null);
    setRunError(null);
    
    try {
      const result = await runWorkflowAction(workflowId, selectedWorkspaceId);
      if (result.success) {
        setRunResult(result.data);
      } else {
        setRunError(result.error);
        console.error("Failed to run workflow:", result.error);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      setRunError(message);
      console.error("Failed to run workflow:", error);
    } finally {
      setRunningWorkflows((prev) => {
        const next = new Set(prev);
        next.delete(workflowId);
        return next;
      });
    }
  };

  const handleEditorClose = () => {
    setViewMode("list");
    setSelectedWorkflow(null);
    loadWorkflows();
  };

  if (!selectedWorkspaceId) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <GitBranch className="w-12 h-12 mx-auto mb-4 text-[var(--text-secondary)]" />
          <p className="text-[var(--text-secondary)]">Select a workspace to view workflows</p>
        </div>
      </div>
    );
  }

  if (viewMode === "editor") {
    return (
      <WorkflowEditor
        workspaceId={selectedWorkspaceId}
        onClose={handleEditorClose}
      />
    );
  }

  if (viewMode === "view" && selectedWorkflow) {
    return (
      <WorkflowDetailView
        workflow={selectedWorkflow}
        onBack={() => {
          setViewMode("list");
          setRunResult(null);
          setRunError(null);
        }}
        onRun={() => handleRun(selectedWorkflow.id)}
        isRunning={runningWorkflows.has(selectedWorkflow.id)}
        runResult={runResult}
        runError={runError}
      />
    );
  }

  return (
    <div className="h-full flex flex-col bg-[var(--bg-primary)]">
      {/* Header */}
      <div className="flex-shrink-0 px-6 py-4 border-b border-[var(--border-color)]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <GitBranch className="w-6 h-6 text-[var(--accent)]" />
            <h1 className="text-xl font-semibold text-[var(--text-primary)]">Workflows</h1>
            <span className="px-2 py-0.5 text-xs rounded-full bg-[var(--bg-secondary)] text-[var(--text-secondary)]">
              {workflows.length}
            </span>
          </div>
          <button
            onClick={handleCreateNew}
            className="flex items-center gap-2 px-4 py-2 rounded-md bg-[var(--accent)] text-[var(--bg-primary)] font-medium hover:opacity-90 transition-opacity"
          >
            <Plus className="w-4 h-4" />
            New Workflow
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-[var(--accent)]" />
          </div>
        ) : workflows.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <GitBranch className="w-16 h-16 mb-4 text-[var(--text-secondary)] opacity-50" />
            <h2 className="text-lg font-medium text-[var(--text-primary)] mb-2">No workflows yet</h2>
            <p className="text-[var(--text-secondary)] mb-4">
              Create your first workflow to automate API requests
            </p>
            <button
              onClick={handleCreateNew}
              className="flex items-center gap-2 px-4 py-2 rounded-md bg-[var(--bg-secondary)] text-[var(--text-primary)] hover:bg-[var(--bg-panel)] transition-colors"
            >
              <Plus className="w-4 h-4" />
              Create Workflow
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {workflows.map((workflow) => (
              <WorkflowCard
                key={workflow.id}
                workflow={workflow}
                isRunning={runningWorkflows.has(workflow.id)}
                onView={() => handleViewDetails(workflow.id)}
                onRun={() => handleViewAndRun(workflow.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface WorkflowCardProps {
  workflow: Workflow;
  isRunning: boolean;
  onView: () => void;
  onRun: () => void;
}

function WorkflowCard({ workflow, isRunning, onView, onRun }: WorkflowCardProps) {
  return (
    <div 
      className="group relative p-4 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-color)] hover:border-[var(--accent)] transition-colors"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-[var(--text-primary)] truncate">{workflow.name}</h3>
          {workflow.description && (
            <p className="text-sm text-[var(--text-secondary)] mt-1 line-clamp-2">
              {workflow.description}
            </p>
          )}
        </div>
      </div>

      {/* Timestamp */}
      <div className="flex items-center gap-1 text-xs text-[var(--text-secondary)] mb-4">
        <Clock className="w-3 h-3" />
        <span>Updated {new Date(workflow.updatedAt).toLocaleDateString()}</span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={onView}
          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md bg-[var(--bg-panel)] text-[var(--text-primary)] hover:bg-[var(--bg-primary)] border border-[var(--border-color)] transition-colors"
        >
          <Eye className="w-4 h-4" />
          View Steps
        </button>
        <button
          onClick={onRun}
          disabled={isRunning}
          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md bg-[var(--success)]/20 text-[var(--success)] hover:bg-[var(--success)]/30 transition-colors disabled:opacity-50"
        >
          {isRunning ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Running...
            </>
          ) : (
            <>
              <Play className="w-4 h-4" />
              Run
            </>
          )}
        </button>
      </div>
    </div>
  );
}

interface WorkflowDetailViewProps {
  workflow: WorkflowWithSteps;
  onBack: () => void;
  onRun: () => void;
  isRunning: boolean;
  runResult: WorkflowExecutionResult | null;
  runError: string | null;
}

function WorkflowDetailView({ workflow, onBack, onRun, isRunning, runResult, runError }: WorkflowDetailViewProps) {
  const getProtocolColor = (protocol: string) => {
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
              onClick={onBack}
              className="p-2 -ml-2 rounded-md text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl font-semibold text-[var(--text-primary)]">{workflow.name}</h1>
              {workflow.description && (
                <p className="text-sm text-[var(--text-secondary)]">{workflow.description}</p>
              )}
            </div>
          </div>
          <button
            onClick={onRun}
            disabled={isRunning}
            className="flex items-center gap-2 px-4 py-2 rounded-md bg-[var(--success)] text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {isRunning ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Running...
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                Run Workflow
              </>
            )}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-3xl mx-auto">
          <div className="p-4 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-color)]">
            <h2 className="text-sm font-medium text-[var(--text-secondary)] uppercase tracking-wider mb-4">
              Steps ({workflow.steps.length})
            </h2>
            
            {workflow.steps.length === 0 ? (
              <p className="text-[var(--text-secondary)] text-center py-8">
                No steps configured for this workflow
              </p>
            ) : (
              <div className="space-y-3">
                {workflow.steps
                  .sort((a: WorkflowStep, b: WorkflowStep) => a.stepOrder - b.stepOrder)
                  .map((step: WorkflowStep, index: number) => (
                    <div
                      key={step.id}
                      className="flex items-center gap-3 p-3 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-color)]"
                    >
                      <span className="w-6 h-6 flex items-center justify-center rounded-full bg-[var(--bg-secondary)] text-xs font-medium text-[var(--text-secondary)]">
                        {index + 1}
                      </span>
                      <span className={`px-2 py-0.5 text-xs rounded font-medium border ${getProtocolColor(step.protocol)}`}>
                        {step.protocol}
                      </span>
                      <span className="text-[var(--text-primary)] text-sm">
                        Request: {step.requestId}
                      </span>
                      {step.retryCount > 0 && (
                        <span className="text-xs text-[var(--text-secondary)]">
                          ({step.retryCount} retries)
                        </span>
                      )}
                    </div>
                  ))}
              </div>
            )}
          </div>

          {/* Run Results */}
          {(runResult || runError) && (
            <div className="mt-4 p-4 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-color)]">
              <h2 className="text-sm font-medium text-[var(--text-secondary)] uppercase tracking-wider mb-3">
                Run Results
              </h2>
              
              {runError ? (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400">
                  <XCircle className="w-5 h-5 flex-shrink-0" />
                  <span>{runError}</span>
                </div>
              ) : runResult && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-[var(--text-secondary)]">Run ID:</span>
                    <span className="font-mono text-xs text-[var(--text-primary)]">{runResult.workflowRunId}</span>
                  </div>
                  
                  {runResult.steps.length === 0 ? (
                    <p className="text-[var(--text-secondary)] text-sm">No steps were executed</p>
                  ) : (
                    <div className="space-y-2">
                      {runResult.steps.map((stepResult, index) => (
                        <div
                          key={stepResult.stepId}
                          className={`flex items-center gap-3 p-3 rounded-lg border ${
                            stepResult.status === "SUCCESS" || stepResult.status === "COMPLETED"
                              ? "bg-green-500/10 border-green-500/30"
                              : stepResult.status === "FAILED"
                              ? "bg-red-500/10 border-red-500/30"
                              : "bg-yellow-500/10 border-yellow-500/30"
                          }`}
                        >
                          <span className="w-6 h-6 flex items-center justify-center rounded-full bg-[var(--bg-secondary)] text-xs font-medium">
                            {index + 1}
                          </span>
                          {stepResult.status === "SUCCESS" || stepResult.status === "COMPLETED" ? (
                            <CheckCircle2 className="w-5 h-5 text-green-400" />
                          ) : stepResult.status === "FAILED" ? (
                            <XCircle className="w-5 h-5 text-red-400" />
                          ) : (
                            <Loader2 className="w-5 h-5 text-yellow-400 animate-spin" />
                          )}
                          <span className="flex-1 text-sm text-[var(--text-primary)]">
                            Step {index + 1}
                          </span>
                          {stepResult.durationMs !== undefined && (
                            <span className="text-xs text-[var(--text-secondary)]">
                              {stepResult.durationMs}ms
                            </span>
                          )}
                          <span className={`text-xs font-medium ${
                            stepResult.status === "SUCCESS" || stepResult.status === "COMPLETED"
                              ? "text-green-400"
                              : stepResult.status === "FAILED"
                              ? "text-red-400"
                              : "text-yellow-400"
                          }`}>
                            {stepResult.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Metadata */}
          <div className="mt-4 p-4 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-color)]">
            <h2 className="text-sm font-medium text-[var(--text-secondary)] uppercase tracking-wider mb-3">
              Details
            </h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-[var(--text-secondary)]">Created:</span>
                <span className="ml-2 text-[var(--text-primary)]">
                  {new Date(workflow.createdAt).toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-[var(--text-secondary)]">Updated:</span>
                <span className="ml-2 text-[var(--text-primary)]">
                  {new Date(workflow.updatedAt).toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-[var(--text-secondary)]">Created by:</span>
                <span className="ml-2 text-[var(--text-primary)]">{workflow.createdBy}</span>
              </div>
              <div>
                <span className="text-[var(--text-secondary)]">ID:</span>
                <span className="ml-2 text-[var(--text-primary)] font-mono text-xs">{workflow.id}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
