# Anemone (Swiftfin fork)

Jellyfin client for iOS and tvOS. Fork of [Swiftfin](https://github.com/jellyfin/Swiftfin) with a redesigned UI.

## Architecture

- **Single multi-platform app target** (`Swiftfin iOS`, scheme `Swiftfin`) that builds for
  iPhone/iPad **and** Apple TV (`SUPPORTED_PLATFORMS` includes `appletvos`/`appletvsimulator`,
  `TARGETED_DEVICE_FAMILY[sdk=appletv*] = 3`). The former standalone `Swiftfin tvOS` target was
  removed; the `Swiftfin tvOS/` folder remains on disk as reference only — **it is not compiled**.
- `Swiftfin/` — all views/components (compiled for both platforms)
- `Shared/` — view models, coordinators, extensions, players (compiled for both platforms)
- `PreferencesView/` — local SPM package (key commands, orientation, status bar hosting)
- Coordinator pattern: `NavigationRoute` (+ feature extensions), `RootCoordinator`, `TabCoordinator`
- `Stateful` macro view models; `PagingLibraryViewModel<T>` for paginated libraries

## Platform conventions (tvOS support)

- Platform differences are handled with `#if os(iOS)` / `#if os(tvOS)` in source — **not** target
  membership and not `EXCLUDED_SOURCE_FILE_NAMES` (globs don't reliably match nested paths).
- tvOS shims live in `Swiftfin/Extensions/View/View-tvOS.swift`: no-op
  `navigationBarTitleDisplayMode`, `listRowSeparator`, `statusBarHidden`, `prefersStatusBarHidden`,
  `photoPicker` (+ `Mantis` stand-in enums), and a `PresentationCoordinator` stand-in
  (Transmission's presentation system is iOS-only).
- `UIDevice.feedback/impact` haptics no-op on tvOS via stubs at the bottom of
  `Shared/Extensions/UIDevice.swift`.
- iOS-only feature areas are whole-file guarded with `#if os(iOS)`:
  `AdminDashboardView/`, `ItemEditorView/`, `DownloadTaskView/`, `DownloadListView.swift`,
  `PhotoCropView/`, video player gesture handlers (`VideoPlayerContainerView/Gestures/`),
  `VideoPlayer+KeyCommands.swift`, `SwiftfinSpotlight.swift`.
- tvOS-only components (focus-based) sit alongside iOS ones, guarded `#if os(tvOS)`:
  `ListRowMenu`, `SplitLoginWindowView`, `StepperView-tvOS.swift` (custom `Stepper`), `_Alert.swift`.
- Liquid Glass availability checks must include both platforms: `#available(iOS 26, tvOS 26, *)`.
- iOS-only SPM products (`Mantis`, `LNPopupUI-Static`) and `MobileVLCKit.xcframework` carry
  `platformFilters = (ios,)` in the pbxproj; `TVVLCKit.xcframework` and `TVOSPicker` carry
  `platformFilters = (tvos,)`.

## Build

```bash
brew bundle --file Brewfile                      # carthage, swiftformat, swiftgen, swiftlint
carthage bootstrap --use-xcframeworks --platform iOS,tvOS
xcodebuild -scheme Swiftfin -destination 'generic/platform=iOS Simulator' build
xcodebuild -scheme Swiftfin -destination 'generic/platform=tvOS Simulator' build
```

- `XcodeConfig/DevelopmentTeam.xcconfig` (gitignored) holds `DEVELOPMENT_TEAM` /
  `PRODUCT_BUNDLE_IDENTIFIER`.
- Build phases run SwiftGen, SwiftFormat, and SwiftLint — SwiftFormat may reformat files
  (e.g. re-indent `#if` inside modifier chains) during builds.
- Deployment target: iOS 17 / tvOS 17 (Liquid Glass paths gated to 26).

## Gotchas

- SourceKit/IDE diagnostics frequently report bogus "No such module" errors in this project;
  trust `xcodebuild` output instead.
- `Shared/` was already cross-platform; most new tvOS work is in `Swiftfin/`.
- tvOS runtime behavior (focus, remote input for the video player) is still being brought up —
  compiling is verified, full UX parity is not.
