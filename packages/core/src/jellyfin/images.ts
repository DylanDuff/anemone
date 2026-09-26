//
// AnemoneReact is subject to the terms of the Mozilla Public
// License, v2.0. Ported from Swiftfin (c) Jellyfin & Jellyfin Contributors.
//

import type { BaseItemDto } from "@jellyfin/sdk/lib/generated-client/models/base-item-dto";
import type { BaseItemPerson } from "@jellyfin/sdk/lib/generated-client/models/base-item-person";
import { BaseItemKind } from "@jellyfin/sdk/lib/generated-client/models/base-item-kind";
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

const NO_IMAGE: ImageSource = { url: undefined, blurHash: undefined };

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
        return NO_IMAGE;
    }
    return { url: itemImageURLById(api, seriesID, type, options), blurHash: undefined };
}

/**
 * The best wide backdrop for an item: its own backdrop, then its parent's (an episode/season shows
 * its series backdrop), then its Primary image as a last resort. Used by the hero and item headers.
 */
export function backdropImageSource(
    api: Api,
    item: BaseItemDto,
    options: ImageRequestOptions = {},
): ImageSource {
    const ownTag = item.BackdropImageTags?.[0];
    if (ownTag && item.Id) {
        return {
            url: itemImageURLById(api, item.Id, ImageType.Backdrop, { ...options, tag: ownTag }),
            blurHash: blurHashString(item, ImageType.Backdrop),
        };
    }

    const parentTag = item.ParentBackdropImageTags?.[0];
    if (parentTag && item.ParentBackdropItemId) {
        return {
            url: itemImageURLById(api, item.ParentBackdropItemId, ImageType.Backdrop, {
                ...options,
                tag: parentTag,
            }),
            blurHash: undefined,
        };
    }

    return itemImageSource(api, item, ImageType.Primary, options);
}

/**
 * The item's logo (title treatment), falling back to its parent's logo so episodes show the series
 * logo. `url` is undefined when neither exists — callers then render the plain title.
 */
export function logoImageSource(
    api: Api,
    item: BaseItemDto,
    options: ImageRequestOptions = {},
): ImageSource {
    const ownTag = (item.ImageTags as Record<string, string> | undefined | null)?.[ImageType.Logo];
    if (ownTag && item.Id) {
        return {
            url: itemImageURLById(api, item.Id, ImageType.Logo, { ...options, tag: ownTag }),
            blurHash: undefined,
        };
    }

    if (item.ParentLogoImageTag && item.ParentLogoItemId) {
        return {
            url: itemImageURLById(api, item.ParentLogoItemId, ImageType.Logo, {
                ...options,
                tag: item.ParentLogoImageTag,
            }),
            blurHash: undefined,
        };
    }

    return NO_IMAGE;
}

/** A cast/crew member's portrait (Swiftfin `BaseItemPerson.portraitImageSources`). */
export function personImageSource(
    api: Api,
    person: BaseItemPerson,
    options: ImageRequestOptions = {},
): ImageSource {
    if (!person.Id || !person.PrimaryImageTag) {
        return NO_IMAGE;
    }
    const hashes = person.ImageBlurHashes?.Primary;
    return {
        url: itemImageURLById(api, person.Id, ImageType.Primary, {
            ...options,
            tag: person.PrimaryImageTag,
        }),
        blurHash: hashes?.[person.PrimaryImageTag] ?? undefined,
    };
}

/** A user's profile image URL (Swiftfin `UserState.profileImageSource`). */
/**
 * A saved user's avatar, for the user picker (no signed-in session, so no `Api`): Jellyfin serves
 * `/Users/{id}/Images/Primary` without auth. `undefined` when the user has no image (`tag`).
 */
export function savedUserImageURL(
    serverURL: string,
    userID: string,
    tag: string | undefined,
    options: Omit<ImageRequestOptions, "tag"> = {},
): string | undefined {
    if (!tag) {
        return undefined;
    }
    const params = new URLSearchParams({ tag });
    for (const key of ["maxWidth", "maxHeight", "quality"] as const) {
        const value = options[key];
        if (value != null) {
            params.set(key, String(value));
        }
    }
    return `${serverURL.replace(/\/+$/, "")}/Users/${userID}/Images/Primary?${params}`;
}

export function userImageURL(api: Api, user: UserDto): string | undefined {
    return getImageUrlsApi(api).getUserImageUrl(user);
}

/**
 * Build a chapter image URL: `/Items/{id}/Images/Chapter/{index}?tag=…&maxWidth=…`. Hand-built
 * because the SDK's URL builder has no image-index path segment; sizing params are passed through
 * so the server scales the frame instead of the client decoding a full-resolution one.
 */
function chapterImageURL(
    api: Api,
    itemID: string,
    index: number,
    tag: string,
    options: ImageRequestOptions,
): string {
    const base = api.basePath.replace(/\/+$/, "");
    const params = new URLSearchParams({ tag });
    for (const key of ["maxWidth", "maxHeight", "quality"] as const) {
        const value = options[key];
        if (value != null) {
            params.set(key, String(Math.round(value)));
        }
    }
    return `${base}/Items/${itemID}/Images/Chapter/${index}?${params.toString()}`;
}

/**
 * The best available still frame for a "continue watching" item — approximating the frame the user
 * is resuming from.
 *
 * Prefers the chapter image at/just-before the resume position (a real frame near the resume point),
 * then a landscape fallback: an episode's Primary image is itself a 16:9 still, so it is preferred
 * for episodes; movies fall back to Thumb/Backdrop then Primary.
 *
 * For the pixel-exact frame at the resume second, Jellyfin's trickplay tiles would be needed — that
 * requires sprite cropping and is a follow-up (see docs/BACKLOG.md).
 *
 * Always pass a `maxWidth`: chapter frames and backdrops are full video resolution (up to 4K), and a
 * row of them decoded at that size is enough to exhaust a TV's memory.
 */
export function resumeFrameSource(
    api: Api,
    item: BaseItemDto,
    options: ImageRequestOptions = {},
): ImageSource {
    const position = item.UserData?.PlaybackPositionTicks ?? 0;
    const chapters = item.Chapters ?? [];

    let chapter: { index: number; tag: string } | undefined;
    chapters.forEach((info, index) => {
        if ((info.StartPositionTicks ?? 0) <= position && info.ImageTag) {
            chapter = { index, tag: info.ImageTag };
        }
    });

    if (chapter && item.Id) {
        return {
            url: chapterImageURL(api, item.Id, chapter.index, chapter.tag, options),
            blurHash: undefined,
        };
    }

    const fallbackOrder: ImageType[] =
        item.Type === BaseItemKind.Episode
            ? [ImageType.Primary, ImageType.Thumb, ImageType.Backdrop]
            : [ImageType.Thumb, ImageType.Backdrop, ImageType.Primary];

    for (const type of fallbackOrder) {
        const source = itemImageSource(api, item, type, options);
        if (source.url) {
            return source;
        }
    }

    return NO_IMAGE;
}
