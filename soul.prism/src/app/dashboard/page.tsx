import BottomPanelServer from "@/components/bottompanel/BottomPanelServer";
import RequestTabs from "@/components/request/RequestTabs";
import ResponsePanel from "@/components/response/ResponsePanel";

export default function DashboardHome() {
  console.log("[PAGE]", "DASHBOARD_REST_DEFAULT_LOADED");

  return (
    <div className="flex flex-col h-full min-h-0">

      {/* Main content (Request + Response) */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        <div className="flex-1 min-w-0 border-r border-[var(--border-color)]">
          <RequestTabs />
        </div>

        <div className="flex-1 min-w-0">
          <ResponsePanel />
        </div>
      </div>

      {/* Bottom Panel */}
      <div className="flex-shrink-0 h-56 min-w-0">
        <BottomPanelServer />
      </div>

    </div>
  );
}

