"use client";

import React, { useMemo, useState, useCallback, useRef } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  Node,
  Edge,
  NodeMouseHandler,
} from "reactflow";
import "reactflow/dist/style.css";
import type { Span } from "@/@types/spanItem";
import { buildServiceGraph } from "./utils";

import ServiceNode from "./ServiceNode";
import { useSpanStore } from "@/stores/useSpanStore";

const NORD = {
  bgPrimary: "#2E3440",
  bgSecondary: "#3B4252",
  bgPanel: "#434C5E",
  border: "#4C566A",
  textPrimary: "#ECEFF4",
  textSecondary: "#D8DEE9",
  accent: "#88C0D0",
  success: "#A3BE8C",
  error: "#BF616A",
};

const nodeTypes = {
  serviceNode: ServiceNode,
};

interface ServiceMapPanelProps {
  spans: Span[];
}

const ServiceMapPanel = () => {
  const spans = useSpanStore((s) => s.spans);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const { nodes, edges } = useMemo(
    () => buildServiceGraph(spans, true),
    [spans],
  );
  const edgesRef = useRef(edges);

  useMemo(() => {
    edgesRef.current = edges;
  }, [edges]);

  // Get connected node IDs for the hovered node
  const connectedNodeIds = useMemo(() => {
    if (!hoveredNodeId) return new Set<string>();

    const connected = new Set<string>();
    connected.add(hoveredNodeId);

    edgesRef.current.forEach((edge) => {
      if (edge.source === hoveredNodeId) connected.add(edge.target);
      if (edge.target === hoveredNodeId) connected.add(edge.source);
    });

    return connected;
  }, [hoveredNodeId]);

  // Style nodes based on hover state
  const styledNodes = useMemo(() => {
    const baseStyle = {
      color: NORD.textPrimary,
      borderRadius: "8px",
      fontSize: "12px",
      fontFamily: "ui-monospace, monospace",
      boxSizing: "border-box" as const,
      width: 160,
      height: 60,
    };

    return nodes.map((node) => {
      const isHovered = node.id === hoveredNodeId;
      const isConnected = connectedNodeIds.has(node.id);

      return {
        ...node,
        type: "serviceNode",
        style: {
          ...baseStyle,
          background: isHovered ? NORD.bgSecondary : NORD.bgPanel,
          border: isHovered
            ? `2px solid ${NORD.accent}`
            : `2px solid ${NORD.border}`,
          opacity: hoveredNodeId ? (isConnected ? 1 : 0.2) : 1,
          zIndex: isHovered ? 100 : 1,
          transition: "all 0.15s ease-out",
        },
      };
    });
  }, [nodes, hoveredNodeId, connectedNodeIds]);

  // Style edges based on hover state
  const styledEdges = useMemo(() => {
    return edges.map((edge) => {
      const isConnected =
        hoveredNodeId &&
        (edge.source === hoveredNodeId || edge.target === hoveredNodeId);

      return {
        ...edge,
        style: {
          stroke: isConnected ? NORD.accent : NORD.border,
          strokeWidth: isConnected ? 3 : 1,
          opacity: hoveredNodeId ? (isConnected ? 1 : 0.1) : 1,
          transition: "all 0.15s ease-out",
        },
        animated: !!isConnected,
      };
    });
  }, [edges, hoveredNodeId]);

  const onNodeMouseEnter = useCallback((_: any, node: any) => {
    setHoveredNodeId(node.id);
  }, []);

  const onNodeMouseLeave = useCallback(() => {
    setHoveredNodeId(null);
  }, []);

  if (spans.length === 0) {
    return (
      <div
        className="w-full h-[600px] flex items-center justify-center border"
        style={{ backgroundColor: NORD.bgPrimary, borderColor: NORD.border }}
      >
        <p style={{ color: NORD.textSecondary }}>
          No trace data available. Run a request to see the service map.
        </p>
      </div>
    );
  }

  return (
    <div
      className="w-full h-[600px] border"
      style={{ backgroundColor: NORD.bgPrimary, borderColor: NORD.border }}
    >
      <ReactFlow
        nodes={styledNodes}
        edges={styledEdges as any}
        nodeTypes={nodeTypes}
        fitView
        onNodeMouseEnter={onNodeMouseEnter}
        onNodeMouseLeave={onNodeMouseLeave}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        panOnScroll={false}
        zoomOnScroll={true}
        minZoom={0.2}
        maxZoom={2}
      >
        <Background color={NORD.border} gap={16} />
        <Controls />
        <MiniMap />
      </ReactFlow>
    </div>
  );
};

export default ServiceMapPanel;
