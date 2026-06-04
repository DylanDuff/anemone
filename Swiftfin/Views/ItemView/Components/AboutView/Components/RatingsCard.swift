//
// Swiftfin is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, you can obtain one at https://mozilla.org/MPL/2.0/.
//
// Copyright (c) 2026 Jellyfin & Jellyfin Contributors
//

import JellyfinAPI
import SwiftUI

// MARK: - Critic Rating Card

extension ItemView.AboutView {

    struct CriticRatingCard: View {

        let rating: Float

        var body: some View {
            RatingCardLayout(
                // swiftlint:disable:next hard_coded_display_string
                score: String(format: "%.0f%%", rating),
                label: L10n.criticRating.uppercased()
            ) {
                if rating >= 60 {
                    Image(.tomatoFresh)
                        .symbolRenderingMode(.multicolor)
                } else {
                    Image(.tomatoRotten)
                        .symbolRenderingMode(.monochrome)
                }
            }
        }
    }
}

// MARK: - Community Rating Card

extension ItemView.AboutView {

    struct CommunityRatingCard: View {

        let rating: Float

        var body: some View {
            RatingCardLayout(
                // swiftlint:disable:next hard_coded_display_string
                score: String(format: "%.1f", rating),
                label: L10n.communityRating.uppercased()
            ) {
                Image(systemName: "star.fill")
                    .foregroundStyle(.yellow)
            }
        }
    }
}

// MARK: - Shared Layout

private struct RatingCardLayout<Icon: View>: View {

    let score: String
    let label: String
    @ViewBuilder
    let icon: Icon

    var body: some View {
        ZStack(alignment: .topLeading) {
            Rectangle()
                .fill(Color.systemFill)
                .cornerRadius(ratio: 1 / 12, of: \.height)

            VStack(alignment: .leading, spacing: 6) {
                HStack(alignment: .firstTextBaseline, spacing: 6) {
                    icon
                        .font(.title)

                    // swiftlint:disable:next hard_coded_display_string
                    Text(score)
                        .font(.largeTitle)
                        .fontWeight(.bold)
                }

                Text(label)
                    .font(.caption)
                    .fontWeight(.semibold)
                    .foregroundStyle(.secondary)
                    .kerning(0.5)
            }
            .padding()
        }
    }
}
