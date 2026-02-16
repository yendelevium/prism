"use client";

import { useState } from "react";
import {
  DocumentTextIcon,
  ChartBarSquareIcon,
  MapIcon,
} from "@heroicons/react/24/outline";
import IconButton from "../common/IconButton";
import { BottomView } from "./types";

export default function BottomPanelClient({
  logsView,
  ganttView,
  servicemapView,
}: {
  logsView: React.ReactNode;
  ganttView: React.ReactNode;
  servicemapView: React.ReactNode;
}) {
  const [activeView, setActiveView] = useState<BottomView>("logs");

  return (
    <div className="flex flex-col h-full border-t border-l-1 border-[var(--border-color)]">
      {/* SWITCHER BAR */}
      <div className="flex items-center gap-2 px-2 h-11 bg-[var(--bg-panel)]">
        <IconButton
          icon={DocumentTextIcon}
          variant={activeView === "logs" ? "active" : "default"}
          onClick={() => setActiveView("logs")}
        />
        <IconButton
          icon={ChartBarSquareIcon}
          variant={activeView === "gantt" ? "active" : "default"}
          onClick={() => setActiveView("gantt")}
        />
        <IconButton
          icon={MapIcon}
          variant={activeView === "servicemap" ? "active" : "default"}
          onClick={() => setActiveView("servicemap")}
        />
      </div>

      {/* VIEWER */}
      <div className="flex-1 min-h-0 min-w-0 bg-[var(--bg-secondary)] p-0">
        {activeView === "logs"
          ? logsView
          : activeView === "gantt"
            ? ganttView
            : servicemapView}
      </div>
    </div>
  );
}
