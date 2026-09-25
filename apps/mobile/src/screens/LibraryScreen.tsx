//
// AnemoneReact is subject to the terms of the Mozilla Public License, v2.0.
//

import {
    displayTitle,
    libraryParentRequest,
    premiereYear,
    useLibraryItems,
    useSessionController,
    useUserViews,
} from "@anemone/core";
import type { BaseItemDto } from "@jellyfin/sdk/lib/generated-client/models/base-item-dto";
import { Button, Column, Text } from "@expo/ui";
import { useState } from "react";
import { Screen } from "../ui/Screen";

/** Browse the signed-in server: libraries, then the items inside a chosen library. */
export function LibraryScreen() {
    const [library, setLibrary] = useState<BaseItemDto | null>(null);

    if (library) {
        return <LibraryItemsScreen library={library} onBack={() => setLibrary(null)} />;
    }
    return <LibraryListScreen onSelect={setLibrary} />;
}

function LibraryListScreen({ onSelect }: { onSelect: (view: BaseItemDto) => void }) {
    const sessionController = useSessionController();
    const { data: views, isLoading, error } = useUserViews();

    return (
        <Screen title="Libraries">
            {isLoading ? <Text textStyle={{ color: "#555" }}>Loading libraries…</Text> : null}
            {error ? <Text textStyle={{ color: "#c0392b" }}>{String(error)}</Text> : null}
            <Column spacing={8}>
                {(views ?? []).map((view) => (
                    <Button
                        key={view.Id ?? view.Name ?? Math.random().toString()}
                        label={displayTitle(view)}
                        onPress={() => onSelect(view)}
                    />
                ))}
            </Column>
            <Button label="Sign out" variant="text" onPress={() => void sessionController.signOut()} />
        </Screen>
    );
}

function itemLabel(item: BaseItemDto): string {
    const year = premiereYear(item);
    return year ? `${displayTitle(item)} (${year})` : displayTitle(item);
}

function LibraryItemsScreen({
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
            <Button label="‹ Libraries" variant="text" onPress={onBack} />
            {isLoading ? <Text textStyle={{ color: "#555" }}>Loading…</Text> : null}
            {error ? <Text textStyle={{ color: "#c0392b" }}>{String(error)}</Text> : null}
            {!isLoading && items.length === 0 ? (
                <Text textStyle={{ color: "#555" }}>No items in this library.</Text>
            ) : null}
            <Column spacing={6}>
                {items.map((item) => (
                    <Text key={item.Id ?? Math.random().toString()}>{itemLabel(item)}</Text>
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
