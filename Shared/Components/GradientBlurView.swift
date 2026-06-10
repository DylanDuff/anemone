//
// Swiftfin is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, you can obtain one at https://mozilla.org/MPL/2.0/.
//
// Copyright (c) 2026 Jellyfin & Jellyfin Contributors
//

import SwiftUI
import UIKit

// Three stacked dark material layers, each starting at a progressively lower
// position, creating a gradient blur effect from transparent at the top to
// fully blurred at the bottom.
struct GradientBlurView: View {

    // tvOS has no system material styles; use its traditional dark styles instead.
    #if os(tvOS)
    private static let thinStyle: UIBlurEffect.Style = .dark
    private static let mediumStyle: UIBlurEffect.Style = .dark
    private static let thickStyle: UIBlurEffect.Style = .extraDark
    #else
    private static let thinStyle: UIBlurEffect.Style = .systemUltraThinMaterialDark
    private static let mediumStyle: UIBlurEffect.Style = .systemThinMaterialDark
    private static let thickStyle: UIBlurEffect.Style = .systemMaterialDark
    #endif

    var body: some View {
        ZStack {
            BlurView(style: Self.thinStyle)
                .maskLinearGradient {
                    (location: 0, opacity: 0)
                    (location: 0.3, opacity: 1)
                    (location: 1, opacity: 1)
                }

            BlurView(style: Self.mediumStyle)
                .maskLinearGradient {
                    (location: 0.25, opacity: 0)
                    (location: 0.55, opacity: 1)
                    (location: 1, opacity: 1)
                }

            BlurView(style: Self.thickStyle)
                .maskLinearGradient {
                    (location: 0.5, opacity: 0)
                    (location: 0.8, opacity: 1)
                    (location: 1, opacity: 1)
                }
        }
    }
}
