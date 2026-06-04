//
// Swiftfin is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, you can obtain one at https://mozilla.org/MPL/2.0/.
//
// Copyright (c) 2026 Jellyfin & Jellyfin Contributors
//

import CollectionHStack
import Defaults
import IdentifiedCollections
import JellyfinAPI
import SwiftUI

// TODO: rename `AboutItemView`
// TODO: see what to do about bottom padding
//       - don't like it adds more than the edge
//       - just have this determine bottom padding
//         instead of scrollviews?

extension ItemView {

    struct AboutView: View {

        private enum AboutViewItem: Identifiable {
            case overview
            case mediaSource(MediaSourceInfo)
            case criticRating(Float)
            case communityRating(Float)

            var id: String? {
                switch self {
                case .overview:
                    "overview"
                case let .mediaSource(source):
                    source.id
                case .criticRating:
                    "criticRating"
                case .communityRating:
                    "communityRating"
                }
            }
        }

        @ObservedObject
        var viewModel: ItemViewModel

        @State
        private var contentSize: CGSize = .zero

        private var items: [AboutViewItem] {
            var items: [AboutViewItem] = [.overview]

            if let mediaSources = viewModel.item.mediaSources {
                items.append(contentsOf: mediaSources.map { AboutViewItem.mediaSource($0) })
            }

            if let criticRating = viewModel.item.criticRating {
                items.append(.criticRating(criticRating))
            }

            if let communityRating = viewModel.item.communityRating {
                items.append(.communityRating(communityRating))
            }

            return items
        }

        // TODO: break out into a general solution for general use?
        // use similar math from CollectionHStack
        private var padImageWidth: CGFloat {
            let portraitMinWidth: CGFloat = 140
            let contentWidth = contentSize.width
            let usableWidth = contentWidth - EdgeInsets.edgePadding * 2
            var columns = CGFloat(Int(usableWidth / portraitMinWidth))
            let preItemSpacing = (columns - 1) * (EdgeInsets.edgePadding / 2)
            let preTotalNegative = EdgeInsets.edgePadding * 2 + preItemSpacing

            if columns * portraitMinWidth + preTotalNegative > contentWidth {
                columns -= 1
            }

            let itemSpacing = (columns - 1) * (EdgeInsets.edgePadding / 2)
            let totalNegative = EdgeInsets.edgePadding * 2 + itemSpacing
            let itemWidth = (contentWidth - totalNegative) / columns

            return max(0, itemWidth)
        }

        private var phoneImageWidth: CGFloat {
            let contentWidth = contentSize.width
            let usableWidth = contentWidth - EdgeInsets.edgePadding * 2
            let itemSpacing = (EdgeInsets.edgePadding / 2) * 2
            let itemWidth = (usableWidth - itemSpacing) / 3

            return max(0, itemWidth)
        }

        private var cardSize: CGSize {
            let height = UIDevice.isPad ? padImageWidth * 1.1 : phoneImageWidth * 1.1
            let width = height * 1.65

            return CGSize(width: width, height: height)
        }

        private var ratingCardWidth: CGFloat {
            cardSize.height
        }

        var body: some View {
            VStack(alignment: .leading, spacing: 20) {
                VStack(alignment: .leading) {
                    Text(L10n.about)
                        .font(.title2)
                        .fontWeight(.bold)
                        .accessibility(addTraits: [.isHeader])
                        .edgePadding(.horizontal)

                    CollectionHStack(
                        uniqueElements: items,
                        variadicWidths: true
                    ) { item in
                        switch item {
                        case .overview:
                            OverviewCard(item: viewModel.item)
                                .frame(width: cardSize.width, height: cardSize.height)
                        case let .mediaSource(source):
                            MediaSourcesCard(
                                subtitle: (viewModel.item.mediaSources ?? []).count > 1 ? source.displayTitle : nil,
                                source: source
                            )
                            .frame(width: cardSize.width, height: cardSize.height)
                        case let .criticRating(rating):
                            CriticRatingCard(rating: rating)
                                .frame(width: ratingCardWidth, height: cardSize.height)
                        case let .communityRating(rating):
                            CommunityRatingCard(rating: rating)
                                .frame(width: ratingCardWidth, height: cardSize.height)
                        }
                    }
                    .clipsToBounds(false)
                    .insets(horizontal: EdgeInsets.edgePadding)
                    .itemSpacing(EdgeInsets.edgePadding / 2)
                    .scrollBehavior(.continuousLeadingEdge)
                }

                InformationSection(item: viewModel.item)
            }
            .trackingSize($contentSize)
            .id(viewModel.item.hashValue)
        }
    }
}
