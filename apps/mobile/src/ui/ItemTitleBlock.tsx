//
// AnemoneReact is subject to the terms of the Mozilla Public License, v2.0.
//

import {
  type Api,
  displayTitle,
  itemMetadataLabels,
  logoImageSource,
  mediaAttributeBadges,
  seasonEpisodeLabel,
} from "@anemone/core";
import type { BaseItemDto } from "@jellyfin/sdk/lib/generated-client/models/base-item-dto";
import { BaseItemKind } from "@jellyfin/sdk/lib/generated-client/models/base-item-kind";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Artwork } from "./Artwork";
import { useGlassButtons } from "../settings";
import { Focusable } from "./Focusable";
import { GlassFill, glassFillHost } from "./Glass";
import { Icon } from "./Icon";
import { ItemActions } from "./ItemActions";
import { space, theme } from "./theme";
import { useIsCompact } from "./contentLayout";
import { imagePixelWidth } from "./imageSize";

/** Title-art box; logos are `contain`-fitted, so wide and tall logos both stay inside it. */
const LOGO_BOX = { width: 300, height: 100 };
/** Phones: a smaller box, so the logo doesn't crowd the artwork. */
const COMPACT_LOGO_BOX = { width: 210, height: 70 };

/**
 * Backdrop height for cinematic headers (item page, home hero): scales with the window but stays
 * within a range that leaves room for the title block.
 */
export function cinematicHeight(width: number): number {
  return Math.round(Math.min(Math.max(width * 0.42, 360), 640));
}

/**
 * An item's identity and primary actions, drawn over artwork: series link (episodes), logo or
 * title, facts line + media badges, genres, and Play / played / favorite. Shared by the item page
 * header and the home hero so both present an item the same way.
 */
export function ItemTitleBlock({
  api,
  item,
  onOpenSeries,
  showActions = true,
  preferFocus = false,
  onOpenDetails,
}: {
  api: Api;
  item: BaseItemDto;
  /** When set, an episode's series name becomes a link. */
  onOpenSeries?: (item: BaseItemDto) => void;
  /** The hero hides actions on off-screen slides to avoid fetching their play targets. */
  showActions?: boolean;
  /** Give the first action initial D-pad focus (TV). */
  preferFocus?: boolean;
  /** Adds an ⓘ action that opens the item page. */
  onOpenDetails?: (item: BaseItemDto) => void;
}) {
  // Wide screens (TV, web, tablets): actions and details share one row; phones stack them.
  const compact = useIsCompact();
  const split = !compact;
  const logoBox = compact ? COMPACT_LOGO_BOX : LOGO_BOX;
  const logo = logoImageSource(api, item, { maxWidth: imagePixelWidth(logoBox.width) }).url;
  const isEpisode = item.Type === BaseItemKind.Episode;
  const locator = isEpisode ? seasonEpisodeLabel(item) : undefined;
  const actions = showActions ? (
    <ItemActions
      item={item}
      preferFocus={preferFocus}
      onOpenDetails={onOpenDetails ? () => onOpenDetails(item) : undefined}
    />
  ) : null;

  return (
    <View style={[styles.block, split ? null : styles.blockStacked]}>
      {isEpisode && item.SeriesName ? (
        <Focusable onPress={() => onOpenSeries?.(item)} disabled={!onOpenSeries}>
          {({ focused }) => (
            <View style={styles.seriesRow}>
              <Text style={[styles.series, focused ? styles.seriesFocused : null]}>
                {item.SeriesName}
              </Text>
              {onOpenSeries ? (
                <Icon
                  name="chevron-forward"
                  size={16}
                  color={focused ? theme.colors.text : theme.colors.muted}
                />
              ) : null}
            </View>
          )}
        </Focusable>
      ) : null}

      {logo && !isEpisode ? (
        <TitleLogo uri={logo} label={displayTitle(item)} box={logoBox} />
      ) : (
        <Text numberOfLines={2} style={styles.title}>
          {locator ? `${locator} · ${displayTitle(item)}` : displayTitle(item)}
        </Text>
      )}

      {split ? (
        // One bottom row — actions left, details right, pushed to opposite edges.
        <View style={styles.splitRow}>
          {actions}
          <ItemDetails item={item} align="right" />
        </View>
      ) : (
        <>
          <ItemDetails item={item} align="left" />
          {actions}
        </>
      )}
    </View>
  );
}

