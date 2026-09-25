//
// AnemoneReact is subject to the terms of the Mozilla Public License, v2.0.
//

import { Column, Host, ScrollView, Text } from "@expo/ui";
import type { ReactNode } from "react";

/** A simple padded, scrollable screen with a title, built from Expo UI universal components. */
export function Screen({ title, children }: { title: string; children: ReactNode }) {
    return (
        <Host style={{ flex: 1 }}>
            <ScrollView>
                <Column spacing={16} style={{ padding: 24 }}>
                    <Text textStyle={{ fontSize: 24, fontWeight: "600" }}>{title}</Text>
                    {children}
                </Column>
            </ScrollView>
        </Host>
    );
}
