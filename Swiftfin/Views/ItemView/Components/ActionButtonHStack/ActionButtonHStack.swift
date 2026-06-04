//
// Swiftfin is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, you can obtain one at https://mozilla.org/MPL/2.0/.
//
// Copyright (c) 2026 Jellyfin & Jellyfin Contributors
//

import Defaults
import JellyfinAPI
import SwiftUI

extension ItemView {

    struct ActionButtonHStack: View {

        @Default(.accentColor)
        private var accentColor

        @ObservedObject
        var viewModel: ItemViewModel

        var equalSpacing: Bool = true

        // MARK: - Body

        var body: some View {
            HStack(alignment: .center, spacing: 10) {

                // MARK: - Select a Version

                if let mediaSources = viewModel.playButtonItem?.mediaSources,
                   mediaSources.count > 1
                {
                    VersionMenu(
                        viewModel: viewModel,
                        mediaSources: mediaSources
                    )
                    .menuStyle(.button)
                    .frame(maxWidth: .infinity)
                    .if(!equalSpacing) { view in
                        view.aspectRatio(1, contentMode: .fit)
                    }
                }
            }
            .font(.title3)
            .fontWeight(.semibold)
            .buttonStyle(.material)
            .labelStyle(.iconOnly)
        }
    }
}
