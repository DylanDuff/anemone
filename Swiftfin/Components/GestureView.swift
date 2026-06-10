//
// Swiftfin is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, you can obtain one at https://mozilla.org/MPL/2.0/.
//
// Copyright (c) 2026 Jellyfin & Jellyfin Contributors
//

import Combine
import Foundation
import Logging
import SwiftUI

// TODO: figure out this directional response stuff
extension EnvironmentValues {

    @Entry
    var panGestureDirection: Direction = .all
}

struct GestureView: UIViewRepresentable {

    func makeUIView(context: Context) -> UIView {
        let view = UIView(frame: .zero)

        view.addGestureRecognizer(context.coordinator.longPressGesture)
        view.addGestureRecognizer(context.coordinator.panGesture)
        view.addGestureRecognizer(context.coordinator.tapGesture)
        #if os(iOS)
        view.addGestureRecognizer(context.coordinator.pinchGesture)
        view.addGestureRecognizer(context.coordinator.doubleTouchGesture)
        #endif

        view.backgroundColor = .clear
        return view
    }

    func updateUIView(_ uiView: UIView, context: Context) {

        context.coordinator.longPressAction = context.environment.longPressAction
        context.coordinator.panAction = context.environment.panAction
        #if os(iOS)
        context.coordinator.pinchAction = context.environment.pinchAction
        #endif
        context.coordinator.tapAction = context.environment.tapGestureAction

        context.coordinator.panGesture.direction = context.environment.panGestureDirection
    }

    func makeCoordinator() -> Coordinator {
        Coordinator()
    }

    class Coordinator {

        #if os(iOS)
        lazy var doubleTouchGesture: UITapGestureRecognizer! = {
            let recognizer = UITapGestureRecognizer(
                target: self,
                action: #selector(handleTap)
            )
            recognizer.numberOfTouchesRequired = 2
            return recognizer
        }()
        #endif

        lazy var longPressGesture: UILongPressGestureRecognizer! = {
            let recognizer = UILongPressGestureRecognizer(
                target: self,
                action: #selector(handleLongPress)
            )
            recognizer.minimumPressDuration = 1.2
            return recognizer
        }()

        lazy var panGesture: DirectionalPanGestureRecognizer! = {
            .init(
                direction: .allButDown,
                target: self,
                action: #selector(handlePan)
            )
        }()

        #if os(iOS)
        lazy var pinchGesture: UIPinchGestureRecognizer! = {
            .init(
                target: self,
                action: #selector(handlePinch)
            )
        }()
        #endif

        lazy var tapGesture: UITapGestureRecognizer! = {
            .init(
                target: self,
                action: #selector(handleTap)
            )
        }()

        var longPressAction: LongPressAction? {
            didSet { longPressGesture.isEnabled = longPressAction != nil }
        }

        var panAction: PanAction? {
            didSet { panGesture.isEnabled = panAction != nil }
        }

        #if os(iOS)
        var pinchAction: PinchAction? {
            didSet { pinchGesture.isEnabled = pinchAction != nil }
        }
        #endif

        var tapAction: TapAction? {
            didSet {
                #if os(iOS)
                doubleTouchGesture.isEnabled = tapAction != nil
                #endif
                tapGesture.isEnabled = tapAction != nil
            }
        }

        private var didSwipe = false

        @objc
        func handleLongPress(_ gesture: UILongPressGestureRecognizer) {
            guard let view = gesture.view else { return }

            let location = gesture.location(in: view)
            let unitPoint = UnitPoint(
                x: location.x / view.bounds.width,
                y: location.y / view.bounds.height
            )

            longPressAction?(
                location: location,
                unitPoint: unitPoint,
                state: gesture.state
            )
        }

        @objc
        func handlePan(_ gesture: UIPanGestureRecognizer) {
            guard let view = gesture.view else { return }

            let translation = gesture.translation(in: view)
            let velocity = gesture.velocity(in: view)
            let location = gesture.location(in: view)
            let unitPoint = UnitPoint(
                x: location.x / view.bounds.width,
                y: location.y / view.bounds.height
            )

            panAction?(
                translation: translation,
                velocity: velocity,
                location: location,
                unitPoint: unitPoint,
                state: gesture.state
            )
        }

        #if os(iOS)
        @objc
        func handlePinch(_ gesture: UIPinchGestureRecognizer) {
            pinchAction?(
                scale: gesture.scale,
                velocity: gesture.velocity,
                state: gesture.state
            )
        }
        #endif

        @objc
        func handleTap(_ gesture: UITapGestureRecognizer) {
            guard let view = gesture.view else { return }

            let location = gesture.location(in: gesture.view)
            let unitPoint = UnitPoint(
                x: location.x / view.bounds.width,
                y: location.y / view.bounds.height
            )

            tapAction?(
                location: location,
                unitPoint: unitPoint,
                count: gesture.numberOfTouches
            )
        }
    }
}
