import { cookies } from "next/headers";
import Resizable from "./resizable";
import { Layout } from "react-resizable-panels";
import RequestTabs from "@/components/request/RequestTabs";
import ResponsePanel from "@/components/response/ResponsePanel";
import BottomPanelServer from "@/components/bottompanel/BottomPanelServer";


export const dynamic = 'force-dynamic'; // <--- Add this
/**
 * Page component for the main dashboard layout.
 *
 * @remarks
 * This async server component initializes layout state from cookies
 * and renders the resizable dashboard, including:
 * - Request tabs panel
 * - Response panel
 * - Bottom server panel
 *
 * It retrieves user-specific layout preferences for both horizontal
 * and vertical arrangements from browser cookies and parses them
 * to pre-populate the `Resizable` component.
 *
 * @returns A React element containing the resizable dashboard panels.
 */
export default async function Page() {
  /**
   * Cookie key for storing horizontal layout preferences.
   */
  const groupIdHorizontal = 'dashboard-horizontal-layout';

  /**
   * Cookie key for storing vertical layout preferences.
   */
  const groupIdVertical = 'dashboard-vertical-layout';

  /**
   * API to access Next.js cookies.
   */
  const api = await cookies();

  /**
   * Default horizontal layout parsed from cookies if available.
   */
  const defaultLayoutStringHorizontal = api.get(groupIdHorizontal)?.value;
  const defaultLayoutHorizontal = defaultLayoutStringHorizontal
    ? (JSON.parse(defaultLayoutStringHorizontal) as Layout)
    : undefined;

  /**
   * Default vertical layout parsed from cookies if available.
   */
  const defaultLayoutStringVertical = api.get(groupIdVertical)?.value;
  const defaultLayoutVertical = defaultLayoutStringVertical
    ? (JSON.parse(defaultLayoutStringVertical) as Layout)
    : undefined;

  return (
    <Resizable
      defaultLayoutHorizontal={defaultLayoutHorizontal}
      defaultLayoutVertical={defaultLayoutVertical}
      requestTabs={<RequestTabs />}
      responsePanel={<ResponsePanel />}
      bottomPanelServer={<BottomPanelServer />}
    />
  );
}
