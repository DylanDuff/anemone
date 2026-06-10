//
// Swiftfin is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, you can obtain one at https://mozilla.org/MPL/2.0/.
//
// Copyright (c) 2026 Jellyfin & Jellyfin Contributors
//

import Defaults
import Factory
import PreferencesView
import SwiftUI
import UIKit

@main
struct SwiftfinApp: App {

    @UIApplicationDelegateAdaptor(AppDelegate.self)
    private var appDelegate

    @StateObject
    private var valueObservation = ValueObservation()

    init() {
        Self.configure()

        UIScrollView.appearance().keyboardDismissMode = .onDrag

        // On iOS 26+ the system's Liquid Glass renderer owns tab bar appearance.
        // On older iOS the tab bar can disappear on push without an explicit
        // appearance set, so force a material background there.
        if #available(iOS 26, *) {
            // no-op: let Liquid Glass apply
        } else {
            UITabBar.appearance().scrollEdgeAppearance = UITabBarAppearance(idiom: .unspecified)
        }

        #if os(iOS)
        SwiftfinSpotlight().addSwiftfinToSpotlight()
        #endif
    }

    var body: some Scene {
        WindowGroup {
            OverlayToastView {
                // On iOS 26+, PreferencesView inserts a UIHostingController subclass
                // between the root and UITabBarController, which breaks Liquid Glass
                // compositing. AppDelegate already handles orientation for all OS versions,
                // so PreferencesView is not needed at the root on iOS 26+.
                if #available(iOS 26, *) {
                    RootView()
                } else {
                    PreferencesView {
                        RootView()
                            .supportedOrientations(UIDevice.isPad ? .allButUpsideDown : .portrait)
                    }
                }
            }
            .ignoresSafeArea()
            .onAppDidEnterBackground {
                Defaults[.backgroundTimeStamp] = Date.now
            }
            .onAppWillEnterForeground {

                // TODO: needs to check if any background playback is happening
                //       - atow, background video playback isn't officially supported
                let backgroundedInterval = Date.now.timeIntervalSince(Defaults[.backgroundTimeStamp])

                if Defaults[.signOutOnBackground], backgroundedInterval > Defaults[.backgroundSignOutInterval] {
                    Defaults[.lastSignedInUserID] = .signedOut
                    Container.shared.currentUserSession.reset()
                    Notifications[.didSignOut].post()
                }
            }
        }
    }
}

#if os(iOS)
extension UINavigationController {

    // Remove back button text
    override open func viewWillLayoutSubviews() {
        navigationBar.topItem?.backButtonDisplayMode = .minimal
    }
}
#endif