/**
 * The title-art logo, fitted inside the logo box but anchored to its leading edge (in line with
 * the actions below). Once the logo loads the box shrinks to the fitted size, so the actions sit
 * right under it however wide or tall the logo is.
 */
function TitleLogo({
  uri,
  label,
  box,
}: {
  uri: string;
  label: string;
  box: { width: number; height: number };
}) {
  const [aspectRatio, setAspectRatio] = useState<number>();
  const fitted =
    aspectRatio == null
      ? box
      : aspectRatio >= box.width / box.height
        ? { width: box.width, height: box.width / aspectRatio }
        : { width: box.height * aspectRatio, height: box.height };

  return (
    <Artwork
      uri={uri}
      style={[styles.logo, fitted]}
      contentFit="contain"
      contentPosition="left"
      accessibilityLabel={label}
      onLoad={({ source }) => {
        if (source.width && source.height) {
          setAspectRatio(source.width / source.height);
        }
      }}
    />
  );
}

/** Facts chips (year, rating, runtime, score, media badges) over the genre line. */
function ItemDetails({ item, align }: { item: BaseItemDto; align: "left" | "right" }) {
  const facts = [...itemMetadataLabels(item), ...mediaAttributeBadges(item)];
  const genres = item.Genres ?? [];
  if (facts.length === 0 && genres.length === 0) {
    return null;
  }
  const right = align === "right";
  // Chips share the action buttons' glass (Settings → Glass buttons).
  const glass = useGlassButtons();

  return (
    <View style={[styles.details, right ? styles.detailsRight : null]}>
      {facts.length > 0 ? (
        <View style={[styles.facts, right ? styles.factsRight : null]}>
          {facts.map((fact) => (
            <View key={fact} style={[styles.fact, glass ? glassFillHost : null]}>
              {glass ? <GlassFill radius={theme.radii.sm} /> : null}
              <Text style={styles.factText}>{fact}</Text>
            </View>
          ))}
        </View>
      ) : null}
      {genres.length > 0 ? (
        <Text numberOfLines={1} style={[styles.genres, right ? styles.genresRight : null]}>
          {genres.join("  ·  ")}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  // No width cap here: the split row must span the content width so the details reach the right
  // edge. (Set-then-unset with `maxWidth: undefined` doesn't work — react-native-web drops
  // undefined values when merging styles, so the cap survived on web.)
  block: {
    gap: space(1.5),
  },
  // Stacked (phone) layout keeps text at a readable measure.
  blockStacked: {
    maxWidth: 900,
  },
  splitRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: space(4),
  },
  details: {
    gap: space(1.5),
  },
  detailsRight: {
    flexShrink: 1,
    alignItems: "flex-end",
  },
  factsRight: {
    justifyContent: "flex-end",
  },
  genresRight: {
    textAlign: "right",
  },
  seriesRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: space(0.5),
  },
  series: {
    ...theme.type.label,
    color: theme.colors.muted,
  },
  seriesFocused: {
    color: theme.colors.text,
    textDecorationLine: "underline",
  },
  logo: {
    maxWidth: "100%",
    alignSelf: "flex-start",
  },
  title: {
    ...theme.type.display,
    color: theme.colors.text,
  },
  facts: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: space(1),
  },
  fact: {
    paddingHorizontal: space(1),
    paddingVertical: space(0.375),
    borderRadius: theme.radii.sm,
    backgroundColor: theme.colors.chip,
    overflow: "hidden",
  },
  factText: {
    ...theme.type.caption,
    color: theme.colors.text,
    fontWeight: theme.weight.medium,
  },
  genres: {
    ...theme.type.callout,
    color: theme.colors.muted,
  },
});
