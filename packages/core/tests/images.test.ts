//
// AnemoneReact is subject to the terms of the Mozilla Public
// License, v2.0. Ported from Swiftfin (c) Jellyfin & Jellyfin Contributors.
//

import { describe, expect, it } from "vitest";
import { JellyfinClientFactory } from "../src/jellyfin/client";
import {
    backdropImageSource,
    logoImageSource,
    personImageSource,
    resumeFrameSource,
} from "../src/jellyfin/images";
import { testIdentity } from "./support/testContainer";

const api = new JellyfinClientFactory(testIdentity).createApi("https://jf.example");

describe("backdropImageSource", () => {
    it("prefers the item's own backdrop", () => {
        const source = backdropImageSource(api, {
            Id: "movie",
            BackdropImageTags: ["b1"],
            ParentBackdropItemId: "parent",
            ParentBackdropImageTags: ["p1"],
        });
        expect(source.url).toBe("https://jf.example/Items/movie/Images/Backdrop?tag=b1");
    });

    it("falls back to the parent's backdrop (episode → series)", () => {
        const source = backdropImageSource(api, {
            Id: "episode",
            ParentBackdropItemId: "series",
            ParentBackdropImageTags: ["p1"],
        });
        expect(source.url).toBe("https://jf.example/Items/series/Images/Backdrop?tag=p1");
    });

    it("falls back to the Primary image", () => {
        const source = backdropImageSource(api, { Id: "x", ImageTags: { Primary: "t" } });
        expect(source.url).toBe("https://jf.example/Items/x/Images/Primary?tag=t");
    });
});

describe("logoImageSource", () => {
    it("uses the item's logo, then its parent's, else nothing", () => {
        expect(logoImageSource(api, { Id: "m", ImageTags: { Logo: "l" } }).url).toBe(
            "https://jf.example/Items/m/Images/Logo?tag=l",
        );
        expect(
            logoImageSource(api, { Id: "e", ParentLogoItemId: "s", ParentLogoImageTag: "sl" }).url,
        ).toBe("https://jf.example/Items/s/Images/Logo?tag=sl");
        expect(logoImageSource(api, { Id: "none" }).url).toBeUndefined();
    });
});

describe("personImageSource", () => {
    it("requires an id and a primary tag", () => {
        const source = personImageSource(api, {
            Id: "p",
            PrimaryImageTag: "t",
            ImageBlurHashes: { Primary: { t: "HASH" } },
        });
        expect(source).toEqual({
            url: "https://jf.example/Items/p/Images/Primary?tag=t",
            blurHash: "HASH",
        });
        expect(personImageSource(api, { Id: "p" }).url).toBeUndefined();
    });
});

describe("resumeFrameSource", () => {
    const resumeAt = (ticks: number) => ({ Key: "k", PlaybackPositionTicks: ticks });

    it("uses the chapter at/before the resume point, sized by the request", () => {
        const source = resumeFrameSource(
            api,
            {
                Id: "ep",
                UserData: resumeAt(150),
                Chapters: [
                    { StartPositionTicks: 0, ImageTag: "c0" },
                    { StartPositionTicks: 100, ImageTag: "c1" },
                    { StartPositionTicks: 200, ImageTag: "c2" },
                ],
            },
            { maxWidth: 559.6 },
        );
        expect(source.url).toBe("https://jf.example/Items/ep/Images/Chapter/1?tag=c1&maxWidth=560");
    });

    it("passes sizing to the fallback image when there is no chapter frame", () => {
        const source = resumeFrameSource(
            api,
            { Id: "movie", ImageTags: { Thumb: "t" }, UserData: resumeAt(10) },
            { maxWidth: 560 },
        );
        expect(source.url).toContain("/Items/movie/Images/Thumb");
        expect(source.url).toContain("maxWidth=560");
    });
});
