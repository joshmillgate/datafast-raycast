import { List, ActionPanel, Action, Icon, Detail, Color } from "@raycast/api";
import { usePromise } from "@raycast/utils";
import { fetchRealtime, fetchRealtimeMap } from "./lib/api";
import { RealtimeMapVisitor } from "./lib/types";
import { formatNumber } from "./lib/format";

function visitorLocation(v: RealtimeMapVisitor): string {
  const parts = [v.location?.city, v.location?.countryCode].filter(Boolean);
  return parts.length > 0 ? parts.join(", ") : "Unknown Location";
}

function deviceIcon(type: string | undefined): Icon {
  switch (type?.toLowerCase()) {
    case "mobile":
      return Icon.Mobile;
    case "tablet":
      return Icon.Mobile;
    default:
      return Icon.Monitor;
  }
}

function conversionColor(score: number): Color {
  if (score >= 70) return Color.Green;
  if (score >= 30) return Color.Yellow;
  return Color.SecondaryText;
}

function VisitorDetail({ visitor }: { visitor: RealtimeMapVisitor }) {
  const loc = visitor.location;
  const sys = visitor.system;
  const score = visitor.conversionLikelihood?.score;
  const params = visitor.params;

  const locationStr =
    [loc?.city, loc?.region, loc?.countryCode].filter(Boolean).join(", ") ||
    "Unknown";

  return (
    <Detail
      markdown={`# Visitor from ${visitorLocation(visitor)}

**Current Page:** ${visitor.currentUrl || "/"}

**Referrer:** ${visitor.referrer || "Direct"}

**Session started:** ${visitor.sessionStartTime ? new Date(visitor.sessionStartTime).toLocaleTimeString() : "Unknown"}`}
      metadata={
        <Detail.Metadata>
          <Detail.Metadata.Label
            title="Location"
            text={locationStr}
            icon={Icon.Pin}
          />
          <Detail.Metadata.Label
            title="Device"
            text={sys?.device?.type || "Unknown"}
            icon={deviceIcon(sys?.device?.type)}
          />
          <Detail.Metadata.Label
            title="Browser"
            text={sys?.browser?.name || "Unknown"}
            icon={Icon.Globe}
          />
          <Detail.Metadata.Label
            title="OS"
            text={sys?.os?.name || "Unknown"}
            icon={Icon.ComputerChip}
          />
          <Detail.Metadata.Separator />
          <Detail.Metadata.Label
            title="Current Page"
            text={visitor.currentUrl || "/"}
          />
          <Detail.Metadata.Label
            title="Referrer"
            text={visitor.referrer || "Direct"}
          />
          <Detail.Metadata.Label
            title="Visits"
            text={String(visitor.visitCount ?? 1)}
          />
          {params?.utm_source && (
            <Detail.Metadata.Label
              title="UTM Source"
              text={params.utm_source}
            />
          )}
          {params?.utm_campaign && (
            <Detail.Metadata.Label
              title="UTM Campaign"
              text={params.utm_campaign}
            />
          )}
          {params?.ref && (
            <Detail.Metadata.Label title="Ref" text={params.ref} />
          )}
          <Detail.Metadata.Separator />
          {score != null && (
            <Detail.Metadata.TagList title="Conversion Likelihood">
              <Detail.Metadata.TagList.Item
                text={`${score}%`}
                color={conversionColor(score)}
              />
            </Detail.Metadata.TagList>
          )}
          {visitor.isCustomer && (
            <Detail.Metadata.Label
              title="Customer"
              text={visitor.customerName || "Yes"}
              icon={Icon.Star}
            />
          )}
        </Detail.Metadata>
      }
      actions={
        <ActionPanel>
          <Action.CopyToClipboard
            title="Copy Current URL"
            content={visitor.currentUrl || ""}
          />
        </ActionPanel>
      }
    />
  );
}

export default function RealtimeVisitors() {
  const { data: realtime, isLoading: loadingCount } = usePromise(fetchRealtime);
  const { data: mapData, isLoading: loadingMap } = usePromise(fetchRealtimeMap);

  const visitors = mapData?.visitors || [];
  const count = realtime?.visitors ?? visitors.length;

  return (
    <List
      isLoading={loadingCount || loadingMap}
      navigationTitle={`${formatNumber(count)} Online`}
      searchBarPlaceholder="Search visitors by location, page, device..."
    >
      <List.Section title={`${formatNumber(count)} Active Visitors`}>
        {visitors.map((v, i) => {
          const score = v.conversionLikelihood?.score;
          const refSource = v.params?.utm_source || v.params?.ref || v.referrer;

          return (
            <List.Item
              key={v.visitorId || i}
              title={visitorLocation(v)}
              subtitle={v.currentUrl || "/"}
              icon={deviceIcon(v.system?.device?.type)}
              keywords={[
                v.location?.city,
                v.location?.countryCode,
                v.system?.browser?.name,
                v.system?.os?.name,
                v.system?.device?.type,
                v.currentUrl,
              ].filter((k): k is string => !!k)}
              accessories={[
                ...(refSource ? [{ text: refSource, icon: Icon.Link }] : []),
                ...(v.system?.browser?.name
                  ? [{ text: v.system.browser.name, icon: Icon.Globe }]
                  : []),
                ...(score != null
                  ? [
                      {
                        tag: {
                          value: `${score}% of conversion`,
                          color: conversionColor(score),
                        },
                      },
                    ]
                  : []),
              ]}
              actions={
                <ActionPanel>
                  <Action.Push
                    title="View Details"
                    icon={Icon.Eye}
                    target={<VisitorDetail visitor={v} />}
                  />
                  <Action.CopyToClipboard
                    title="Copy Page URL"
                    content={v.currentUrl || ""}
                  />
                  <Action.OpenInBrowser
                    title="Open Datafast Dashboard"
                    url="https://datafa.st"
                  />
                </ActionPanel>
              }
            />
          );
        })}
      </List.Section>
      {mapData?.recentEvents && mapData.recentEvents.length > 0 && (
        <List.Section title="Recent Events">
          {mapData.recentEvents.map((e) => (
            <List.Item
              key={e._id}
              title={
                e.type === "pageview" ? `Pageview: ${e.path || "/"}` : e.type
              }
              subtitle={new Date(e.timestamp).toLocaleTimeString()}
              icon={e.type === "pageview" ? Icon.Globe : Icon.Star}
              accessories={[
                ...(e.countryCode ? [{ text: e.countryCode }] : []),
              ]}
            />
          ))}
        </List.Section>
      )}
      {mapData?.recentPayments && mapData.recentPayments.length > 0 && (
        <List.Section title="Recent Payments">
          {mapData.recentPayments.map((p, i) => (
            <List.Item
              key={`payment-${i}`}
              title={`${p.currency || "$"}${p.amount ?? 0}`}
              subtitle={new Date(p.timestamp).toLocaleTimeString()}
              icon={Icon.BankNote}
              accessories={[
                ...(p.customerName ? [{ text: p.customerName }] : []),
              ]}
            />
          ))}
        </List.Section>
      )}
    </List>
  );
}
