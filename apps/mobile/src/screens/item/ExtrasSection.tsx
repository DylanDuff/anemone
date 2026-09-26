//
// AnemoneReact is subject to the terms of the Mozilla Public License, v2.0.
//

import {
  type Api,
  displayTitle,
  ImageType,
  itemImageSource,
  runtimeLabel,
  useAdditionalParts,
  useLocalTrailers,
  useSpecialFeatures,
} from "@anemone/core";
import type { BaseItemDto } from "@jellyfin/sdk/lib/generated-client/models/base-item-dto";
import { useCardWidths } from "../../ui/contentLayout";
import { LandscapeCard } from "../../ui/LandscapeCard";
import { Shelf } from "../../ui/Shelf";
import { imagePixelWidth } from "../../ui/imageSize";

/** Additional parts, trailers and special features — each its own shelf, hidden when empty. */
export function ExtrasSection({
  api,
  item,
  onPressItem,
}: {
  api: Api;
  item: BaseItemDto & { Id: string };
  onPressItem: (item: BaseItemDto) => void;
}) {
  const { data: parts = [] } = useAdditionalParts(item);
  const { data: trailers = [] } = useLocalTrailers(item.Id);
  const { data: features = [] } = useSpecialFeatures(item.Id);

  return (
    <>
      <ExtrasShelf api={api} title="Additional Parts" items={parts} onPressItem={onPressItem} />
      <ExtrasShelf api={api} title="Trailers" items={trailers} onPressItem={onPressItem} />
      <ExtrasShelf api={api} title="Special Features" items={features} onPressItem={onPressItem} />
    </>
  );
}

function ExtrasShelf({
  api,
  title,
  items,
  onPressItem,
}: {
  api: Api;
  title: string;
  items: readonly BaseItemDto[];
  onPressItem: (item: BaseItemDto) => void;
}) {
  const cardWidth = useCardWidths().extraCard;
  if (items.length === 0) {
    return null;
  }

  return (
    <Shelf title={title}>
      {items.map((extra, index) => (
        <LandscapeCard
          key={extra.Id ?? index}
          item={extra}
          width={cardWidth}
          imageURL={
            itemImageSource(api, extra, ImageType.Primary, {
              maxWidth: imagePixelWidth(cardWidth),
            }).url
          }
          title={displayTitle(extra)}
          subtitle={runtimeLabel(extra)}
          onPress={onPressItem}
        />
      ))}
    </Shelf>
  );
}
