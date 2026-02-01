import BottomPanelClient from './BottomPanel';
import GanttChartServer from './gantt/GanttChartServer';
import LogsServer from './logs/LogServer';

type BottomView = 'logs' | 'gantt';

export default function BottomPanelServer({
  activeView = 'logs',
}: {
  activeView?: BottomView;
}) {
  return (
    <BottomPanelClient
      logsView={<LogsServer />}
      ganttView={<GanttChartServer />}
    />
  );
}
