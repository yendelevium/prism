import BottomPanelClient from "./BottomPanel";
import GanttChartServer from "./gantt/GanttChartServer";
import LogsServer from "./logs/LogServer";
import { BottomView } from "./types";
import ServiceMapServer from "./servicemap/ServiceMapServer";
export default function BottomPanelServer({
  activeView = "logs",
}: {
  activeView?: BottomView;
}) {
  return (
    <BottomPanelClient
      logsView={<LogsServer />}
      ganttView={<GanttChartServer />}
      servicemapView={<ServiceMapServer />}
    />
  );
}
