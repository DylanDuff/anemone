//
// AnemoneReact is subject to the terms of the Mozilla Public License, v2.0.
//

import { formatLongDate, mediaSourceSummary } from "@anemone/core";
import type { BaseItemDto } from "@jellyfin/sdk/lib/generated-client/models/base-item-dto";
import { PersonKind } from "@jellyfin/sdk/lib/generated-client/models/person-kind";
import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useContentLayout } from "../../ui/contentLayout";
import { Focusable, focusGlow, FocusRing, focusRoom, useFocusIndicator } from "../../ui/Focusable";
import { SectionHeader } from "../../ui/Shelf";
import { space, theme } from "../../ui/theme";

const MAX_LISTED_TRACKS = 6;

function peopleOfKind(item: BaseItemDto, kind: PersonKind): string | undefined {
  const names = (item.People ?? [])
    .filter((person) => person.Type === kind && person.Name)
    .map((person) => person.Name as string);
  return names.length > 0 ? [...new Set(names)].join(", ") : undefined;
}

/** Summarise a long track list: the first few, then "+N more". */
function trackList(tracks: readonly string[]): string | undefined {
  if (tracks.length === 0) {
    return undefined;
  }
  const shown = tracks.slice(0, MAX_LISTED_TRACKS).join("\n");
  const hidden = tracks.length - MAX_LISTED_TRACKS;
  return hidden > 0 ? `${shown}\n+${hidden} more` : shown;
}

/**
 * Credits, dates, studios and per-version media details (Swiftfin `AboutView` +
 * `MediaSourcesCard`). Rows without a value are omitted.
 */
export function AboutSection({ item }: { item: BaseItemDto }) {
  const { insetLeft, insetRight } = useContentLayout();
  const details: Array<[label: string, value: string | undefined]> = [
    ["Directed by", peopleOfKind(item, PersonKind.Director)],
    ["Written by", peopleOfKind(item, PersonKind.Writer)],
    ["Studios", item.Studios?.map((studio) => studio.Name).filter(Boolean).join(", ")],
    ["Released", formatLongDate(item.PremiereDate)],
    ["Original title", item.OriginalTitle !== item.Name ? (item.OriginalTitle ?? undefined) : undefined],
  ];
  const versions = (item.MediaSources ?? []).map(mediaSourceSummary);
  const presentDetails = details.filter(([, value]) => Boolean(value));

  if (presentDetails.length === 0 && versions.length === 0) {
    return null;
  }

  return (
    <View style={styles.section}>
      <SectionHeader title="About" />
      <View style={[styles.cards, { paddingLeft: insetLeft, paddingRight: insetRight }]}>
        {presentDetails.length > 0 ? (
          <AboutCard label="Details">
            {presentDetails.map(([label, value]) => (
              <DetailRow key={label} label={label} value={value} />
            ))}
          </AboutCard>
        ) : null}

        {versions.map((version, index) => {
          const title = version.name ?? (versions.length > 1 ? `Version ${index + 1}` : "Media");
          return (
            <AboutCard key={index} label={title}>
              <Text style={styles.cardTitle}>{title}</Text>
              <DetailRow label="Container" value={version.container} />
              <DetailRow label="Video" value={version.video} />
              <DetailRow label="Audio" value={trackList(version.audio)} />
              <DetailRow label="Subtitles" value={trackList(version.subtitles)} />
            </AboutCard>
          );
        })}
      </View>
    </View>
  );
}

/**
 * A read-only info card. Focusable so the D-pad can reach it — which is also what lets a TV scroll
 * the page down to it. Large panels show focus with a ring and lighter surface rather than a lift.
 * Pressing does nothing.
 */
function AboutCard({ label, children }: { label: string; children: ReactNode }) {
  const indicator = useFocusIndicator();
  return (
    <Focusable
      onPress={() => undefined}
      accessibilityRole="summary"
      accessibilityLabel={label}
      style={({ focused }) => [
        styles.card,
        focused ? styles.cardFocused : null,
        focusGlow(indicator, focused),
      ]}
    >
      {({ focused }) => (
        <>
          {children}
          <FocusRing visible={focused} radius={theme.radii.lg} />
        </>
      )}
    </Focusable>
  );
}

function DetailRow({ label, value }: { label: string; value: string | undefined }) {
  if (!value) {
    return null;
  }
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: space(3),
  },
  // `SectionHeader` pulls what follows up by `focusRoom` (a shelf row pads its top by that much);
  // match it, which also leaves room for a focused card's glow.
  cards: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: space(2),
    paddingTop: focusRoom,
  },
  card: {
    flexGrow: 1,
    flexBasis: 360,
    maxWidth: 560,
    padding: space(2.5),
    borderRadius: theme.radii.lg,
    backgroundColor: theme.colors.surface,
    gap: space(1.5),
  },
  cardFocused: {
    backgroundColor: theme.colors.placeholder,
  },
  cardTitle: {
    ...theme.type.body,
    color: theme.colors.text,
    fontWeight: theme.weight.semibold,
  },
  row: {
    flexDirection: "row",
    gap: space(2),
  },
  label: {
    ...theme.type.caption,
    width: 110,
    color: theme.colors.muted,
  },
  value: {
    ...theme.type.caption,
    flex: 1,
    color: theme.colors.text,
    lineHeight: 19,
  },
});
