//
// Swiftfin is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, you can obtain one at https://mozilla.org/MPL/2.0/.
//
// Copyright (c) 2026 Jellyfin & Jellyfin Contributors
//

import JellyfinAPI
import SwiftUI

extension ItemView.AboutView {

    struct InformationSection: View {

        let item: BaseItemDto

        private struct MetadataRow: Identifiable {
            let label: String
            let value: String
            var id: String {
                label
            }
        }

        private var rows: [MetadataRow] {
            var result: [MetadataRow] = []

            if let studios = item.studios, studios.isNotEmpty {
                result.append(.init(
                    label: L10n.studios,
                    value: studios.compactMap(\.name).joined(separator: ", ")
                ))
            }

            if let genres = item.genres, genres.isNotEmpty {
                result.append(.init(
                    label: L10n.genres,
                    value: genres.joined(separator: ", ")
                ))
            }

            if let alternateTitle = item.alternateTitle {
                result.append(.init(label: L10n.originalTitle, value: alternateTitle))
            }

            if let year = item.premiereDateYear ?? item.productionYear.map(String.init) {
                result.append(.init(label: L10n.releaseDate, value: year))
            }

            if let runtime = item.runTimeLabel {
                result.append(.init(label: L10n.duration, value: runtime))
            }

            if let rating = item.officialRating {
                result.append(.init(label: L10n.officialRating, value: rating))
            }

            if let locations = item.productionLocations, locations.isNotEmpty {
                result.append(.init(
                    label: L10n.regional,
                    value: locations.joined(separator: ", ")
                ))
            }

            return result
        }

        var body: some View {
            if rows.isNotEmpty {
                VStack(alignment: .leading, spacing: 16) {
                    Text("Information")
                        .font(.title2)
                        .fontWeight(.semibold)
                        .edgePadding(.horizontal)

                    LazyVGrid(
                        columns: Array(repeating: GridItem(.flexible(), alignment: .top), count: 3),
                        alignment: .leading,
                        spacing: 24
                    ) {
                        ForEach(rows) { row in
                            VStack(alignment: .leading, spacing: 3) {
                                Text(row.label)
                                    .font(.subheadline)
                                    .fontWeight(.semibold)
                                    .foregroundStyle(.primary)
                                    .frame(maxWidth: 250, alignment: .leading)
                                Text(row.value)
                                    .font(.subheadline)
                                    .foregroundStyle(.secondary)
                                    .frame(maxWidth: 250, alignment: .leading)
                            }
                            .frame(maxWidth: .infinity, alignment: .leading)
                        }
                    }
                    .edgePadding(.horizontal)
                }
            }
        }
    }
}
