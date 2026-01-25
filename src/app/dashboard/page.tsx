import RequestTabs from "@/components/request/RequestTabs";
import ResponsePanel from "@/components/response/ResponsePanel";

export default function DashboardHome() {
  console.log("[PAGE]", "DASHBOARD_REST_DEFAULT_LOADED");

  return (
    <div className="grid grid-cols-2 h-full">
      <RequestTabs />
      <ResponsePanel />
    </div>
  );
}
