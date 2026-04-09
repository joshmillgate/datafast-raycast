import { useMemo } from "react";
import { List, ActionPanel, Action, Icon } from "@raycast/api";
import { usePromise } from "@raycast/utils";
import { fetchCountries, fetchRegions, fetchCities } from "./lib/api";
import { useDateRange } from "./lib/date-ranges";
import { DateRangeParams } from "./lib/types";
import { formatNumber, formatCurrency } from "./lib/format";

function CountryDetail({
  country,
  range,
}: {
  country: string;
  range: DateRangeParams;
}) {
  const regionParams = useMemo(
    () => ({ ...range, country, limit: 50 }),
    [range, country],
  );
  const cityParams = useMemo(
    () => ({ ...range, country, limit: 50 }),
    [range, country],
  );
  const { data: regions, isLoading: loadingRegions } = usePromise(
    fetchRegions,
    [regionParams],
  );
  const { data: cities, isLoading: loadingCities } = usePromise(fetchCities, [
    cityParams,
  ]);

  return (
    <List isLoading={loadingRegions || loadingCities} navigationTitle={country}>
      {regions && regions.length > 0 && (
        <List.Section title="Regions">
          {regions.map((r, i) => (
            <List.Item
              key={`region-${i}`}
              title={r.region || "Unknown"}
              icon={Icon.Map}
              accessories={[
                {
                  text: `${formatNumber(r.visitors)} visitors`,
                  icon: Icon.Person,
                },
                ...(r.revenue > 0
                  ? [
                      {
                        text: formatCurrency(r.revenue, "USD"),
                        icon: Icon.BankNote,
                      },
                    ]
                  : []),
              ]}
            />
          ))}
        </List.Section>
      )}
      {cities && cities.length > 0 && (
        <List.Section title="Cities">
          {cities.map((c, i) => (
            <List.Item
              key={`city-${i}`}
              title={c.city || "Unknown"}
              icon={Icon.Pin}
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
            />
          ))}
        </List.Section>
      )}
    </List>
  );
}

export default function Countries() {
  const { range, dropdown } = useDateRange("30d");

  const params = useMemo(() => ({ ...range, limit: 100 }), [range]);
  const { data, isLoading } = usePromise(fetchCountries, [params]);

  const countries = data || [];

  return (
    <List
      isLoading={isLoading}
      searchBarPlaceholder="Search countries..."
      searchBarAccessory={dropdown}
    >
      <List.Section title={`${countries.length} Countries`}>
        {countries.map((c, i) => (
          <List.Item
            key={`${c.country}-${i}`}
            title={c.country}
            icon={c.image ? { source: c.image } : Icon.Globe}
            keywords={[c.country]}
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
                  title="View Regions & Cities"
                  icon={Icon.Map}
                  target={<CountryDetail country={c.country} range={range} />}
                />
                <Action.CopyToClipboard
                  title="Copy Country"
                  icon={Icon.Clipboard}
                  content={c.country}
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
      {countries.length === 0 && !isLoading && (
        <List.EmptyView
          title="No Country Data"
          description="Try a different date range"
          icon={Icon.Globe}
        />
      )}
    </List>
  );
}
