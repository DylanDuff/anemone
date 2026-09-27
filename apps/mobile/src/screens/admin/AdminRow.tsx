//
// AnemoneReact is subject to the terms of the Mozilla Public License, v2.0.
//

import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Artwork } from "../../ui/Artwork";
import { Focusable } from "../../ui/Focusable";
import { Icon, type IconName } from "../../ui/Icon";
import { space, theme } from "../../ui/theme";
import { useAccent } from "../../settings";

/** The width of a row's leading artwork, icon or avatar. */
export const ROW_LEADING_SIZE = 48;

type BadgeTone = "accent" | "muted" | "error";

export interface RowBadge {
  readonly label: string;
  readonly tone?: BadgeTone;
}

/**
 * One card in an admin list: leading artwork, a title with badges, secondary lines, an optional
 * trailing value and extra content (a progress bar) underneath. The whole card is one focus
 * target that inverts while focused, like the settings rows.
 */
export function AdminRow({
  leading,
  title,
  badges,
  lines,
  trailing,
  children,
  onPress,
}: {
  leading: ReactNode;
  title: string;
  badges?: readonly RowBadge[];
  lines?: readonly (string | undefined)[];
  trailing?: string;
  children?: ReactNode;
  onPress: () => void;
}) {
  const shownLines = lines?.filter((line): line is string => !!line) ?? [];
  return (
    <Focusable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={[title, ...shownLines].join(", ")}
      style={({ pressed, focused }) => [
        styles.row,
        focused ? styles.rowFocused : null,
        pressed ? styles.pressed : null,
      ]}
    >
      {({ focused }) => (
        <>
          {leading}
          <View style={styles.body}>
            <View style={styles.titleLine}>
              <Text style={[styles.title, focused ? styles.focusedText : null]} numberOfLines={1}>
                {title}
              </Text>
              {badges?.map((badge) => (
                <Badge key={badge.label} {...badge} />
              ))}
            </View>
            {shownLines.map((line, index) => (
              <Text
                key={index}
                style={[styles.line, focused ? styles.focusedMuted : null]}
                numberOfLines={2}
              >
                {line}
              </Text>
            ))}
            {children}
          </View>
          {trailing ? (
            <Text style={[styles.line, focused ? styles.focusedMuted : null]}>{trailing}</Text>
          ) : null}
        </>
      )}
    </Focusable>
  );
}

const BADGE_COLORS: Record<Exclude<BadgeTone, "accent">, string> = {
  muted: theme.colors.muted,
  error: theme.colors.error,
};

function Badge({ label, tone = "muted" }: RowBadge) {
  const accent = useAccent().color;
  const color = tone === "accent" ? accent : BADGE_COLORS[tone];
  return (
    <View style={[styles.badge, { borderColor: color }]}>
      <Text style={[styles.badgeText, { color }]}>{label}</Text>
    </View>
  );
}

/** A round icon standing in for artwork (a device, a system event). */
export function RowIcon({ name, color = theme.colors.text }: { name: IconName; color?: string }) {
  return (
    <View style={styles.icon}>
      <Icon name={name} size={ROW_LEADING_SIZE / 2} color={color} />
    </View>
  );
}

/** A small poster (2:3) of what a session is playing. */
export function RowPoster({ url }: { url: string | undefined }) {
  return (
    <View style={styles.poster}>
      {url ? <Artwork uri={url} style={styles.posterImage} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: space(2),
    paddingVertical: space(1.5),
    paddingHorizontal: space(2),
    borderRadius: theme.radii.lg,
    backgroundColor: theme.colors.surface,
  },
  rowFocused: {
    backgroundColor: theme.colors.chipActive,
  },
  pressed: {
    opacity: 0.7,
  },
  body: {
    flex: 1,
    gap: space(0.5),
  },
  titleLine: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: space(1),
  },
  title: {
    ...theme.type.label,
    color: theme.colors.text,
    flexShrink: 1,
  },
  line: {
    ...theme.type.caption,
    color: theme.colors.muted,
  },
  focusedText: {
    color: theme.colors.chipActiveText,
  },
  focusedMuted: {
    color: theme.colors.chipActiveMuted,
  },
  badge: {
    paddingHorizontal: space(0.75),
    paddingVertical: space(0.125),
    borderRadius: theme.radii.sm,
    borderWidth: StyleSheet.hairlineWidth,
  },
  badgeText: {
    ...theme.type.micro,
  },
  icon: {
    width: ROW_LEADING_SIZE,
    height: ROW_LEADING_SIZE,
    borderRadius: theme.radii.pill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.placeholder,
  },
  poster: {
    width: ROW_LEADING_SIZE,
    aspectRatio: theme.poster.aspectRatio,
    borderRadius: theme.radii.sm,
    overflow: "hidden",
    backgroundColor: theme.colors.placeholder,
  },
  posterImage: {
    ...StyleSheet.absoluteFill,
  },
});
