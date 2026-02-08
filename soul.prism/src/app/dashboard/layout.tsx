import RequestBar from "@/components/requestbar/RequestBar";
import TopBar from "@/components/topbar/TopBar";
import SidebarServer from "@/components/sidebar/SidebarServer";
import { EnvironmentProvider } from "@/components/context/EnvironmentContext";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  console.log("[LAYOUT]", "DASHBOARD_LAYOUT_MOUNTED");

  return (
    <EnvironmentProvider>
      <div className="flex flex-col h-full">

        <div className="flex-shrink-0 h-14">
          <TopBar />
        </div>

        <div className="flex flex-1 min-h-0 h-full w-full">
          <SidebarServer />

          <div className="flex flex-col flex-1 min-h-0 min-w-0">
            <RequestBar />

            <main className="flex-1 overflow-hidden border-t border-[var(--border-color)] h-full w-full">
              {children}
            </main>

          </div>
        </div>
      </div>
    </EnvironmentProvider>
  );
}
