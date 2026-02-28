import BottomPanelClient from "./BottomPanel";
import GanttChartClient from "./gantt/GanttChartPanel";
import LogsServer from "./logs/LogServer";
import { BottomView } from "./types";
import ServiceMapPanel from "./servicemap/ServicemapPanel";
export default function BottomPanelServer({
  activeView = "logs",
}: {
  activeView?: BottomView;
}) {
  return (
    <BottomPanelClient
      logsView={<LogsServer />}
      ganttView={<GanttChartClient />}
      servicemapView={<ServiceMapPanel />}
    />
  );
}
