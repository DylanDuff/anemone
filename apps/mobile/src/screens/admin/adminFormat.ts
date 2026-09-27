//
// AnemoneReact is subject to the terms of the Mozilla Public License, v2.0.
//
// How the admin pages present server records: device icons, now-playing titles and artwork.
//

import {
  type Api,
  formatClock,
  ImageType,
  itemImageSource,
  seasonEpisodeLabel,
  type SessionProgress,
  seriesImageSource,
} from "@anemone/core";
import type { BaseItemDto } from "@jellyfin/sdk/lib/generated-client/models/base-item-dto";
import type { IconName } from "../../ui/Icon";
import { imagePixelWidth } from "../../ui/imageSize";
import { ROW_LEADING_SIZE } from "./AdminRow";

const DEVICE_ICONS: readonly [RegExp, IconName][] = [
  [/tv|roku|fire|kodi|shield|chromecast/i, "tv-outline"],
  [/web|chrome|firefox|safari|edge|browser/i, "globe-outline"],
  [/ipad|tablet/i, "tablet-portrait-outline"],
  [/iphone|ios|android|mobile|phone/i, "phone-portrait-outline"],
  [/mac|windows|linux|desktop|theater|mpv/i, "desktop-outline"],
];

/** A best guess at the kind of device from its app and device names. */
export function deviceIcon(...names: (string | null | undefined)[]): IconName {
  const text = names.filter(Boolean).join(" ");
  return DEVICE_ICONS.find(([pattern]) => pattern.test(text))?.[1] ?? "hardware-chip-outline";
}

/** What's playing as a title and a detail line: an episode shows its series, then S/E and name. */
export function nowPlayingLabels(item: BaseItemDto): { title: string; detail?: string } {
  if (item.SeriesName) {
    const locator = seasonEpisodeLabel(item);
    return {
      title: item.SeriesName,
      detail: [locator, item.Name].filter(Boolean).join(" · "),
    };
  }
  return {
    title: item.Name ?? "Unknown",
    detail: item.ProductionYear ? String(item.ProductionYear) : undefined,
  };
}

/** A small poster of what's playing — the series poster for an episode. */
export function nowPlayingPosterURL(api: Api, item: BaseItemDto): string | undefined {
  const options = { maxWidth: imagePixelWidth(ROW_LEADING_SIZE) };
  return item.SeriesId
    ? seriesImageSource(api, item, ImageType.Primary, options).url
    : itemImageSource(api, item, ImageType.Primary, options).url;
}

/** "12:03 / 45:00". */
export function progressClock(progress: SessionProgress): string {
  return `${formatClock(progress.positionSeconds, progress.durationSeconds)} / ${formatClock(progress.durationSeconds)}`;
}

/** "8.4 Mbps" / "320 kbps". */
export function formatBitrate(bitsPerSecond: number | null | undefined): string | undefined {
  if (!bitsPerSecond) {
    return undefined;
  }
  return bitsPerSecond >= 1_000_000
    ? `${(bitsPerSecond / 1_000_000).toFixed(1)} Mbps`
    : `${Math.round(bitsPerSecond / 1000)} kbps`;
}

const HARDWARE_ACCELERATION_NAMES: Partial<Record<string, string>> = {
  amf: "AMD AMF",
  qsv: "Intel Quick Sync",
  nvenc: "NVIDIA NVENC",
  v4l2m2m: "V4L2",
  vaapi: "VA-API",
  videotoolbox: "VideoToolbox",
  rkmpp: "Rockchip MPP",
};

/** The transcoder's hardware acceleration by name; `undefined` for none (software). */
export function hardwareAccelerationName(type: string | undefined): string | undefined {
  return !type || type === "none" ? undefined : (HARDWARE_ACCELERATION_NAMES[type] ?? type);
}
