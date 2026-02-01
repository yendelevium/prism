"use client";

import React, { useMemo } from 'react';
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { ComposedChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { Span, GanttData } from './types';

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

// Custom Tick that looks up data by ID
const TreeTick = (props: any) => {
  const { x, y, payload, fullData } = props;
  // Find the original data point using the ID passed to the tick
  const dataItem = fullData.find((d: GanttData) => d.span_id === payload.value);

  if (!dataItem) return null;

  const indent = dataItem.depth * 16;
  
  return (
    <g transform={`translate(${x},${y})`}>
      {/* Hierarchy Guide Lines */}
      {dataItem.depth > 0 && (
        <path
          d={`M ${-190 + (dataItem.depth - 1) * 16} ${-20} V 0 H ${-185 + indent}`}
          fill="none"
          stroke={NORD.border}
          strokeWidth="1"
        />
      )}
      
      <text
        x={-180 + indent}
        y={-2}
        fill={NORD.textPrimary}
        fontSize={11}
        fontFamily="ui-monospace, monospace"
        textAnchor="start"
      >
        {dataItem.operation}
      </text>
      
      <text
        x={-180 + indent}
        y={10}
        fill={NORD.accent}
        fontSize={9}
        textAnchor="start"
        style={{ opacity: 0.8 }}
      >
        {dataItem.service_name}
      </text>
    </g>
  );
};

const CustomBarShape = (props: any) => {
  const { x, y, width, height, payload, dataKey } = props;
  if (dataKey === 'offset' || !payload) return null;
  const fill = payload.status === 'error' ? NORD.error : NORD.success;
  return <rect x={x} y={y} width={width} height={height} fill={fill} rx={2} />;
};

const TraceGanttClient: React.FC<{ spans: Span[] }> = ({ spans }) => {
  const data = useMemo(() => {
    const minStart = Math.min(...spans.map(s => s.start_time));
    const spanMap = new Map(spans.map(s => [s.span_id, s]));
    
    const getDepth = (id: string | null): number => {
      if (!id) return 0;
      const parent = spanMap.get(id);
      return parent ? 1 + getDepth(parent.parent_span_id) : 0;
    };

    return spans
      .sort((a, b) => a.start_time - b.start_time)
      .map((span, index) => ({
        ...span,
        offset: span.start_time - minStart,
        yIndex: index,
        depth: getDepth(span.parent_span_id),
      }));
  }, [spans]);

  const totalDuration = Math.max(...data.map(d => d.offset + d.duration));
  const chartWidth = Math.max(1200, totalDuration * 1.5);
  const chartHeight = data.length * 60 + 100;

  return (
    <div className="w-full h-[600px] border rounded-lg overflow-hidden relative" style={{ backgroundColor: NORD.bgPrimary, borderColor: NORD.border }}>
      <TransformWrapper initialScale={1} minScale={0.1} maxScale={8} limitToBounds={false}>
        {({ zoomIn, zoomOut, resetTransform }) => (
          <>
            {/* Minimalist Nord Controls */}
            <div className="absolute top-4 right-4 z-20 flex gap-1 opacity-70 hover:opacity-100 transition-opacity">
              <button onClick={() => zoomIn()} className="w-8 h-8 flex items-center justify-center rounded border" style={{ backgroundColor: NORD.bgPanel, color: NORD.textPrimary, borderColor: NORD.border }}>+</button>
              <button onClick={() => zoomOut()} className="w-8 h-8 flex items-center justify-center rounded border" style={{ backgroundColor: NORD.bgPanel, color: NORD.textPrimary, borderColor: NORD.border }}>-</button>
              <button onClick={() => resetTransform()} className="px-2 h-8 text-[10px] uppercase font-bold rounded border" style={{ backgroundColor: NORD.bgPanel, color: NORD.textPrimary, borderColor: NORD.border }}>Reset</button>
            </div>
            <TransformComponent wrapperStyle={{ width: "100%", height: "100%", cursor: "grab" }}>
                <div style={{ width: chartWidth, height: chartHeight, padding: '80px 40px', backgroundColor: NORD.bgPrimary }}>
                    <ComposedChart
                    width={chartWidth - 80}
                    height={chartHeight - 160}
                    layout="vertical"
                    data={data}
                    margin={{ left: 200 }} 
                    >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={NORD.border} />
                    <XAxis 
                        type="number" 
                        domain={[0, totalDuration]} 
                        orientation="top"
                        axisLine={{ stroke: NORD.border }}
                        tick={{ fontSize: 10, fill: NORD.textSecondary }}
                    />
                    <YAxis 
                        type="category"
                        dataKey="span_id" // Unique ID is mandatory for Recharts to render rows
                        width={1} 
                        tick={(props) => <TreeTick {...props} fullData={data} />}
                        axisLine={{ stroke: NORD.border }}
                    />
                    <Tooltip 
                        cursor={{ fill: NORD.bgSecondary }} 
                        content={({ active, payload }) => {
                            if (active && payload?.[0]) {
                                const d = payload[0].payload;
                                return (
                                    <div style={{ background: NORD.bgPanel, border: `1px solid ${NORD.border}`, padding: '8px', borderRadius: '4px', color: NORD.textPrimary }}>
                                        <div style={{ fontSize: '10px', color: NORD.accent }}>{d.service_name}</div>
                                        <div style={{ fontWeight: 'bold' }}>{d.operation}</div>
                                        <div style={{ fontSize: '11px', marginTop: '4px' }}>Duration: {d.duration}ms</div>
                                    </div>
                                );
                            }
                            return null;
                        }}
                    />
                    
                    <Bar dataKey="offset" stackId="a" isAnimationActive={false} shape={<CustomBarShape />} />
                    <Bar dataKey="duration" stackId="a" barSize={22} isAnimationActive={false} shape={<CustomBarShape />} />
                    </ComposedChart>
                </div>
            </TransformComponent>
        </>
        )}
      </TransformWrapper>
    </div>
  );
};

export default TraceGanttClient;