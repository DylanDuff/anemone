//
// AnemoneReact is subject to the terms of the Mozilla Public License, v2.0.
//

import { Column, Host, ScrollView, Text } from "@expo/ui";
import type { ReactNode } from "react";

/** Shared text colors so content is legible on the light background. */
export const colors = {
    text: "#111111",
    muted: "#555555",
    error: "#c0392b",
    background: "#ffffff",
} as const;

/** A simple padded, scrollable screen with a title, built from Expo UI universal components. */
export function Screen({ title, children }: { title: string; children: ReactNode }) {
    return (
        <Host style={{ flex: 1, backgroundColor: colors.background }}>
            <ScrollView>
                <Column spacing={16} style={{ padding: 24 }}>
                    <Text textStyle={{ fontSize: 24, fontWeight: "600", color: colors.text }}>
                        {title}
                    </Text>
                    {children}
                </Column>
            </ScrollView>
        </Host>
    );
}
