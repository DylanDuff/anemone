//
// AnemoneReact is subject to the terms of the Mozilla Public License, v2.0.
//

import type { Api } from "@anemone/core";
import type { BaseItemDto } from "@jellyfin/sdk/lib/generated-client/models/base-item-dto";
import { StyleSheet, useWindowDimensions, View } from "react-native";
import { BackButton } from "../../ui/BackButton";
import { GlassScope } from "../../ui/Glass";
import { heroGeometry, SlideArtwork } from "../../ui/HeroSlide";
import { ItemTitleBlock } from "../../ui/ItemTitleBlock";
import { space, theme } from "../../ui/theme";
import { isTV } from "../../ui/tv";

/** How far the title block is pulled up over the backdrop's dissolving bottom. */
const TITLE_OVERLAP = space(18);

/**
 * The cinematic header (Swiftfin `CinematicScrollView`), drawn exactly like a home hero slide: the
 * backdrop dissolves into its glow (Settings → Hero glow), which spills below the header under the
 * page content. The title block is pulled up over the backdrop's dissolving bottom.
 *
 * The artwork area is `slideHeight` tall (backdrop + glow spill); the body is then pulled back up by
 * the spill so the page flows on at the backdrop's height, over the glow.
 */
export function ItemHeader({
  api,
  item,
  onOpenSeries,
}: {
  api: Api;
  item: BaseItemDto;
  onOpenSeries: (item: BaseItemDto) => void;
}) {
  const { width } = useWindowDimensions();
  const geometry = heroGeometry(width);

  // One scope: the artwork is the backdrop the title block's glass buttons blur (Glass buttons).
  return (
    <GlassScope>
      <View>
        <View style={{ height: geometry.slideHeight }}>
          <SlideArtwork api={api} item={item} width={width} geometry={geometry} />
          <View style={styles.back}>
            <BackButton />
          </View>
        </View>

        <View style={[styles.body, { marginTop: -(geometry.spill + TITLE_OVERLAP) }]}>
          <ItemTitleBlock api={api} item={item} onOpenSeries={onOpenSeries} preferFocus={isTV} />
        </View>
      </View>
    </GlassScope>
  );
}

const styles = StyleSheet.create({
  back: {
    position: "absolute",
    top: space(3),
    left: theme.gutter,
  },
  body: {
    paddingHorizontal: theme.gutter,
  },
});
