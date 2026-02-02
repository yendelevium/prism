import CollectionsServer from "./collections/CollectionsServer";
import EnvironmentServer from "./environment/EnvironmentServer";
import HistoryServer from "./history/HistoryServer";
import Sidebar from "./Sidebar";

export default function SidebarServer() {
    return (
        <Sidebar 
            environments={<EnvironmentServer/>}
            collections={<CollectionsServer />}
            history={<HistoryServer />}
            none={
                <span className="text-sm text-[var(--text-secondary)]">
                    No sidebar selected
                </span>
            }
        />
    );
}