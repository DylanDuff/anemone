//
// AnemoneReact is subject to the terms of the Mozilla Public
// License, v2.0. Ported from Swiftfin (c) Jellyfin & Jellyfin Contributors.
//

import type { BaseItemDto } from "@jellyfin/sdk/lib/generated-client/models/base-item-dto";
import { ImageType } from "@jellyfin/sdk/lib/generated-client/models/image-type";
import type { UserDto } from "@jellyfin/sdk/lib/generated-client/models/user-dto";
import { getImageUrlsApi } from "./api";
import type { Api } from "./client";

export { ImageType };

/**
 * An image URL paired with an optional BlurHash placeholder, mirroring Swiftfin's `ImageSource`.
 * The UI can render the BlurHash while the real image loads.
 */
export interface ImageSource {
    readonly url: string | undefined;
    readonly blurHash: string | undefined;
}

/** Optional sizing/quality parameters for an image request. */
export interface ImageRequestOptions {
    readonly maxWidth?: number;
    readonly maxHeight?: number;
    readonly quality?: number;
    readonly tag?: string;
}

/** The BlurHash string for an item's image of a given type, if the server provided one. */
export function blurHashString(item: BaseItemDto, type: ImageType): string | undefined {
    if (type === ImageType.Logo) {
        return undefined;
    }

    const hashesByType = item.ImageBlurHashes as
        | Record<string, Record<string, string>>
        | undefined
        | null;
    const hashes = hashesByType?.[type];
    if (!hashes) {
        return undefined;
    }

    const tag = (item.ImageTags as Record<string, string> | undefined | null)?.[type];
    if (tag && hashes[tag]) {
        return hashes[tag];
    }
    return Object.values(hashes)[0];
}

/**
 * Build an `ImageSource` for an item's image, using the SDK's URL builder (which handles the image
 * tag automatically) and attaching the BlurHash. Mirrors Swiftfin's `BaseItemDto.imageSource(_:)`.
 */
export function itemImageSource(
    api: Api,
    item: BaseItemDto,
    type: ImageType = ImageType.Primary,
    options: ImageRequestOptions = {},
): ImageSource {
    const url = getImageUrlsApi(api).getItemImageUrl(item, type, options);
    return { url, blurHash: blurHashString(item, type) };
}

/** Build an item image URL by id (Swiftfin `imageURL` by item id). */
export function itemImageURLById(
    api: Api,
    itemID: string,
    type: ImageType = ImageType.Primary,
    options: ImageRequestOptions = {},
): string {
    return getImageUrlsApi(api).getItemImageUrlById(itemID, type, options);
}

/**
 * Build an `ImageSource` for an item's *series* image (Swiftfin `seriesImageSource`). Used for
 * episodes that display their series artwork. No BlurHash is attached (matches Swiftfin).
 */
export function seriesImageSource(
    api: Api,
    item: BaseItemDto,
    type: ImageType = ImageType.Primary,
    options: ImageRequestOptions = {},
): ImageSource {
    const seriesID = item.SeriesId;
    if (!seriesID) {
        return { url: undefined, blurHash: undefined };
    }
    return { url: itemImageURLById(api, seriesID, type, options), blurHash: undefined };
}

/** A user's profile image URL (Swiftfin `UserState.profileImageSource`). */
export function userImageURL(api: Api, user: UserDto): string | undefined {
    return getImageUrlsApi(api).getUserImageUrl(user);
}
