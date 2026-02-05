import CollectionsServer from "./collections/CollectionsServer";
import EnvironmentServer from "./environment/EnvironmentServer";
import HistoryServer from "./history/HistoryServer";
import Sidebar from "./Sidebar";
import WorkspaceServer from "./workspaces/WorkspaceServer";

export default function SidebarServer() {
    return (
        <Sidebar 
            collections={<CollectionsServer />}
            environments={<EnvironmentServer/>}
            workspaces={<WorkspaceServer />}
            history={<HistoryServer />}
            none={
                <span className="text-sm text-[var(--text-secondary)]">
                    No sidebar selected
                </span>
            }
        />
    );
}