"use client";

import BottomPanelServer from "@/components/bottompanel/BottomPanelServer";
import RequestTabs from "@/components/request/RequestTabs";
import ResponsePanel from "@/components/response/ResponsePanel";
import { Panel, Group, Separator, Layout } from "react-resizable-panels";

/**
 * Props for `DashboardHome`.
 */
export interface DashboardHomeProps {
  /**
   * Optional default layout configuration for the vertical panel group.
   * Typically loaded from cookies or user preferences.
   */
  defaultLayoutVertical?: Layout;

  /**
   * Optional default layout configuration for the horizontal panel group.
   * Typically loaded from cookies or user preferences.
   */
  defaultLayoutHorizontal?: Layout;

  /**
   * React node representing the request tabs panel (left/top panel).
   */
  requestTabs: React.ReactNode;

  /**
   * React node representing the response panel (right/top panel).
   */
  responsePanel: React.ReactNode;

  /**
   * React node representing the bottom utility panel, e.g., server logs.
   */
  bottomPanelServer: React.ReactNode;
}

/**
 * DashboardHome renders a resizable, multi-panel dashboard layout.
 *
 * @remarks
 * The dashboard is structured as a vertical group with:
 * - A top horizontal group containing the request tabs and response panel.
 * - A bottom utility panel for server logs or other controls.
 *
 * Both horizontal and vertical groups support resizable panels via `react-resizable-panels`.
 * Layout changes are automatically persisted to cookies to restore user preferences.
 *
 * @example
 * ```tsx
 * <DashboardHome
 *   defaultLayoutVertical={verticalLayoutFromCookies}
 *   defaultLayoutHorizontal={horizontalLayoutFromCookies}
 *   requestTabs={<RequestTabs />}
 *   responsePanel={<ResponsePanel />}
 *   bottomPanelServer={<BottomPanelServer />}
 * />
 * ```
 *
 * @param props - Dashboard configuration and content panels.
 * @returns A full-screen resizable dashboard React component.
 */
export default function DashboardHome({
  defaultLayoutVertical,
  defaultLayoutHorizontal,
  requestTabs,
  responsePanel,
  bottomPanelServer,
}: DashboardHomeProps) {
  /**
   * Creates a layout change handler for a given group.
   * Persists the updated layout to a cookie with a 1-year max-age.
   *
   * @param groupId - The panel group ID (vertical or horizontal).
   * @returns A callback function that receives the new layout.
   */
  const onLayoutChange = (groupId: string) => (layout: Layout) => {
    document.cookie = `${groupId}=${JSON.stringify(layout)}; path=/; max-age=31536000`;
  };

  return (
    <div className="h-screen w-full bg-[var(--bg-primary)] overflow-hidden">
      {/* Vertical Panel Group */}
      <Group
        orientation="vertical"
        id="dashboard-vertical-layout"
        defaultLayout={defaultLayoutVertical}
        onLayoutChange={onLayoutChange("dashboard-vertical-layout")}
      >
        {/* Top horizontal panel group */}
        <Panel id="top-section" minSize={200}>
          <Group
            orientation="horizontal"
            id="dashboard-horizontal-layout"
            defaultLayout={defaultLayoutHorizontal}
            onLayoutChange={onLayoutChange("dashboard-horizontal-layout")}
          >
            {/* Request Tabs Panel */}
            <Panel id="request-tabs-panel" minSize={400}>
              {requestTabs}
            </Panel>

            <Separator className="w-1 bg-[var(--border-color)] hover:bg-[var(--accent)] transition-colors cursor-col-resize" />

            {/* Response Panel */}
            <Panel id="response-panel-container" minSize={400}>
              {responsePanel}
            </Panel>
          </Group>
        </Panel>

        <Separator className="h-1 bg-[var(--border-color)] hover:bg-[var(--accent)] transition-colors cursor-row-resize" />

        {/* Bottom Utility Panel */}
        <Panel id="bottom-utility-panel" minSize={220}>
          <div className="h-full overflow-hidden">{bottomPanelServer}</div>
        </Panel>
      </Group>
    </div>
  );
}
