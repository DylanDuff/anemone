//
// AnemoneReact is subject to the terms of the Mozilla Public License, v2.0.
//

import { displayTitle, libraryParentRequest, premiereYear, useLibraryItems } from "@anemone/core";
import type { BaseItemDto } from "@jellyfin/sdk/lib/generated-client/models/base-item-dto";
import { Button, Column, Text } from "@expo/ui";
import { colors, Screen } from "../ui/Screen";

function itemLabel(item: BaseItemDto): string {
    const year = premiereYear(item);
    return year ? `${displayTitle(item)} (${year})` : displayTitle(item);
}

/** The full contents of a library, as a paged text list. A poster grid is a follow-up. */
export function LibraryItemsScreen({
    library,
    onBack,
}: {
    library: BaseItemDto;
    onBack: () => void;
}) {
    const title = displayTitle(library);
    const { data, isLoading, error, hasNextPage, fetchNextPage, isFetchingNextPage } =
        useLibraryItems(libraryParentRequest(library));

    const items: BaseItemDto[] = (data?.pages ?? []).flatMap((page) => page.Items ?? []);

    return (
        <Screen title={title}>
            <Button label="‹ Home" variant="text" onPress={onBack} />
            {isLoading ? <Text textStyle={{ color: colors.muted }}>Loading…</Text> : null}
            {error ? <Text textStyle={{ color: colors.error }}>{String(error)}</Text> : null}
            {!isLoading && items.length === 0 ? (
                <Text textStyle={{ color: colors.muted }}>No items in this library.</Text>
            ) : null}
            <Column spacing={6}>
                {items.map((item) => (
                    <Text key={item.Id ?? Math.random().toString()} textStyle={{ color: colors.text }}>
                        {itemLabel(item)}
                    </Text>
                ))}
            </Column>
            {hasNextPage ? (
                <Button
                    label={isFetchingNextPage ? "Loading…" : "Load more"}
                    onPress={() => void fetchNextPage()}
                />
            ) : null}
        </Screen>
    );
}
