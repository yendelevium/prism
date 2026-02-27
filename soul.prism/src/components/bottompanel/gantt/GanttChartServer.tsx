"use client";

import React from "react";
import TraceGanttClient from "./GanttChartPanel";
import { useSpanStore } from "@/stores/useSpanStore";

export default function GanttChartServer() {
  const spans = useSpanStore((s) => s.spans);

  return <TraceGanttClient spans={spans} />;
}
