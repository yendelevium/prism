import Sidebar from "@/components/sidebar/Sidebar";
import RequestBar from "@/components/requestbar/RequestBar";
import TopBar from "@/components/topbar/TopBar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  console.log("[LAYOUT]", "DASHBOARD_LAYOUT_MOUNTED");

  return (
    <div className="flex flex-col h-full">

      <div className="flex-shrink-0 h-14">
        <TopBar />
      </div>
      
      <div className="flex flex-1 min-h-0">
        <Sidebar />

        <div className="flex flex-col flex-1">
          <RequestBar />

          <main className="flex-1 overflow-hidden border-t border-[var(--border-color)]">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
