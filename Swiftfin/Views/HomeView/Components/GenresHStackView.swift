//
// Swiftfin is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, you can obtain one at https://mozilla.org/MPL/2.0/.
//
// Copyright (c) 2026 Jellyfin & Jellyfin Contributors
//

import CollectionHStack
import Factory
import JellyfinAPI
import SwiftUI

extension HomeView {

    struct GenresHStackView: View {

        @Router
        private var router

        let genres: [ItemGenre]

        private var columnCount: CGFloat {
            UIDevice.isPhone ? 1.5 : 3.5
        }

        var body: some View {
            if genres.isNotEmpty {
                VStack(alignment: .leading, spacing: 10) {
                    Text(L10n.genres)
                        .font(.title2)
                        .fontWeight(.semibold)
                        .edgePadding(.horizontal)

                    CollectionHStack(
                        uniqueElements: genres,
                        id: \.self,
                        columns: columnCount
                    ) { genre in
                        GenreCard(genre: genre) {
                            let viewModel = ItemLibraryViewModel(
                                title: genre.displayTitle,
                                id: genre.value,
                                filters: .init(genres: [genre])
                            )
                            router.route(to: .library(viewModel: viewModel))
                        }
                    }
                    .clipsToBounds(false)
                    .insets(horizontal: EdgeInsets.edgePadding)
                    .itemSpacing(EdgeInsets.edgePadding / 2)
                    .scrollBehavior(.continuousLeadingEdge)
                }
            }
        }
    }
}

extension HomeView {

    struct GenreCard: View {

        @Injected(\.currentUserSession)
        private var userSession: UserSession!

        @State
        private var imageSources: [ImageSource] = []

        let genre: ItemGenre
        let action: () -> Void

        private func loadImageSources() {
            Task { @MainActor in
                var parameters = Paths.GetItemsParameters()
                parameters.limit = 3
                parameters.isRecursive = true
                parameters.genres = [genre.value]
                parameters.includeItemTypes = BaseItemKind.supportedCases
                parameters.sortBy = [ItemSortBy.random]

                let request = Paths.getItems(parameters: parameters)
                let response = try? await userSession.client.send(request)
                self.imageSources = (response?.value.items ?? [])
                    .flatMap { $0.landscapeImageSources(maxWidth: 200) }
            }
        }

        private var titleLabel: some View {
            Text(genre.displayTitle)
                .font(.title2)
                .fontWeight(.semibold)
                .lineLimit(1)
                .multilineTextAlignment(.center)
                .frame(alignment: .center)
        }

        private func titleOverlay(with content: some View) -> some View {
            ZStack {
                content
                Color.black.opacity(0.5)
                titleLabel.foregroundStyle(.white)
            }
        }

        var body: some View {
            Button(action: action) {
                ImageView(imageSources)
                    .image { image in
                        titleOverlay(with: image)
                    }
                    .placeholder { imageSource in
                        titleOverlay(with: DefaultPlaceholderView(blurHash: imageSource.blurHash))
                    }
                    .failure {
                        Color.secondarySystemFill
                            .opacity(0.75)
                            .overlay {
                                titleLabel
                                    .foregroundColor(.primary)
                            }
                    }
                    .id(imageSources.hashValue)
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                    .posterStyle(.landscape)
            }
            .buttonStyle(.card)
            .onFirstAppear(perform: loadImageSources)
        }
    }
}
