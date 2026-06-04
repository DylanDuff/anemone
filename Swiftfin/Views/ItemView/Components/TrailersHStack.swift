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
import Logging
import SwiftUI

extension ItemView {

    struct TrailersHStack: View {

        @StoredValue(.User.enabledTrailers)
        private var enabledTrailers: TrailerSelection

        @Router
        private var router

        @State
        private var error: Error?

        let localTrailers: [BaseItemDto]
        let externalTrailers: [NamedURL]

        private var visibleLocal: [BaseItemDto] {
            enabledTrailers.contains(.local) ? localTrailers : []
        }

        private var visibleExternal: [NamedURL] {
            enabledTrailers.contains(.external) ? externalTrailers : []
        }

        private var sortedTrailers: [TrailerItem] {
            let combined = visibleLocal.map(TrailerItem.local) + visibleExternal.map(TrailerItem.external)
            return combined.sorted { $0.thumbnailURL != nil && $1.thumbnailURL == nil }
        }

        var body: some View {
            if sortedTrailers.isNotEmpty {
                VStack(alignment: .leading, spacing: 0) {
                    Text(L10n.trailers)
                        .font(.title2)
                        .fontWeight(.semibold)
                        .edgePadding(.horizontal)
                        .padding(.bottom, 10)

                    CollectionHStack(
                        count: sortedTrailers.count,
                        columns: UIDevice.isPhone ? 1.5 : 3.5
                    ) { index in
                        switch sortedTrailers[index] {
                        case let .local(item):
                            LocalTrailerCard(trailer: item) { playLocal(item) }
                        case let .external(namedURL):
                            ExternalTrailerCard(trailer: namedURL) { playExternal(namedURL) }
                        }
                    }
                    .clipsToBounds(false)
                    .scrollBehavior(.continuousLeadingEdge)
                    .insets(horizontal: EdgeInsets.edgePadding)
                    .itemSpacing(EdgeInsets.edgePadding / 2)
                }
                .errorMessage($error)
            }
        }

        private func playLocal(_ trailer: BaseItemDto) {
            guard let mediaSource = trailer.mediaSources?.first else { return }
            router.route(to: .videoPlayer(item: trailer, mediaSource: mediaSource))
        }

        private func playExternal(_ trailer: NamedURL) {
            guard let urlString = trailer.url,
                  let url = URL(string: urlString),
                  UIApplication.shared.canOpenURL(url)
            else {
                error = ErrorMessage(L10n.unableToOpenTrailer)
                return
            }
            UIApplication.shared.open(url) { success in
                guard !success else { return }
                error = ErrorMessage(L10n.unableToOpenTrailer)
            }
        }
    }
}

// MARK: - Trailer Item

private enum TrailerItem {
    case local(BaseItemDto)
    case external(NamedURL)

    var thumbnailURL: URL? {
        switch self {
        case let .local(item):
            item.imageURL(.backdrop, maxWidth: 500) ?? item.imageURL(.primary, maxWidth: 500)
        case let .external(namedURL):
            youtubeThumbnailURL(from: namedURL.url ?? "")
        }
    }
}

private func youtubeThumbnailURL(from urlString: String) -> URL? {
    guard let url = URL(string: urlString) else { return nil }

    var videoID: String?

    if url.host?.contains("youtu.be") == true {
        videoID = url.pathComponents.dropFirst().first
    } else if url.host?.contains("youtube.com") == true {
        videoID = URLComponents(url: url, resolvingAgainstBaseURL: false)?
            .queryItems?.first(where: { $0.name == "v" })?.value
    }

    guard let id = videoID else { return nil }
    return URL(string: "https://img.youtube.com/vi/\(id)/maxresdefault.jpg")
}

// MARK: - Local Trailer Card

extension ItemView.TrailersHStack {

    struct LocalTrailerCard: View {

        let trailer: BaseItemDto
        let action: () -> Void

        var body: some View {
            TrailerCardLayout(
                thumbnailURL: trailer.imageURL(.backdrop, maxWidth: 500) ?? trailer.imageURL(.primary, maxWidth: 500),
                action: action
            )
        }
    }
}

// MARK: - External Trailer Card

extension ItemView.TrailersHStack {

    struct ExternalTrailerCard: View {

        let trailer: NamedURL
        let action: () -> Void

        var body: some View {
            TrailerCardLayout(
                thumbnailURL: youtubeThumbnailURL(from: trailer.url ?? ""),
                action: action
            )
        }
    }
}

// MARK: - Shared Card Layout

private struct TrailerCardLayout: View {

    let thumbnailURL: URL?
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            ImageView(thumbnailURL)
                .failure {
                    SystemImageContentView(systemName: "movieclapper")
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity)
                .posterStyle(.landscape)
                .posterShadow()
        }
        .buttonStyle(.plain)
    }
}
