//
// AnemoneReact is subject to the terms of the Mozilla Public License, v2.0.
//

import { Image, type ImageProps } from "expo-image";
import { isTV } from "./tv";

/** A quick fade as artwork arrives; cached images appear at once, so they don't fade. */
const FADE_DURATION = 150;

/**
 * Keep decoded artwork in memory on phones, tablets and web so returning to a page shows it at
 * once. The 1.8 GB test TV has been lmkd-killed before, so TV keeps only the disk cache there:
 * images still skip the network, and just decode again.
 */
const CACHE_POLICY = isTV ? "disk" : "memory-disk";

export type ArtworkProps = Omit<ImageProps, "source" | "placeholder"> & {
  /** The (sized — see `imagePixelWidth`) image URL; nothing is drawn without one. */
  uri: string | undefined;
  /** Shown blurred while the image loads (items carry one per image type). */
  blurHash?: string;
};

/**
 * Remote artwork (posters, backdrops, logos, avatars) through `expo-image`: cached on disk
 * across launches, so images already seen don't wait on the server. Use this for every server
 * image instead of React Native's `Image`.
 */
export function Artwork({ uri, blurHash, contentFit = "cover", ...props }: ArtworkProps) {
  return (
    <Image
      source={uri ? { uri } : null}
      placeholder={blurHash ? { blurhash: blurHash } : undefined}
      placeholderContentFit={contentFit}
      contentFit={contentFit}
      cachePolicy={CACHE_POLICY}
      transition={FADE_DURATION}
      {...props}
    />
  );
}
