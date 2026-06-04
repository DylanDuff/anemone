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

struct NavigationBarFilterDrawer: View {

    @Default(.accentColor)
    private var accentColor

    @ObservedObject
    var viewModel: FilterViewModel

    @Router
    private var router

    let types: [ItemFilterType]

    var body: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack {
                if viewModel.currentFilters.isNotEmpty {
                    Menu(L10n.reset, systemImage: "line.3.horizontal.decrease") {
                        Button(L10n.reset, role: .destructive) {
                            viewModel.reset(filterType: nil)
                        }
                    }
                    .foregroundStyle(.primary, .secondary)
                    .labelStyle(NavigationDrawerLabelStyle(isIconOnly: true))
                }

                ForEach(types, id: \.self) { type in
                    if UIDevice.isPad {
                        filterMenu(for: type)
                    } else {
                        Button {
                            router.route(
                                to: .filter(
                                    type: type,
                                    viewModel: viewModel
                                )
                            )
                        } label: {
                            Label {
                                Text(type.displayTitle)
                            } icon: {
                                EmptyView()
                            }
                        }
                        .foregroundStyle(.primary, .secondary)
                        .isHighlighted(viewModel.isFilterSelected(type: type))
                    }
                }
            }
            .padding(.horizontal)
            .padding(.bottom, 5)
            .labelStyle(NavigationDrawerLabelStyle())
        }
    }

    @ViewBuilder
    private func filterMenu(for type: ItemFilterType) -> some View {
        Menu {
            ForEach(type.group, id: \.displayTitle) { group in
                let options = viewModel.allFilters[keyPath: group.keyPath]
                let selected = viewModel.currentFilters[keyPath: group.keyPath]

                if type.group.count > 1 {
                    Section(group.displayTitle) {
                        filterMenuItems(options: options, selected: selected, group: group)
                    }
                } else {
                    filterMenuItems(options: options, selected: selected, group: group)
                }
            }

            if viewModel.isFilterSelected(type: type) {
                Divider()
                Button(L10n.reset, role: .destructive) {
                    viewModel.reset(filterType: type)
                }
            }
        } label: {
            Label {
                Text(type.displayTitle)
            } icon: {
                EmptyView()
            }
        }
        .foregroundStyle(.primary, .secondary)
        .isHighlighted(viewModel.isFilterSelected(type: type))
    }

    @ViewBuilder
    private func filterMenuItems(
        options: [AnyItemFilter],
        selected: [AnyItemFilter],
        group: ItemFilterType.Group
    ) -> some View {
        ForEach(options, id: \.self) { option in
            let isSelected = selected.contains(option)
            Button {
                switch group.selectorType {
                case .single:
                    group.setter([option], viewModel)
                case .multi:
                    if isSelected {
                        group.setter(selected.filter { $0 != option }, viewModel)
                    } else {
                        group.setter(selected + [option], viewModel)
                    }
                }
            } label: {
                if isSelected {
                    Label {
                        Text(option.displayTitle)
                    } icon: {
                        Image(systemName: "checkmark.circle.fill")
                            .foregroundStyle(accentColor)
                    }
                } else {
                    Text(option.displayTitle)
                }
            }
        }
    }
}
