"use client";

import BottomPanelServer from "@/components/bottompanel/BottomPanelServer";
import RequestTabs from "@/components/request/RequestTabs";
import ResponsePanel from "@/components/response/ResponsePanel";
import { Panel, Group, Separator, Layout } from "react-resizable-panels";

// ... imports

export default function DashboardHome({
  defaultLayoutVertical,
  defaultLayoutHorizontal,
  requestTabs,
  responsePanel,
  bottomPanelServer,
}: {
  defaultLayoutVertical?: Layout;
  defaultLayoutHorizontal?: Layout;
  requestTabs: React.ReactNode;
  responsePanel: React.ReactNode;
  bottomPanelServer: React.ReactNode;
}) {
  
  const onLayoutChange = (groupId: string) => (layout: Layout) => {
    document.cookie = `${groupId}=${JSON.stringify(layout)}; path=/; max-age=31536000`;
  };

  return (
    <div className="h-screen w-full bg-[var(--bg-primary)] overflow-hidden">
      <Group 
        orientation="vertical" 
        id="dashboard-vertical-layout"
        defaultLayout={defaultLayoutVertical}
        onLayoutChange={onLayoutChange("dashboard-vertical-layout")}
      >
        <Panel id="top-section" minSize={200}>
          <Group 
            orientation="horizontal" 
            id="dashboard-horizontal-layout"
            defaultLayout={defaultLayoutHorizontal}
            onLayoutChange={onLayoutChange("dashboard-horizontal-layout")}
          >
           <Panel id="request-tabs-panel" minSize={400}>
                {requestTabs}
            </Panel>

            <Separator className="w-1 bg-[var(--border-color)] hover:bg-[var(--accent)] transition-colors cursor-col-resize" />

            <Panel id="response-panel-container" minSize={400}>
              {responsePanel}
            </Panel>
          </Group>
        </Panel>

        {/* Separator and Bottom Panel... */}
        <Separator className="h-1 bg-[var(--border-color)] hover:bg-[var(--accent)] transition-colors cursor-row-resize" />

        {/* BOTTOM PANEL */}
        <Panel id="bottom-utility-panel" minSize={220}>
          <div className="h-full overflow-hidden">
            {bottomPanelServer}
          </div>
        </Panel>
      </Group>
    </div>
  );
}