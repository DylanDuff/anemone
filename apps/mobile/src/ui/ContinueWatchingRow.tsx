//
// AnemoneReact is subject to the terms of the Mozilla Public License, v2.0.
//

import {
  type Api,
  displayTitle,
  playedFraction,
  resumeFrameSource,
  seasonEpisodeLabel,
} from "@anemone/core";
import type { BaseItemDto } from "@jellyfin/sdk/lib/generated-client/models/base-item-dto";
import { BaseItemKind } from "@jellyfin/sdk/lib/generated-client/models/base-item-kind";
import { LandscapeCard } from "./LandscapeCard";
import { Shelf } from "./Shelf";
import { imagePixelWidth } from "./imageSize";
import { theme } from "./theme";

function titleFor(item: BaseItemDto): string {
  if (item.Type === BaseItemKind.Episode && item.SeriesName) {
    return item.SeriesName;
  }
  return displayTitle(item);
}

function subtitleFor(item: BaseItemDto): string | undefined {
  if (item.Type === BaseItemKind.Episode) {
    return [seasonEpisodeLabel(item), displayTitle(item)].filter(Boolean).join("  ");
  }
  return item.ProductionYear ? String(item.ProductionYear) : undefined;
}

/** "Continue Watching" — landscape resume cards with a progress bar. Hidden when empty. */
export function ContinueWatchingRow({
  api,
  items,
  onPressItem,
}: {
  api: Api;
  items: readonly BaseItemDto[];
  onPressItem?: (item: BaseItemDto) => void;
}) {
  if (items.length === 0) {
    return null;
  }

  return (
    <Shelf title="Continue Watching">
      {items.map((item, index) => (
        <LandscapeCard
          key={item.Id ?? index}
          item={item}
          imageURL={
            resumeFrameSource(api, item, { maxWidth: imagePixelWidth(theme.landscapeCard.width) })
              .url
          }
          title={titleFor(item)}
          subtitle={subtitleFor(item)}
          progress={playedFraction(item)}
          onPress={onPressItem}
        />
      ))}
    </Shelf>
  );
}
