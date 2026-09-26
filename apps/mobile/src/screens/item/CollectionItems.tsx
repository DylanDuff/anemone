//
// AnemoneReact is subject to the terms of the Mozilla Public License, v2.0.
//

import { type Api, type ItemsRequest, libraryPageItems, useLibraryItems } from "@anemone/core";
import type { BaseItemDto } from "@jellyfin/sdk/lib/generated-client/models/base-item-dto";
import { ItemSortBy } from "@jellyfin/sdk/lib/generated-client/models/item-sort-by";
import { PosterRow } from "../../ui/PosterRow";

/** A box set's members in release order (Swiftfin `CollectionItemContentView`). */
export function CollectionItems({
  api,
  collection,
  onPressItem,
}: {
  api: Api;
  collection: BaseItemDto & { Id: string };
  onPressItem: (item: BaseItemDto) => void;
}) {
  const request: ItemsRequest = {
    parentId: collection.Id,
    sortBy: [ItemSortBy.ProductionYear, ItemSortBy.SortName],
  };
  const { data } = useLibraryItems(request);
  const items = libraryPageItems(data?.pages);

  return <PosterRow title="In This Collection" api={api} items={items} onPressItem={onPressItem} />;
}
