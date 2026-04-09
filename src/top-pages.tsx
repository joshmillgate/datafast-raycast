import { useMemo } from "react";
import { List, ActionPanel, Action, Icon } from "@raycast/api";
import { useCachedPromise } from "@raycast/utils";
import { fetchPages } from "./lib/api";
import { useDateRange } from "./lib/date-ranges";
import { formatNumber, formatCurrency } from "./lib/format";

export default function TopPages() {
  const { range, dropdown } = useDateRange("30d");
  const params = useMemo(() => ({ ...range, limit: 100 }), [range]);

  const { data, isLoading } = useCachedPromise(fetchPages, [params], {
    keepPreviousData: true,
    failureToastOptions: { title: "Failed to load pages" },
  });

  const pages = data || [];

  return (
    <List
      isLoading={isLoading}
      searchBarPlaceholder="Search pages..."
      searchBarAccessory={dropdown}
    >
      <List.Section title={`${pages.length} Pages`}>
        {pages.map((page, i) => (
          <List.Item
            key={`${page.hostname}-${page.path}-${i}`}
            title={page.path}
            subtitle={page.hostname}
            icon={Icon.Document}
            keywords={[page.hostname, page.path]}
            accessories={[
              {
                text: `${formatNumber(page.visitors)} visitors`,
                icon: Icon.Person,
              },
              ...(page.revenue > 0
                ? [
                    {
                      text: formatCurrency(page.revenue, "USD"),
                      icon: Icon.BankNote,
                    },
                  ]
                : []),
            ]}
            actions={
              <ActionPanel>
                <Action.OpenInBrowser
                  title="Open Page"
                  icon={Icon.Globe}
                  url={`https://${page.hostname}${page.path}`}
                />
                <Action.CopyToClipboard
                  title="Copy URL"
                  icon={Icon.Clipboard}
                  content={`https://${page.hostname}${page.path}`}
                />
                <Action.OpenInBrowser
                  title="Open Datafast Dashboard"
                  icon={Icon.ArrowRight}
                  url="https://datafa.st"
                />
              </ActionPanel>
            }
          />
        ))}
      </List.Section>
      {pages.length === 0 && !isLoading && (
        <List.EmptyView
          title="No Pages Found"
          description="Try a different date range"
          icon={Icon.Document}
        />
      )}
    </List>
  );
}
