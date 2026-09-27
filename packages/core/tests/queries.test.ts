//
// AnemoneReact is subject to the terms of the Mozilla Public
// License, v2.0. Ported from Swiftfin (c) Jellyfin & Jellyfin Contributors.
//

import { beforeEach, describe, expect, it, vi } from "vitest";

// Capture the params the SDK is called with, and control responses.
const calls: Record<string, unknown> = {};

vi.mock("../src/jellyfin/api", () => ({
    getLibraryApi: () => ({
        getItems: async (p: unknown) => {
            calls.getItems = p;
            return { data: { Items: [{ Id: "i1" }, { Id: "i2" }], TotalRecordCount: 2 } };
        },
        getResumeItems: async (p: unknown) => {
            calls.getResumeItems = p;
            return { data: { Items: [{ Id: "resume1" }] } };
        },
        getLatestMedia: async (p: unknown) => {
            calls.getLatestMedia = p;
            return { data: [{ Id: "latest1" }] };
        },
        getItem: async (p: unknown) => {
            calls.getItem = p;
            return { data: { Id: "full1", Overview: "…" } };
        },
        getSimilarItems: async (p: unknown) => {
            calls.getSimilarItems = p;
            return { data: { Items: [{ Id: "similar1" }] } };
        },
        getSpecialFeatures: async () => ({
            data: [
                { Id: "featurette", ExtraType: "Featurette" },
                { Id: "theme", ExtraType: "ThemeSong" },
            ],
        }),
        getLocalTrailers: async () => ({ data: [{ Id: "trailer1" }] }),
    }),
    getVideoApi: () => ({
        getAdditionalPart: async (p: unknown) => {
            calls.getAdditionalPart = p;
            return { data: { Items: [{ Id: "part2" }] } };
        },
    }),
    getShowApi: () => ({
        getNextUp: async (p: unknown) => {
            calls.getNextUp = p;
            return { data: { Items: [{ Id: "next1" }] } };
        },
        getSeasons: async () => ({ data: { Items: [{ Id: "s1" }] } }),
        getEpisodes: async () => ({ data: { Items: [{ Id: "e1" }] } }),
    }),
    getSystemApi: () => ({
        getPublicSystemInfo: async () => ({ data: { ServerName: "thinky", Version: "10.11.0" } }),
    }),
    getUserViewApi: () => ({
        getUserViews: async (p: unknown) => {
            calls.getUserViews = p;
            return { data: { Items: [{ Id: "view1" }] } };
        },
    }),
    getPersonApi: () => ({
        getPersons: async (p: unknown) => {
            calls.getPersons = p;
            return { data: { Items: [{ Id: "person1", Type: "Person" }] } };
        },
    }),
    getGenreApi: () => ({
        getGenres: async () => ({ data: { Items: [{ Id: "g1" }] } }),
    }),
}));

import {
    additionalPartsQuery,
    itemQuery,
    latestInLibraryQuery,
    libraryItemsInfiniteQuery,
    libraryPageItems,
    localTrailersQuery,
    nextUpQuery,
    personItemsQuery,
    resumeItemsQuery,
    searchItemScopes,
    searchItemsQuery,
    searchPeopleQuery,
    searchFilterIncludes,
    searchScopeRequest,
    seriesPlayTargetQuery,
    itemsByIDsQuery,
    serverInfoQuery,
    similarItemsQuery,
    specialFeaturesQuery,
    userViewsQuery,
} from "../src/query/queries";
import {
    filterSearchGroups,
    groupSearchItems,
    withRecentItem,
} from "../src/query/recentSearchItems";
import type { QueryContext } from "../src/query/queryContext";

const ctx: QueryContext = { api: {} as never, userID: "u1" };
// The concrete query key tuple differs per builder; `never` satisfies every queryFn signature.
const fnCtx = {} as never;

beforeEach(() => {
    for (const key of Object.keys(calls)) {
        delete calls[key];
    }
});

