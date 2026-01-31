import RequestBar from "@/components/requestbar/RequestBar";
import TopBar from "@/components/topbar/TopBar";
import SidebarServer from "@/components/sidebar/SidebarServer";

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
        <SidebarServer />

        <div className="flex flex-col flex-1 min-h-0">
          <RequestBar />

          <main className="flex-1 overflow-hidden border-t border-[var(--border-color)] h-full">
            {children}
          </main>

        </div>
      </div>
    </div>
  );
}
