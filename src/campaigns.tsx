import { useMemo } from "react";
import { List, ActionPanel, Action, Icon, Detail } from "@raycast/api";
import { usePromise } from "@raycast/utils";
import { fetchCampaigns } from "./lib/api";
import { useDateRange } from "./lib/date-ranges";
import { CampaignData } from "./lib/types";
import { formatNumber, formatCurrency } from "./lib/format";

function CampaignDetail({ campaign }: { campaign: CampaignData }) {
  const c = campaign.campaign;
  const parts = [
    c.utm_source && `**Source:** ${c.utm_source}`,
    c.utm_medium && `**Medium:** ${c.utm_medium}`,
    c.utm_campaign && `**Campaign:** ${c.utm_campaign}`,
    c.utm_term && `**Term:** ${c.utm_term}`,
    c.utm_content && `**Content:** ${c.utm_content}`,
    c.ref && `**Ref:** ${c.ref}`,
    c.source && `**Source (alt):** ${c.source}`,
    c.via && `**Via:** ${c.via}`,
  ].filter(Boolean);

  const markdown = `# Campaign Details

${parts.join("\n\n")}

---

| Metric | Value |
|--------|-------|
| Visitors | **${formatNumber(campaign.visitors)}** |
| Revenue | **${formatCurrency(campaign.revenue, "USD")}** |`;

  return (
    <Detail
      markdown={markdown}
      metadata={
        <Detail.Metadata>
          <Detail.Metadata.Label
            title="Visitors"
            text={formatNumber(campaign.visitors)}
            icon={Icon.Person}
          />
          <Detail.Metadata.Label
            title="Revenue"
            text={formatCurrency(campaign.revenue, "USD")}
            icon={Icon.BankNote}
          />
          <Detail.Metadata.Separator />
          {c.utm_source && (
            <Detail.Metadata.Label title="Source" text={c.utm_source} />
          )}
          {c.utm_medium && (
            <Detail.Metadata.Label title="Medium" text={c.utm_medium} />
          )}
          {c.utm_campaign && (
            <Detail.Metadata.Label title="Campaign" text={c.utm_campaign} />
          )}
          {c.utm_term && (
            <Detail.Metadata.Label title="Term" text={c.utm_term} />
          )}
          {c.utm_content && (
            <Detail.Metadata.Label title="Content" text={c.utm_content} />
          )}
          {c.ref && <Detail.Metadata.Label title="Ref" text={c.ref} />}
          {c.source && (
            <Detail.Metadata.Label title="Source (alt)" text={c.source} />
          )}
          {c.via && <Detail.Metadata.Label title="Via" text={c.via} />}
        </Detail.Metadata>
      }
      actions={
        <ActionPanel>
          <Action.CopyToClipboard
            title="Copy Campaign Name"
            content={c.utm_campaign || c.utm_source || ""}
          />
          <Action.OpenInBrowser
            title="Open Datafast Dashboard"
            url="https://datafa.st"
          />
        </ActionPanel>
      }
    />
  );
}

function getCampaignLabel(c: CampaignData): string {
  const { utm_campaign, utm_medium, utm_content, utm_term, ref, source, via } =
    c.campaign;
  if (utm_campaign) return utm_campaign;
  // Build a descriptive label from whatever fields are available
  const parts = [utm_medium, utm_content, utm_term, ref, source, via].filter(
    Boolean,
  );
  return parts.length > 0 ? parts.join(" / ") : "Direct / Unknown";
}

function getSourceLabel(c: CampaignData): string {
  return (
    c.campaign.utm_source || c.campaign.source || c.campaign.via || "Direct"
  );
}

function sourceIcon(source: string): Icon {
  const s = source.toLowerCase();
  if (s.includes("google")) return Icon.MagnifyingGlass;
  if (s.includes("twitter") || s.includes("x.com")) return Icon.Bird;
  if (s.includes("facebook") || s.includes("meta")) return Icon.TwoPeople;
  if (s.includes("email") || s.includes("newsletter")) return Icon.Envelope;
  return Icon.Megaphone;
}

export default function Campaigns() {
  const { range, dropdown } = useDateRange("30d");

  const params = useMemo(() => ({ ...range, limit: 100 }), [range]);
  const { data, isLoading } = usePromise(fetchCampaigns, [params]);

  const campaigns = data || [];

  // Group by source
  const grouped = new Map<string, CampaignData[]>();
  for (const c of campaigns) {
    const source = getSourceLabel(c);
    if (!grouped.has(source)) grouped.set(source, []);
    grouped.get(source)?.push(c);
  }

  return (
    <List
      isLoading={isLoading}
      searchBarPlaceholder="Search campaigns..."
      searchBarAccessory={dropdown}
    >
      {Array.from(grouped.entries()).map(([source, items]) => (
        <List.Section key={source} title={source}>
          {items.map((c, i) => (
            <List.Item
              key={`${source}-${i}`}
              title={getCampaignLabel(c)}
              subtitle={c.campaign.utm_medium || undefined}
              icon={sourceIcon(source)}
              keywords={[
                c.campaign.utm_source,
                c.campaign.utm_medium,
                c.campaign.utm_campaign,
                c.campaign.utm_term,
                c.campaign.utm_content,
              ].filter(Boolean)}
              accessories={[
                {
                  text: `${formatNumber(c.visitors)} visitors`,
                  icon: Icon.Person,
                },
                ...(c.revenue > 0
                  ? [
                      {
                        text: formatCurrency(c.revenue, "USD"),
                        icon: Icon.BankNote,
                      },
                    ]
                  : []),
              ]}
              actions={
                <ActionPanel>
                  <Action.Push
                    title="View Campaign Details"
                    icon={Icon.Eye}
                    target={<CampaignDetail campaign={c} />}
                  />
                  <Action.CopyToClipboard
                    title="Copy Campaign Name"
                    icon={Icon.Clipboard}
                    content={getCampaignLabel(c)}
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
      ))}
      {campaigns.length === 0 && !isLoading && (
        <List.EmptyView
          title="No Campaigns Found"
          description="Try a different date range"
          icon={Icon.Megaphone}
        />
      )}
    </List>
  );
}
