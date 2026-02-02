import { cookies } from "next/headers";
import Resizable from "./resizable";
import { Layout } from "react-resizable-panels";
import RequestTabs from "@/components/request/RequestTabs";
import ResponsePanel from "@/components/response/ResponsePanel";
import BottomPanelServer from "@/components/bottompanel/BottomPanelServer";

export default async function Page() {

  const groupIdHorizontal = 'dashboard-horizontal-layout';
  const groupIdVertical = 'dashboard-vertical-layout';

  const api = await cookies();

  const defaultLayoutStringHorizontal = api.get(groupIdHorizontal)?.value;
  const defaultLayoutHorizontal = defaultLayoutStringHorizontal
    ? (JSON.parse(defaultLayoutStringHorizontal) as Layout)
    : undefined;

  const defaultLayoutStringVertical = api.get(groupIdVertical)?.value;
  const defaultLayoutVertical = defaultLayoutStringVertical
    ? (JSON.parse(defaultLayoutStringVertical) as Layout)
    : undefined;

  return <Resizable 
    defaultLayoutHorizontal={defaultLayoutHorizontal}
    defaultLayoutVertical={defaultLayoutVertical} 
    requestTabs={<RequestTabs />}
    responsePanel={<ResponsePanel />}
    bottomPanelServer={<BottomPanelServer />}
  />;

}