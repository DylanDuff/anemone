//
// AnemoneReact is subject to the terms of the Mozilla Public
// License, v2.0. Ported from Swiftfin (c) Jellyfin & Jellyfin Contributors.
//
// Thin re-exports of the `@jellyfin/sdk` operation factories used across the view models, so call
// sites import them from one place (mirroring Swiftfin's `Paths.*` entry points).
//
// Note: in this SDK version, item queries (`getItems`, `getResumeItems`, `getLatestMedia`) live on
// `LibraryApi`, and Quick Connect + user authentication live on `AuthenticationApi`.
//

import type { Api } from "./client";
import { ImageUrlsApi } from "@jellyfin/sdk/lib/utils/api/image-urls-api";

export { getSystemApi } from "@jellyfin/sdk/lib/utils/api/system-api";
export { getUserApi } from "@jellyfin/sdk/lib/utils/api/user-api";
export { getUserViewApi } from "@jellyfin/sdk/lib/utils/api/user-view-api";
export { getLibraryApi } from "@jellyfin/sdk/lib/utils/api/library-api";
export { getShowApi } from "@jellyfin/sdk/lib/utils/api/show-api";
export { getGenreApi } from "@jellyfin/sdk/lib/utils/api/genre-api";
export { getUserDataApi } from "@jellyfin/sdk/lib/utils/api/user-data-api";
export { getAuthenticationApi } from "@jellyfin/sdk/lib/utils/api/authentication-api";
export { getBrandingApi } from "@jellyfin/sdk/lib/utils/api/branding-api";
export { getImageApi } from "@jellyfin/sdk/lib/utils/api/image-api";
export { getSearchApi } from "@jellyfin/sdk/lib/utils/api/search-api";
export { getVideoApi } from "@jellyfin/sdk/lib/utils/api/video-api";
export { getMediaInfoApi } from "@jellyfin/sdk/lib/utils/api/media-info-api";
export { getSessionApi } from "@jellyfin/sdk/lib/utils/api/session-api";
export { getPersonApi } from "@jellyfin/sdk/lib/utils/api/person-api";

export { ImageUrlsApi };

/**
 * Build an `ImageUrlsApi` for an `Api` instance. This class extends `ImageApi` with synchronous URL
 * builders (`getItemImageUrl`, `getUserImageUrl`, …) and has no `getXApi` factory of its own.
 */
export function getImageUrlsApi(api: Api): ImageUrlsApi {
    return new ImageUrlsApi(api.configuration, undefined, api.axiosInstance);
}
