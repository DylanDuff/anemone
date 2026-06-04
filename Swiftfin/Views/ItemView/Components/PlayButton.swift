//
// Swiftfin is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, you can obtain one at https://mozilla.org/MPL/2.0/.
//
// Copyright (c) 2026 Jellyfin & Jellyfin Contributors
//

import Defaults
import JellyfinAPI
import Logging
import SwiftUI

extension ItemView {

    struct PlayButton: View {

        @Default(.accentColor)
        private var accentColor

        @Router
        private var router

        @ObservedObject
        var viewModel: ItemViewModel

        private let logger = Logger.swiftfin()

        // MARK: - Validation

        private var isEnabled: Bool {
            viewModel.selectedMediaSource != nil
        }

        // MARK: - Title

        private var title: String {
            if let seriesViewModel = viewModel as? SeriesItemViewModel,
               let seasonEpisodeLabel = seriesViewModel.playButtonItem?.seasonEpisodeLabel
            {
                seasonEpisodeLabel
            } else if let playButtonLabel = viewModel.playButtonItem?.playButtonLabel {
                playButtonLabel
            } else {
                L10n.play
            }
        }

        // MARK: - Media Source

        private var source: String? {
            guard let sourceLabel = viewModel.selectedMediaSource?.displayTitle,
                  viewModel.item.mediaSources?.count ?? 0 > 1
            else {
                return nil
            }
            return sourceLabel
        }

        // MARK: - Label

        @ViewBuilder
        private var buttonLabel: some View {
            HStack {
                Image(systemName: "play.fill")

                VStack {
                    Text(title)

                    if let source {
                        Marquee(source, speed: 40, delay: 3, fade: 5)
                            .font(.caption)
                            .fontWeight(.medium)
                    }
                }
            }
            .padding(.horizontal, 20)
            .padding(.vertical, 14)
            .frame(maxWidth: .infinity)
            .font(.callout)
            .fontWeight(.semibold)
        }

        // MARK: - Context Menu

        @ViewBuilder
        private var menuItems: some View {
            if viewModel.playButtonItem?.userData?.playbackPositionTicks != 0 {
                Button(L10n.playFromBeginning, systemImage: "gobackward") {
                    play(fromBeginning: true)
                }
            }
        }

        // MARK: - Body

        var body: some View {
            if #available(iOS 26, *) {
                Button { play() } label: { buttonLabel }
                    .buttonStyle(.plain)
                    .foregroundStyle(.white)
                    .glassEffect(.regular, in: .capsule)
                    .enabled(isEnabled)
                    .contextMenu { menuItems }
            } else {
                Button { play() } label: { buttonLabel }
                    .buttonStyle(.tintedMaterial(tint: accentColor, foregroundColor: accentColor.overlayColor))
                    .isSelected(true)
                    .enabled(isEnabled)
                    .contextMenu { menuItems }
            }
        }

        // MARK: - Play Content

        private func play(fromBeginning: Bool = false) {
            guard let playButtonItem = viewModel.playButtonItem,
                  let selectedMediaSource = viewModel.selectedMediaSource
            else {
                logger.error("Play selected with no item or media source")
                return
            }

            let queue: (any MediaPlayerQueue)? = {
                if playButtonItem.type == .episode {
                    return EpisodeMediaPlayerQueue(episode: playButtonItem)
                }
                return nil
            }()

            let provider = MediaPlayerItemProvider(item: playButtonItem) { item in
                try await MediaPlayerItem.build(
                    for: item,
                    mediaSource: selectedMediaSource
                ) {
                    if fromBeginning {
                        $0.userData?.playbackPositionTicks = 0
                    }
                }
            }

            router.route(
                to: .videoPlayer(
                    provider: provider,
                    queue: queue
                )
            )
        }
    }
}