describe("query option builders", () => {
    it("itemsByIDsQuery keeps the requested order and drops missing ids", async () => {
        const opts = itemsByIDsQuery(ctx, ["i2", "gone", "i1"]);
        const items = await opts.queryFn!(fnCtx);
        expect(items.map((item) => item.Id)).toEqual(["i2", "i1"]);
        expect(calls.getItems).toMatchObject({ userId: "u1", ids: ["i2", "gone", "i1"] });
    });

    it("groupSearchItems splits items into search's rows, keeping their order", () => {
        const groups = groupSearchItems([
            { Id: "m2", Type: "Movie" },
            { Id: "p1", Type: "Person" },
            { Id: "s1", Type: "Series" },
            { Id: "m1", Type: "Movie" },
            { Id: "f1", Type: "Folder" },
        ]);
        const byKey = Object.fromEntries(
            groups.categories.map((category) => [category.scope.key, category.items.map((item) => item.Id)]),
        );
        expect(byKey).toEqual({ movies: ["m2", "m1"], shows: ["s1"], episodes: [], collections: [] });
        expect(groups.people.map((person) => person.Id)).toEqual(["p1"]);
    });

    it("searchFilterIncludes gates which categories are fetched", () => {
        expect(searchFilterIncludes("all", "movies")).toBe(true);
        expect(searchFilterIncludes("all", "people")).toBe(true);
        expect(searchFilterIncludes("movies", "movies")).toBe(true);
        expect(searchFilterIncludes("movies", "people")).toBe(false);
        expect(searchFilterIncludes("people", "shows")).toBe(false);
    });

    it("filterSearchGroups keeps only the chosen category", () => {
        const groups = groupSearchItems([
            { Id: "m1", Type: "Movie" },
            { Id: "p1", Type: "Person" },
            { Id: "s1", Type: "Series" },
        ]);
        expect(filterSearchGroups(groups, "all")).toBe(groups);
        const movies = filterSearchGroups(groups, "movies");
        expect(movies.categories.map((category) => category.scope.key)).toEqual(["movies"]);
        expect(movies.people).toEqual([]);
        const people = filterSearchGroups(groups, "people");
        expect(people.categories).toEqual([]);
        expect(people.people.map((person) => person.Id)).toEqual(["p1"]);
    });

    it("withRecentItem moves an item to the front, without duplicates, capped", () => {
        expect(withRecentItem(["a", "b", "c"], "b")).toEqual(["b", "a", "c"]);
        expect(withRecentItem(["a", "b"], "c", 2)).toEqual(["c", "a"]);
    });

    it("serverInfoQuery returns the public system info", async () => {
        const opts = serverInfoQuery(ctx);
        expect(opts.queryKey).toEqual(["jellyfin", "u1", "serverInfo"]);
        expect(await opts.queryFn!(fnCtx)).toEqual({ ServerName: "thinky", Version: "10.11.0" });
    });

    it("userViewsQuery keys by user and unwraps Items", async () => {
        const opts = userViewsQuery(ctx);
        expect(opts.queryKey).toEqual(["jellyfin", "u1", "userViews"]);
        expect(await opts.queryFn!(fnCtx)).toEqual([{ Id: "view1" }]);
        expect(calls.getUserViews).toMatchObject({ userId: "u1" });
    });

    it("resumeItemsQuery passes video media type and limit", async () => {
        const result = await resumeItemsQuery(ctx, 5).queryFn!(fnCtx);
        expect(result).toEqual([{ Id: "resume1" }]);
        expect(calls.getResumeItems).toMatchObject({ userId: "u1", limit: 5 });
    });

    it("nextUpQuery unwraps Items", async () => {
        expect(await nextUpQuery(ctx).queryFn!(fnCtx)).toEqual([{ Id: "next1" }]);
    });

    it("latestInLibraryQuery returns the array directly", async () => {
        const opts = latestInLibraryQuery(ctx, "lib1");
        expect(opts.queryKey).toEqual(["jellyfin", "u1", "latestInLibrary", "lib1"]);
        expect(await opts.queryFn!(fnCtx)).toEqual([{ Id: "latest1" }]);
        expect(calls.getLatestMedia).toMatchObject({ parentId: "lib1" });
    });

    it("itemQuery fetches the full item by id", async () => {
        expect(await itemQuery(ctx, "i1").queryFn!(fnCtx)).toEqual({ Id: "full1", Overview: "…" });
        expect(calls.getItem).toMatchObject({ itemId: "i1", userId: "u1" });
    });

    it("item relations are keyed under the item so invalidating it covers them", () => {
        expect(similarItemsQuery(ctx, "i1").queryKey).toEqual([
            "jellyfin",
            "u1",
            "item",
            "i1",
            "similar",
        ]);
    });

    it("similarItemsQuery unwraps Items and passes the limit", async () => {
        expect(await similarItemsQuery(ctx, "i1", 7).queryFn!(fnCtx)).toEqual([{ Id: "similar1" }]);
        expect(calls.getSimilarItems).toMatchObject({ itemId: "i1", limit: 7 });
    });

    it("specialFeaturesQuery excludes theme songs", async () => {
        const features = await specialFeaturesQuery(ctx, "i1").queryFn!(fnCtx);
        expect(features.map((feature) => feature.Id)).toEqual(["featurette"]);
    });

    it("localTrailersQuery returns the array directly", async () => {
        expect(await localTrailersQuery(ctx, "i1").queryFn!(fnCtx)).toEqual([{ Id: "trailer1" }]);
    });

    it("additionalPartsQuery is only enabled for multi-part items", async () => {
        expect(additionalPartsQuery(ctx, { Id: "i1", PartCount: 1 }).enabled).toBe(false);
        const opts = additionalPartsQuery(ctx, { Id: "i1", PartCount: 2 });
        expect(opts.enabled).toBe(true);
        expect(await opts.queryFn!(fnCtx)).toEqual([{ Id: "part2" }]);
        expect(calls.getAdditionalPart).toMatchObject({ itemId: "i1" });
    });

    it("seriesPlayTargetQuery prefers next-up", async () => {
        expect(await seriesPlayTargetQuery(ctx, "series1").queryFn!(fnCtx)).toEqual({
            Id: "next1",
        });
        expect(calls.getNextUp).toMatchObject({ seriesId: "series1", limit: 1 });
        expect(calls.getResumeItems).toMatchObject({ parentId: "series1", limit: 1 });
        expect(calls.getItems).toMatchObject({ parentId: "series1", recursive: true, limit: 1 });
    });

    it("searchItemsQuery is disabled for an empty term", () => {
        expect(searchItemsQuery(ctx, "").enabled).toBe(false);
        expect(searchItemsQuery(ctx, "matrix").enabled).toBe(true);
    });

    it("searchScopeRequest limits each category to its item types", () => {
        const shows = searchItemScopes.find((scope) => scope.key === "shows")!;
        expect(searchScopeRequest(shows)).toEqual({ includeItemTypes: ["Series"], limit: 20 });
    });

    it("searchPeopleQuery searches people by name, disabled for an empty term", async () => {
        expect(searchPeopleQuery(ctx, " ").enabled).toBe(false);
        const opts = searchPeopleQuery(ctx, "keanu");
        expect(opts.queryKey).toEqual(["jellyfin", "u1", "searchPeople", "keanu"]);
        expect(await opts.queryFn!(fnCtx)).toEqual([{ Id: "person1", Type: "Person" }]);
        expect(calls.getPersons).toMatchObject({ userId: "u1", searchTerm: "keanu", limit: 20 });
    });

    it("personItemsQuery fetches a person's movies and shows, newest first", async () => {
        expect(await personItemsQuery(ctx, "person1").queryFn!(fnCtx)).toEqual([{ Id: "i1" }, { Id: "i2" }]);
        expect(calls.getItems).toMatchObject({
            userId: "u1",
            personIds: ["person1"],
            recursive: true,
            includeItemTypes: ["Movie", "Series"],
            sortBy: ["PremiereDate", "SortName"],
            sortOrder: ["Descending", "Ascending"],
        });
    });

    it("libraryItemsInfiniteQuery paginates via startIndex and computes next page", async () => {
        const opts = libraryItemsInfiniteQuery(ctx, { parentId: "lib1" }, 2);
        const page0 = await opts.queryFn!({ pageParam: 0 } as never);
        expect(calls.getItems).toMatchObject({ startIndex: 0, limit: 2, parentId: "lib1" });
        // full page of 2 => there is a next page (index 1)
        expect(opts.getNextPageParam!(page0, [page0], 0, [0])).toBe(1);

        // a short page => no next page
        const shortPage = { Items: [{ Id: "only" }] };
        expect(opts.getNextPageParam!(shortPage, [shortPage], 0, [0])).toBeUndefined();
    });

    it("libraryPageItems flattens pages and drops items repeated across a page boundary", () => {
        const pages = [{ Items: [{ Id: "a" }, { Id: "b" }] }, { Items: [{ Id: "b" }, { Id: "c" }] }];
        expect(libraryPageItems(pages).map((item) => item.Id)).toEqual(["a", "b", "c"]);
        expect(libraryPageItems(undefined)).toEqual([]);
    });
});
