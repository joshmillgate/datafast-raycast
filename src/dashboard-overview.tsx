import {
  List,
  ActionPanel,
  Action,
  Color,
  Icon,
  updateCommandMetadata,
} from "@raycast/api";
import { usePromise } from "@raycast/utils";
import { useMemo, useEffect } from "react";
import { fetchOverview, fetchRealtime, fetchMetadata } from "./lib/api";
import { useDateRange } from "./lib/date-ranges";
import {
  formatNumber,
  formatCurrency,
  formatPercentage,
  formatDuration,
  formatChange,
} from "./lib/format";

export default function DashboardOverview() {
  const { range, previousRange, dropdown } = useDateRange("today");

  const { data: current, isLoading: loadingCurrent } = usePromise(
    fetchOverview,
    [range],
  );
  const prevParams = useMemo(() => previousRange, [previousRange]);
  const { data: previous, isLoading: loadingPrevious } = usePromise(
    fetchOverview,
    [prevParams],
  );
  const { data: realtime, isLoading: loadingRealtime } =
    usePromise(fetchRealtime);
  const { data: metadata } = usePromise(fetchMetadata);

  const isLoading = loadingCurrent || loadingPrevious || loadingRealtime;

  useEffect(() => {
    if (current) {
      const visitors = formatNumber(current.visitors);
      const revenue = formatCurrency(current.revenue, current.currency || "$");
      updateCommandMetadata({
        subtitle: `👤 ${visitors} visitors · 💰 ${revenue} revenue today`,
      });
    }
  }, [current]);

  const currency = current?.currency || "USD";

  function trendTag(
    currentVal: number,
    previousVal: number,
    invertColor = false,
  ) {
    const change = formatChange(currentVal, previousVal);
    const color = invertColor
      ? change.isPositive
        ? Color.Red
        : Color.Green
      : change.isPositive
        ? Color.Green
        : Color.Red;
    return { tag: { value: change.text, color } };
  }

  const metrics = current
    ? [
        {
          id: "visitors",
          label: "Visitors",
          value: formatNumber(current.visitors),
          icon: Icon.Person,
          trend: previous
            ? trendTag(current.visitors, previous.visitors)
            : undefined,
        },
        {
          id: "revenue",
          label: "Revenue",
          value: formatCurrency(current.revenue, currency),
          icon: Icon.BankNote,
          trend: previous
            ? trendTag(current.revenue, previous.revenue)
            : undefined,
        },
        {
          id: "conversion",
          label: "Conversion Rate",
          value: formatPercentage(current.conversion_rate),
          icon: Icon.LineChart,
          trend: previous
            ? trendTag(current.conversion_rate, previous.conversion_rate)
            : undefined,
        },
        {
          id: "rpv",
          label: "Revenue/Visitor",
          value: formatCurrency(current.revenue_per_visitor, currency),
          icon: Icon.Coins,
          trend: previous
            ? trendTag(
                current.revenue_per_visitor,
                previous.revenue_per_visitor,
              )
            : undefined,
        },
        {
          id: "bounce",
          label: "Bounce Rate",
          value: formatPercentage(current.bounce_rate),
          icon: Icon.ArrowCounterClockwise,
          trend: previous
            ? trendTag(current.bounce_rate, previous.bounce_rate, true)
            : undefined,
        },
        {
          id: "session",
          label: "Session Time",
          value: formatDuration(current.avg_session_duration),
          icon: Icon.Clock,
          trend: previous
            ? trendTag(
                current.avg_session_duration,
                previous.avg_session_duration,
              )
            : undefined,
        },
        {
          id: "online",
          label: "Online Now",
          value: realtime ? formatNumber(realtime.visitors) : "—",
          icon: { source: Icon.CircleFilled, tintColor: Color.Green },
          trend: undefined,
        },
      ]
    : [];

  return (
    <List
      isLoading={isLoading}
      searchBarAccessory={dropdown}
      searchBarPlaceholder={metadata?.name || metadata?.domain || "Dashboard"}
    >
      {metrics.map((m) => (
        <List.Item
          key={m.id}
          title={m.label}
          icon={m.icon}
          accessories={[
            { text: { value: m.value, color: Color.PrimaryText } },
            ...(m.trend ? [m.trend] : []),
          ]}
          actions={
            <ActionPanel>
              <Action.CopyToClipboard
                title={`Copy ${m.label}`}
                icon={Icon.Clipboard}
                content={m.value}
              />
              <Action.OpenInBrowser
                title="Open Datafast Dashboard"
                icon={Icon.Globe}
                url="https://datafa.st"
              />
            </ActionPanel>
          }
        />
      ))}
      {!isLoading && metrics.length === 0 && (
        <List.EmptyView
          title="No Data Available"
          description="Check your API key and try again"
          icon={Icon.Warning}
        />
      )}
    </List>
  );
}
