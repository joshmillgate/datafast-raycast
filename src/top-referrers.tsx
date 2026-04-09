import { useMemo } from "react";
import { List, ActionPanel, Action, Icon } from "@raycast/api";
import { useCachedPromise } from "@raycast/utils";
import { fetchReferrers } from "./lib/api";
import { useDateRange } from "./lib/date-ranges";
import { formatNumber, formatCurrency } from "./lib/format";

export default function TopReferrers() {
  const { range, dropdown } = useDateRange("30d");
  const params = useMemo(() => ({ ...range, limit: 100 }), [range]);

  const { data, isLoading } = useCachedPromise(fetchReferrers, [params], {
    keepPreviousData: true,
    failureToastOptions: { title: "Failed to load referrers" },
  });

  const referrers = data || [];

  return (
    <List
      isLoading={isLoading}
      searchBarPlaceholder="Search referrers..."
      searchBarAccessory={dropdown}
    >
      <List.Section title={`${referrers.length} Referrers`}>
        {referrers.map((ref, i) => {
          const domain = ref.referrer || "Direct";
          const faviconUrl = ref.referrer
            ? `https://www.google.com/s2/favicons?domain=${encodeURIComponent(ref.referrer)}&sz=64`
            : undefined;

          return (
            <List.Item
              key={`${domain}-${i}`}
              title={domain}
              icon={faviconUrl ? { source: faviconUrl } : Icon.Link}
              keywords={[domain]}
              accessories={[
                {
                  text: `${formatNumber(ref.visitors)} visitors`,
                  icon: Icon.Person,
                },
                ...(ref.revenue > 0
                  ? [
                      {
                        text: formatCurrency(ref.revenue, "USD"),
                        icon: Icon.BankNote,
                      },
                    ]
                  : []),
              ]}
              actions={
                <ActionPanel>
                  {ref.referrer && (
                    <Action.OpenInBrowser
                      title="Open Referrer"
                      icon={Icon.Globe}
                      url={`https://${ref.referrer}`}
                    />
                  )}
                  <Action.CopyToClipboard
                    title="Copy Referrer"
                    icon={Icon.Clipboard}
                    content={domain}
                  />
                  <Action.OpenInBrowser
                    title="Open Datafast Dashboard"
                    icon={Icon.ArrowRight}
                    url="https://datafa.st"
                  />
                </ActionPanel>
              }
            />
          );
        })}
      </List.Section>
      {referrers.length === 0 && !isLoading && (
        <List.EmptyView
          title="No Referrers Found"
          description="Try a different date range"
          icon={Icon.Link}
        />
      )}
    </List>
  );
}
