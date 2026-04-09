import { open, getPreferenceValues, closeMainWindow } from "@raycast/api";
import { Preferences } from "./lib/types";

export default async function OpenRealtimeMap() {
  await closeMainWindow();
  const { dashboardId } = getPreferenceValues<Preferences>();
  const base = dashboardId
    ? `https://datafa.st/dashboard/${dashboardId}`
    : "https://datafa.st";
  await open(`${base}?realtime=1`);
}
