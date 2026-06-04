//
// Swiftfin is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, you can obtain one at https://mozilla.org/MPL/2.0/.
//
// Copyright (c) 2026 Jellyfin & Jellyfin Contributors
//

import Defaults
import Factory
import Foundation
import SwiftUI

// TODO: seems to redraw view when popped to sometimes?
//       - similar to MediaView TODO bug?
//       - indicated by snapping to the top
struct HomeView: View {

    @Default(.Customization.nextUpPosterType)
    private var nextUpPosterType

    @Router
    private var router

    @StateObject
    private var viewModel = HomeViewModel()

    @State
    private var scrollViewOffset: CGFloat = 0

    private var heroCarouselHeight: CGFloat {
        UIDevice.isPhone ? 260 : 460
    }

    @ViewBuilder
    private var contentView: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 0) {

                HeroCarouselView(viewModel: viewModel.recentlyAddedViewModel)

                VStack(alignment: .leading, spacing: 35) {

                    ContinueWatchingView(viewModel: viewModel)

                    NextUpView(viewModel: viewModel.nextUpViewModel) { item in
                        viewModel.send(.setIsPlayed(true, item))
                    }

                    ForEach(viewModel.libraries) { viewModel in
                        LatestInLibraryView(viewModel: viewModel)
                    }
                }
                .edgePadding(.vertical)
            }
        }
        .ignoresSafeArea(edges: .top)
        .scrollViewOffset($scrollViewOffset)
        .refreshable {
            viewModel.send(.refresh)
        }
        .navigationBarOffset(
            $scrollViewOffset,
            start: heroCarouselHeight - 90,
            end: heroCarouselHeight - 40
        )
    }

    var body: some View {
        ZStack {
            switch viewModel.state {
            case .content:
                contentView
            case let .error(error):
                ErrorView(error: error)
            case .initial, .refreshing:
                ProgressView()
            }
        }
        .animation(.linear(duration: 0.1), value: viewModel.state)
        .onFirstAppear {
            viewModel.send(.refresh)
        }
        .refreshable {
            viewModel.send(.refresh)
        }
        .topBarTrailing {

            if viewModel.backgroundStates.contains(.refresh) {
                ProgressView()
            }

            SettingsBarButton(
                server: viewModel.userSession.server,
                user: viewModel.userSession.user
            ) {
                router.route(to: .settings)
            }
        }
        .sinceLastDisappear { interval in
            if interval > 60 || viewModel.notificationsReceived.contains(.itemMetadataDidChange) {
                viewModel.send(.backgroundRefresh)
                viewModel.notificationsReceived.remove(.itemMetadataDidChange)
            }
        }
    }
}
