import CollectionsSidebarPanel from "./collections/CollectionsSidebarPanel";
import EnvironmentServer from "./environment/EnvironmentServer";
import HistoryServer from "./history/HistoryServer";
import Sidebar from "./Sidebar";
import { WorkspaceSidebarClient } from "./workspaces/WorkspaceSidebarPanel";

export default function SidebarServer() {
  return (
    <Sidebar
      collections={<CollectionsSidebarPanel />}
      environments={<EnvironmentServer />}
      workspaces={<WorkspaceSidebarClient />}
      history={<HistoryServer />}
      none={
        <span className="text-sm text-[var(--text-secondary)]">
          No sidebar selected
        </span>
      }
    />
  );
}
