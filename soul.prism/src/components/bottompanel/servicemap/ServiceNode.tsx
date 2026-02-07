"use client";

import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';

const NORD = {
    bgPanel: "#434C5E",
    bgSecondary: "#3B4252",
    border: "#4C566A",
    textPrimary: "#ECEFF4",
    accent: "#88C0D0",
};

const ServiceNode = ({ data, selected }: NodeProps) => {
    // Note: The styles are now mainly controlled by the parent passing style prop,
    // but the custom node allows us to ensure pointer-events and structure are stable.
    return (
        <div
            style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                pointerEvents: 'auto', // Allow hover events
                cursor: 'default',
            }}
        >
            <Handle type="target" position={Position.Top} style={{ visibility: 'hidden', pointerEvents: 'none' }} />
            <div style={{ pointerEvents: 'none', userSelect: 'none' }}>
                {data.label}
            </div>
            <Handle type="source" position={Position.Bottom} style={{ visibility: 'hidden', pointerEvents: 'none' }} />
        </div>
    );
};

export default memo(ServiceNode);
