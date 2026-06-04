//
// Swiftfin is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, you can obtain one at https://mozilla.org/MPL/2.0/.
//
// Copyright (c) 2026 Jellyfin & Jellyfin Contributors
//

import SwiftUI

// TODO: move popup to router
//       - or, make tab view environment object

// TODO: fix weird tvOS icon rendering
struct MainTabView: View {

    #if os(iOS)
    @StateObject
    private var tabCoordinator: TabCoordinator = {
        guard UIDevice.isPad else {
            return TabCoordinator {
                TabItem.home
                TabItem.search
                TabItem.media
            }
        }
        return TabCoordinator {
            TabItem.home
            TabItem.library(
                title: L10n.tvShowsCapitalized,
                systemName: "tv",
                filters: .init(itemTypes: [.series])
            )
            TabItem.library(
                title: L10n.movies,
                systemName: "film",
                filters: .init(itemTypes: [.movie])
            )
            TabItem.search
            TabItem.media
        }
    }()
    #else
    @StateObject
    private var tabCoordinator = TabCoordinator {
        TabItem.home
        TabItem.library(
            title: L10n.tvShowsCapitalized,
            systemName: "tv",
            filters: .init(itemTypes: [.series])
        )
        TabItem.library(
            title: L10n.movies,
            systemName: "film",
            filters: .init(itemTypes: [.movie])
        )
        TabItem.search
        TabItem.media
        TabItem.settings
    }
    #endif

    @ViewBuilder
    var body: some View {
        #if os(iOS)
        if #available(iOS 18, *) {
            if UIDevice.isPad {
                ipadTabView
            } else {
                phoneTabView
            }
        } else {
            legacyTabView
        }
        #else
        legacyTabView
        #endif
    }

    @available(iOS 18, *)
    @ViewBuilder
    private var ipadTabView: some View {
        TabView(selection: $tabCoordinator.selectedTabID) {
            ForEach(tabCoordinator.tabs, id: \.item.id) { tab in
                Tab(tab.item.title, systemImage: tab.item.systemImage, value: tab.item.id) {
                    NavigationInjectionView(coordinator: tab.coordinator) {
                        tab.item.content
                    }
                    .environmentObject(tabCoordinator)
                    .environment(\.tabItemSelected, tab.publisher)
                }
            }
        }
        .tabViewStyle(.sidebarAdaptable)
    }

    @available(iOS 18, *)
    @ViewBuilder
    private var phoneTabView: some View {
        TabView(selection: $tabCoordinator.selectedTabID) {
            ForEach(tabCoordinator.tabs, id: \.item.id) { tab in
                Tab(tab.item.title, systemImage: tab.item.systemImage, value: tab.item.id) {
                    NavigationInjectionView(coordinator: tab.coordinator) {
                        tab.item.content
                    }
                    .environmentObject(tabCoordinator)
                    .environment(\.tabItemSelected, tab.publisher)
                }
            }
        }
    }

    @ViewBuilder
    private var legacyTabView: some View {
        TabView(selection: $tabCoordinator.selectedTabID) {
            ForEach(tabCoordinator.tabs, id: \.item.id) { tab in
                NavigationInjectionView(
                    coordinator: tab.coordinator
                ) {
                    tab.item.content
                }
                .environmentObject(tabCoordinator)
                .environment(\.tabItemSelected, tab.publisher)
                .tabItem {
                    Label(
                        tab.item.title,
                        systemImage: tab.item.systemImage
                    )
                    .labelStyle(tab.item.labelStyle)
                    .symbolRenderingMode(.monochrome)
                    .eraseToAnyView()
                }
                .tag(tab.item.id)
            }
        }
    }
}
