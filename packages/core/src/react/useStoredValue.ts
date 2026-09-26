//
// AnemoneReact is subject to the terms of the Mozilla Public
// License, v2.0. Ported from Swiftfin (c) Jellyfin & Jellyfin Contributors.
//
// React binding for a `StoredValues` key (Swiftfin's `@StoredValue` property wrapper). Values are
// cached in TanStack Query under the key's address, so every component reading the same key sees a
// write immediately — the reactivity `StoredValues` itself does not provide.
//

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import type { StoredValueKey } from "../data/storedValues";
import { useContainer } from "./context";

function storedValueQueryKey<Value>(key: StoredValueKey<Value>) {
    return ["storedValue", key.storage, key.ownerID, key.field, key.name] as const;
}

export interface StoredValueBinding<Value> {
    /** The persisted value, or the key's default until it has loaded. */
    readonly value: Value;
    /** False until the persisted value has been read — gate work that depends on it. */
    readonly isLoaded: boolean;
    /** Update the cached value immediately and persist it in the background. */
    readonly setValue: (value: Value) => void;
}

export function useStoredValue<Value>(key: StoredValueKey<Value>): StoredValueBinding<Value> {
    const { storedValues, logger } = useContainer();
    const queryClient = useQueryClient();
    const queryKey = storedValueQueryKey(key);

    const { data, isSuccess } = useQuery({
        queryKey,
        queryFn: () => storedValues.get(key),
        staleTime: Infinity,
    });

    const setValue = useCallback(
        (value: Value) => {
            queryClient.setQueryData(storedValueQueryKey(key), value);
            storedValues.set(key, value).catch((error: unknown) => {
                logger.log("error", "Failed to persist stored value", {
                    field: key.field,
                    error: String(error),
                });
            });
        },
        // `key` is rebuilt every render; its address fields identify it.
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [queryClient, storedValues, logger, key.storage, key.ownerID, key.field, key.name],
    );

    return { value: data ?? key.defaultValue(), isLoaded: isSuccess, setValue };
}
