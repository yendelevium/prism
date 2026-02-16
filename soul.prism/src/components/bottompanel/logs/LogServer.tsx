import LogViewer from "./LogViewerPanel";

async function fetchLogs() {
  // TODO: Implement actual log fetching
  return [
    "[12:01:03] GET https://api.example.com",
    "[12:01:03] Authorization: Bearer ********",
    "[12:01:03] Response 200 OK (432ms)",
    "[12:01:03] GET https://api.example.com",
    "[12:01:03] Authorization: Bearer ********",
    "[12:01:03] Response 200 OK (432ms)",
    "[12:01:03] GET https://api.example.com",
    "[12:01:03] Authorization: Bearer ********",
    "[12:01:03] Response 200 OK (432ms)",
    "[12:01:03] GET https://api.example.com",
    "[12:01:03] Authorization: Bearer ********",
    "[12:01:03] Response 200 OK (432ms)",
  ];
}

export default async function LogsServer() {
  const logs = await fetchLogs();

  return <LogViewer logs={logs} />;
}
