import RequestBar from "@/components/requestbar/RequestBar";
import SidebarServer from "@/components/sidebar/SidebarServer";
import { EnvironmentProvider } from "@/components/context/EnvironmentContext";
import DataStoreProvider from "../providers/DataStoreProvider";
import { listWorkspacesForUser } from "@/backend/workspace/workspace.service";
import { parseBackendWorkspace } from "@/@types/workspace";
import Topbar from "@/components/topbar/TopBar";
import { listWorkspacesAction } from "@/backend/workspace/workspace.actions";
import { unwrap } from "@/@types/actionResult";
import { listCollectionsByWorkspaceAction } from "@/backend/collection/collection.actions";
import { collectionToCollectionItem } from "../../@types/collectionItem";
import { WorkspaceCollectionSync } from "../providers/WorkspaceCollectionSync";
import { RequestDetailsSync } from "../providers/RequestDetailsSync";


export const dynamic = 'force-dynamic'; // <--- Add this
const userId = "user_1";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  console.log("[LAYOUT]", "DASHBOARD_LAYOUT_MOUNTED");

  const data = await getInitData();

  return (
    <DataStoreProvider workspaces={data.workspacesData}>
      <EnvironmentProvider>
        <WorkspaceCollectionSync/>
        <RequestDetailsSync/>
        
        <div className="flex flex-col h-full">
          <div className="flex-shrink-0 h-14">
            <Topbar />
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
    </DataStoreProvider>
  );
}

async function getInitData() {
  const workspacesData = unwrap(
    await listWorkspacesAction()
  ).map(ws => parseBackendWorkspace(ws)); 
  
  return {workspacesData: workspacesData};
}