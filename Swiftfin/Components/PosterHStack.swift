//
// Swiftfin is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, you can obtain one at https://mozilla.org/MPL/2.0/.
//
// Copyright (c) 2026 Jellyfin & Jellyfin Contributors
//

import CollectionHStack
import SwiftUI

// TODO: Migrate to single `header: View`

struct PosterHStack<Element: Poster, Data: Collection>: View where Data.Element == Element, Data.Index == Int {

    private var data: Data
    private var header: () -> any View
    private var headerAction: (() -> Void)?
    private var title: String?
    private var type: PosterDisplayType
    private var label: (Element) -> any View
    private var trailingContent: () -> any View
    private let action: (Element, Namespace.ID) -> Void

    private var layout: CollectionHStackLayout {
        if UIDevice.isPhone {
            .grid(
                columns: type == .landscape ? 2 : 3,
                rows: 1,
                columnTrailingInset: 0
            )
        } else {
            .minimumWidth(
                columnWidth: type == .landscape ? 220 : 140,
                rows: 1
            )
        }
    }

    @ViewBuilder
    private var stack: some View {
        CollectionHStack(
            uniqueElements: data,
            layout: layout
        ) { item in
            PosterButton(
                item: item,
                type: type
            ) { namespace in
                action(item, namespace)
            } label: {
                label(item).eraseToAnyView()
            }
        }
        .clipsToBounds(false)
        .dataPrefix(20)
        .insets(horizontal: EdgeInsets.edgePadding)
        .itemSpacing(EdgeInsets.edgePadding / 2)
        .scrollBehavior(.continuousLeadingEdge)
    }

    var body: some View {
        VStack(alignment: .leading) {

            HStack {
                if let headerAction {
                    Button(action: headerAction) {
                        header()
                            .eraseToAnyView()
                    }
                    .buttonStyle(.plain)
                } else {
                    header()
                        .eraseToAnyView()
                }

                Spacer()

                trailingContent()
                    .eraseToAnyView()
            }
            .edgePadding(.horizontal)

            stack
        }
    }
}

extension PosterHStack {

    init(
        title: String? = nil,
        type: PosterDisplayType,
        items: Data,
        action: @escaping (Element, Namespace.ID) -> Void,
        @ViewBuilder label: @escaping (Element) -> any View = { PosterButton<Element>.TitleSubtitleContentView(item: $0) }
    ) {
        self.init(
            data: items,
            header: { DefaultHeader(title: title, showChevron: false) },
            headerAction: nil,
            title: title,
            type: type,
            label: label,
            trailingContent: { EmptyView() },
            action: action
        )
    }

    func trailing(@ViewBuilder _ content: @escaping () -> any View) -> Self {
        copy(modifying: \.trailingContent, with: content)
    }

    func headerAction(_ action: @escaping () -> Void) -> Self {
        var copy = copy(modifying: \.headerAction, with: action)
        copy.header = { DefaultHeader(title: title, showChevron: true) }
        return copy
    }
}

// MARK: Default Header

extension PosterHStack {

    struct DefaultHeader: View {

        let title: String?
        var showChevron: Bool = false

        var body: some View {
            if let title {
                HStack(spacing: 4) {
                    Text(title)
                        .font(.title2)
                        .fontWeight(.semibold)

                    if showChevron {
                        Image(systemName: "chevron.right")
                            .font(.title3.weight(.semibold))
                            .foregroundStyle(.secondary)
                    }
                }
                .accessibility(addTraits: [.isHeader])
            }
        }
    }
}
