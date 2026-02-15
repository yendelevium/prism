import HistorySidebar from "./HistorySidebarPanel";
import { HistoryItem } from "./types";

// TODO: Implement actual fetching of logs from DB
const mockHistory: HistoryItem[] = [
  {
    id: "1",
    method: "GET",
    url: "/api/users",
    timestamp: "2026-01-31 12:01:03",
  },
  {
    id: "2",
    method: "POST",
    url: "/api/login",
    timestamp: "2026-01-31 12:05:17",
  },
  {
    id: "3",
    method: "GET",
    url: "/api/products",
    timestamp: "2026-01-31 12:10:42",
  },
];

async function fetchHistory(): Promise<HistoryItem[]> {
  // Replace with real DB fetch later
  return mockHistory;
}

export default async function HistoryServer() {
  const history = await fetchHistory();
  return <HistorySidebar history={history} />;
}
