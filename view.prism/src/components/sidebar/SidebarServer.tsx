import EnvironmentSidebarPanel from "./EnvironmentSidebarPanel";
import HistoryServer from "./history/HistoryServer";
import Sidebar from "./Sidebar";

export default function SidebarServer() {
    return (
        <Sidebar 
            environments={<EnvironmentSidebarPanel/>}
            collections={
                 <span className="text-sm text-[var(--text-primary)]">
                    Collections Sidebar Expanded
                 </span>
            }
            history={<HistoryServer />}
            none={
                <span className="text-sm text-[var(--text-secondary)]">
                    No sidebar selected
                </span>
            }
        />
    );
}