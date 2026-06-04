//
// Swiftfin is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, you can obtain one at https://mozilla.org/MPL/2.0/.
//
// Copyright (c) 2026 Jellyfin & Jellyfin Contributors
//

import JellyfinAPI
import SwiftUI

extension HomeView {

    struct HeroCarouselView: View {

        @Router
        private var router

        @Namespace
        private var namespace

        @State
        private var selectedID: BaseItemDto.ID?

        @ObservedObject
        var viewModel: RecentlyAddedLibraryViewModel

        private var items: [BaseItemDto] {
            Array(viewModel.elements.prefix(8))
        }

        private var slideHeight: CGFloat {
            UIDevice.isPhone ? 260 : 550
        }

        private var currentIndex: Int {
            items.firstIndex(where: { $0.id == selectedID }) ?? 0
        }

        var body: some View {
            if !items.isEmpty {
                ZStack(alignment: .bottom) {
                    SupplementTabView(items: items, selection: $selectedID) { item in
                        HeroSlide(item: item) {
                            router.route(to: .item(item: item), in: namespace)
                        }
                    }
                    .frame(maxWidth: .infinity)

                    PageDots(total: items.count, current: currentIndex)
                        .padding(.bottom, 14)
                }
                .frame(maxWidth: .infinity)
                .frame(height: slideHeight)
                .onAppear {
                    if selectedID == nil {
                        selectedID = items.first?.id
                    }
                }
                .onReceive(
                    Timer.publish(every: 6, on: .main, in: .common).autoconnect()
                ) { _ in
                    guard !items.isEmpty else { return }
                    selectedID = items[(currentIndex + 1) % items.count].id
                }
            }
        }
    }
}

// MARK: - HeroSlide

private struct HeroSlide: View {

    let item: BaseItemDto
    let action: () -> Void

    private var logoSources: [ImageSource] {
        let source = item.type == .episode
            ? item.seriesImageSource(.logo, maxWidth: 220)
            : item.imageSource(.logo, maxWidth: 220)
        return [source]
    }

    var body: some View {
        Button(action: action) {
            GeometryReader { proxy in
                ZStack(alignment: .bottomLeading) {
                    ImageView(item.cinematicImageSources(maxWidth: proxy.size.width))
                        .image { $0.aspectRatio(contentMode: .fill) }
                        .placeholder { _ in Color.secondarySystemFill }
                        .frame(width: proxy.size.width, height: proxy.size.height)
                        .clipped()

                    LinearGradient(
                        stops: [
                            .init(color: .clear, location: 0.35),
                            .init(color: .black.opacity(0.85), location: 1.0),
                        ],
                        startPoint: .top,
                        endPoint: .bottom
                    )

                    VStack(alignment: .leading, spacing: 4) {
                        ImageView(logoSources)
                            .image { $0.aspectRatio(contentMode: .fit) }
                            .failure {
                                Text(item.displayTitle)
                                    .font(.title2)
                                    .fontWeight(.bold)
                                    .foregroundStyle(.white)
                                    .lineLimit(2)
                            }
                            .frame(
                                maxWidth: UIDevice.isPhone ? 180 : 260,
                                maxHeight: UIDevice.isPhone ? 60 : 80,
                                alignment: .bottomLeading
                            )

                        if let subtitle = item.subtitle {
                            Text(subtitle)
                                .font(.subheadline)
                                .foregroundStyle(.white.opacity(0.75))
                        }
                    }
                    .padding(.horizontal, EdgeInsets.edgePadding)
                    .padding(.bottom, 36)
                }
                .frame(width: proxy.size.width, height: proxy.size.height)
            }
        }
        .buttonStyle(.plain)
    }
}

// MARK: - PageDots

private struct PageDots: View {

    let total: Int
    let current: Int

    var body: some View {
        HStack(spacing: 6) {
            ForEach(0 ..< total, id: \.self) { index in
                Circle()
                    .fill(index == current ? Color.white : Color.white.opacity(0.4))
                    .frame(width: 6, height: 6)
                    .animation(.easeInOut(duration: 0.2), value: current)
            }
        }
    }
}
