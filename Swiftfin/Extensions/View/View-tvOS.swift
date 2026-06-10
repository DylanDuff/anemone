//
// Swiftfin is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, you can obtain one at https://mozilla.org/MPL/2.0/.
//
// Copyright (c) 2026 Jellyfin & Jellyfin Contributors
//

#if os(tvOS)

import SwiftUI

/// Stand-in for Transmission's `PresentationCoordinator`, whose
/// presentation system is compiled out on tvOS.
struct PresentationCoordinator {

    var isPresented: Bool = false

    func dismiss() {}
}

extension EnvironmentValues {

    @Entry
    var presentationCoordinator: PresentationCoordinator = .init()
}

/// Stand-in for the Mantis package, which does not support tvOS.
/// Allows shared call sites of `photoPicker` to compile unchanged.
enum Mantis {

    enum CropShapeType {
        case rect
    }

    enum PresetFixedRatioType {
        case alwaysUsingOnePresetFixedRatio(ratio: Double)
        case canUseMultiplePresetFixedRatio(defaultRatio: Double)
    }
}

extension View {

    /// - Important: This does nothing on tvOS.
    @ViewBuilder
    func navigationBarTitleDisplayMode(_ mode: NavigationBarItem.TitleDisplayMode) -> some View {
        self
    }

    /// - Important: This does nothing on tvOS.
    @ViewBuilder
    func listRowSeparator(_ visibility: Visibility, edges: VerticalEdge.Set = .all) -> some View {
        self
    }

    /// - Important: This does nothing on tvOS.
    @ViewBuilder
    func statusBarHidden() -> some View {
        self
    }

    /// - Important: This does nothing on tvOS.
    @ViewBuilder
    func prefersStatusBarHidden(_ hidden: Bool = true) -> some View {
        self
    }

    /// - Important: This does nothing on tvOS.
    @ViewBuilder
    func photoPicker(
        isPresented: Binding<Bool>,
        isSaving: Bool,
        cropShape: Mantis.CropShapeType = .rect,
        presetRatio: Mantis.PresetFixedRatioType = .canUseMultiplePresetFixedRatio(defaultRatio: 0),
        onSave: @escaping (UIImage) -> Void
    ) -> some View {
        self
    }
}

#endif
