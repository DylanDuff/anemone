//
// AnemoneReact is subject to the terms of the Mozilla Public
// License, v2.0. Ported from Swiftfin (c) Jellyfin & Jellyfin Contributors.
//

import { getUserDataApi } from "./api";
import type { Api } from "./client";

/**
 * Mark an item played or unplayed for a user (Swiftfin `HomeViewModel.setIsPlayed`). Returns the
 * updated user item data from the server.
 */
export async function setItemPlayed(
    api: Api,
    userID: string,
    itemID: string,
    played: boolean,
): Promise<void> {
    const userDataApi = getUserDataApi(api);
    if (played) {
        await userDataApi.markPlayedItem({ userId: userID, itemId: itemID });
    } else {
        await userDataApi.markUnplayedItem({ userId: userID, itemId: itemID });
    }
}
