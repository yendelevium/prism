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
    <div className="flex flex-col flex-1">
      <TopBar />
      
      <div className="flex h-screen">
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
