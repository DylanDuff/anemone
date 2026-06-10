//
// Swiftfin is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, you can obtain one at https://mozilla.org/MPL/2.0/.
//
// Copyright (c) 2026 Jellyfin & Jellyfin Contributors
//

import SwiftUI

struct BackgroundParallaxHeaderModifier<Header: View>: ViewModifier {

    @Binding
    private var scrollViewOffset: CGFloat

    @State
    private var contentSize: CGSize = .zero

    private let height: CGFloat
    private let multiplier: CGFloat
    private let header: () -> Header

    init(
        _ scrollViewOffset: Binding<CGFloat>,
        height: CGFloat,
        multiplier: CGFloat = 1,
        @ViewBuilder header: @escaping () -> Header
    ) {
        self._scrollViewOffset = scrollViewOffset
        self.height = height
        self.multiplier = multiplier
        self.header = header
    }

    // Full app window width — wider than contentSize.width when a sidebar is open.
    private var windowWidth: CGFloat {
        UIApplication.shared.connectedScenes
            .compactMap { $0 as? UIWindowScene }
            .first?.keyWindow?.bounds.width ?? contentSize.width
    }

    // On iPhone, the header card starts below the notch.
    private var topInset: CGFloat {
        guard UIDevice.isPhone else { return 0 }
        let raw = UIApplication.shared.connectedScenes
            .compactMap { $0 as? UIWindowScene }
            .first?.keyWindow?.safeAreaInsets.top ?? 0
        return max(0, raw - 10)
    }

    @ViewBuilder
    private func builtHeader() -> some View {
        header()
            .offset(y: scrollViewOffset > 0 ? -scrollViewOffset * multiplier : 0)
            .scaleEffect(scrollViewOffset < 0 ? (height - scrollViewOffset) / height : 1, anchor: .top)
            .frame(width: windowWidth)
            .mask(alignment: .top) {
                VStack(spacing: 0) {
                    Color.clear
                        .frame(height: topInset)
                    Color.black
                        .clipShape(.rect(
                            topLeadingRadius: topInset > 0 ? 16 : 0,
                            bottomLeadingRadius: 0,
                            bottomTrailingRadius: 0,
                            topTrailingRadius: topInset > 0 ? 16 : 0,
                            style: .continuous
                        ))
                        .frame(height: max(0, height - scrollViewOffset - topInset))
                }
            }
    }

    func body(content: Content) -> some View {
        content
            .trackingSize($contentSize)
            .background(alignment: .topLeading) {
                if #available(iOS 26, tvOS 26, *) {
                    builtHeader()
                        .backgroundExtensionEffect()
                        .ignoresSafeArea()
                } else {
                    builtHeader()
                        .ignoresSafeArea()
                }
            }
    }
}
