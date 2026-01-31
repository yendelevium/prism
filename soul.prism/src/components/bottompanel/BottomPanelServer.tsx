import BottomPanelClient from './BottomPanel';
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
      ganttView={
        <span className="text-sm text-[var(--text-primary)]">
          Gantt Chart Viewer Displayed
        </span>
      }
    />
  );
}
