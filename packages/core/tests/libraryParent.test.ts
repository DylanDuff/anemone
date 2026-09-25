//
// AnemoneReact is subject to the terms of the Mozilla Public
// License, v2.0. Ported from Swiftfin (c) Jellyfin & Jellyfin Contributors.
//

import type { BaseItemDto } from "@jellyfin/sdk/lib/generated-client/models/base-item-dto";
import { BaseItemKind } from "@jellyfin/sdk/lib/generated-client/models/base-item-kind";
import { CollectionType } from "@jellyfin/sdk/lib/generated-client/models/collection-type";
import { describe, expect, it } from "vitest";
import { libraryParentRequest } from "../src/query/libraryParent";

describe("libraryParentRequest", () => {
    it("movies: recursive with a Movie type filter", () => {
        const view: BaseItemDto = {
            Id: "lib-movies",
            Type: BaseItemKind.CollectionFolder,
            CollectionType: CollectionType.Movies,
        };
        const request = libraryParentRequest(view);
        expect(request.parentId).toBe("lib-movies");
        expect(request.recursive).toBe(true);
        expect(request.includeItemTypes).toEqual([BaseItemKind.Movie]);
    });

    it("tvshows: non-recursive with a Series type filter", () => {
        const view: BaseItemDto = {
            Id: "lib-tv",
            Type: BaseItemKind.CollectionFolder,
            CollectionType: CollectionType.Tvshows,
        };
        const request = libraryParentRequest(view);
        expect(request.recursive).toBe(false);
        expect(request.includeItemTypes).toEqual([BaseItemKind.Series]);
    });

    it("user views recurse and apply no type filter", () => {
        const view: BaseItemDto = { Id: "uv", Type: BaseItemKind.UserView };
        const request = libraryParentRequest(view);
        expect(request.recursive).toBe(true);
        expect(request.includeItemTypes).toBeUndefined();
    });
});
