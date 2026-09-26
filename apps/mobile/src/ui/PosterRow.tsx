//
// AnemoneReact is subject to the terms of the Mozilla Public License, v2.0.
//

import type { Api } from "@anemone/core";
import type { BaseItemDto } from "@jellyfin/sdk/lib/generated-client/models/base-item-dto";
import { Poster } from "./Poster";
import { Shelf } from "./Shelf";

/** A titled, horizontally-scrolling row of posters. Renders nothing when there are no items. */
export function PosterRow({
  title,
  items,
  api,
  onPressItem,
  onPressTitle,
}: {
  title: string;
  items: readonly BaseItemDto[];
  api: Api;
  onPressItem?: (item: BaseItemDto) => void;
  onPressTitle?: () => void;
}) {
  if (items.length === 0) {
    return null;
  }

  return (
    <Shelf title={title} onPressTitle={onPressTitle} gap={25}>
      {items.map((item, index) => (
        <Poster key={item.Id ?? index} api={api} item={item} onPress={onPressItem} />
      ))}
    </Shelf>
  );
}
