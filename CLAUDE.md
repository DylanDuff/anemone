# AnemoneReact

A cross-platform Jellyfin client (iOS, Android, Android TV, tvOS), ported from
[Swiftfin](https://github.com/jellyfin/Swiftfin) / the `../anemone` fork. The **business logic
is a pure-TypeScript package** so the same logic drives every platform and any future UI.

## Monorepo layout

```
packages/core/   @anemone/core — platform-agnostic business logic. NO react-native, NO expo.
                 Tested in plain Node (vitest + better-sqlite3). This is the primary deliverable.
apps/mobile/     @anemone/mobile — Expo (SDK 57) shell. Injects platform adapters into core and
                 renders the UI. iOS/Android, Android TV, tvOS (simulator-tested) and web.
```

pnpm workspace, `node-linker=hoisted` (required for React Native + pnpm). Root `pnpm-workspace.yaml`
enforces a **15-day minimum release age** on every dependency, with a one-time approved exclusion
for `@jellyfin/sdk` and `onlyBuiltDependencies` for `better-sqlite3`/`esbuild`.

## The one rule that makes cross-platform work

`@anemone/core` must never import `react-native`, `expo-*`, or any DOM/Node-only API directly.
Platform capabilities are **injected** through interfaces (mirrors Swiftfin's `Factory` DI container):

- `SecureStore` — Keychain-equivalent (tokens, PINs). App: `expo-secure-store`. Tests: in-memory.
- `KeyValueStore` — `UserDefaults`-equivalent (settings). App: `react-native-mmkv`. Tests: in-memory.
- `AnemoneDatabase` — a Drizzle handle over SQLite. App: `expo-sqlite`. Tests: `better-sqlite3`.
- `Logger` — swift-log-equivalent. App: console/file. Tests: noop.

The app builds these and calls `configureContainer(...)` at startup. Core reads only the interfaces.

## Mapping Swiftfin → this project

| Swiftfin (Swift) | Here (TypeScript) |
| --- | --- |
| `JellyfinAPI` (jellyfin-sdk-swift) | `@jellyfin/sdk` (official TS SDK) — do not reinvent |
| `Factory` `Container` / `@Injected` | `container/container.ts` (typed service locator) |
| `SwiftfinStore` `AnyData` (CoreStore) | `data/anyData.ts` over Drizzle `any_data` table (owner_id, field, key, data-blob) |
| `StoredValues[.X]` (typed AnyData/Defaults) | `StoredValues` class + key defs in `data/keys/` |
| `Defaults[.X]` (UserDefaults) | `Defaults` class over `KeyValueStore` |
| `Keychain` (KeychainSwift) | `SecureStore` interface |
| `ViewModel` + `@Stateful` macro | `stateful/createStateful.ts` reducer store + `useStateful` hook |
| Data-fetching view models | TanStack Query hooks/options in `viewmodels/` |
| `ServerState` / `UserState` | `session/serverState.ts` / `session/userState.ts` |
| `UserSession` | `session/userSession.ts` |

### The `@Stateful` pattern

Later Swiftfin view models use a macro: `@CasePathable` actions each carry a `transition`
(`.to(state)`, `.loop(state)`, `.none`), `@Function(\Action.Cases.x)` marks the async handler,
and side effects emit `Event`s. Ported as a framework-agnostic reducer store (see
`stateful/createStateful.ts`); React consumers bind with `useStateful`. Pure data-fetching VMs
(Home, libraries, item detail, search) use **TanStack Query** instead — caching/pagination for free.

## App shell (apps/mobile)

- React Navigation native stack (`src/navigation/`), id-only params + web linking.
- `react-native` is **react-native-tvos** (supports phone + TV). Never import TV APIs
  (`TVFocusGuideView`, `useTVEventHandler`, `Platform.isTV`) directly — use `src/ui/tv.tsx`, which has
  a `.web.tsx` stand-in because react-native-web lacks them.
- A `.web` override must use the **same extension** as its base file (`tv.tsx` + `tv.web.tsx`).
  Metro resolves extension by extension, so `x.ts` beats `x.web.tsx` on web — silently.
- Page layout: read `useContentLayout()` (`src/ui/contentLayout.tsx`), never `theme.gutter` or the
  window width directly, inside browse pages. The navigation pill (`ui/SectionRail.tsx`) floats over
  full-size pages on the edge chosen in Settings (left/right/top/bottom; phones: always a compact
  bottom pill). Content starts inside `insetLeft`/`insetRight` and adds `insetTop`/`insetBottom` to
  its own padding, then scrolls under the pill; hero artwork bleeds beneath it.
- **Shell re-renders are expensive:** section screens stay mounted in the section stack, and ~20
  components read the layout context. Memoise any context value the shell provides (`useMemo` on
  primitives), keep navigator options constant, and keep high-frequency UI state (scroll-driven pill
  shrink) in an external store that only its consumer subscribes to (`ui/pageScroll.tsx`) — never
  in `BrowseShell` state. Missing this made iPhone page changes visibly laggy.
- Page ScrollViews hide their scroll indicators (`showsVerticalScrollIndicator={false}`) on every
  platform: Safari's classic scrollbar takes a gutter from the window and breaks the full-bleed
  hero/rows, and elsewhere they're clutter.
- Side margins come from the layout insets (`gutterFor(compact)`: 50pt, 20pt on phones) — never
  `theme.gutter` in a stylesheet.
- Poster / 16:9 card sizes (incl. episodes and extras) come from `useCardWidths()` (smaller when compact), never
  `theme.poster.width` / `theme.landscapeCard.width` directly.
- Frosted surfaces use `GlassSurface` (`src/ui/Glass.tsx`): Liquid Glass on iOS 26+, else
  `expo-blur`. Android blur only samples content inside a `GlassBackdrop`: wrap the content the
  glass floats over (a sibling rendered before it, never the glass itself), and wrap *both* in a
  `GlassScope`, which owns the shared blur-target ref.
- Device settings: keys in core `AppSettingsKeys` (key/value storage, caller-supplied default);
  the app's platform defaults and hooks live in `apps/mobile/src/settings.ts`. Components read them
  with those hooks — never a module-level flag.
- Phone vs wide layouts: `useIsCompact()` (`src/ui/contentLayout.tsx`, <700pt and not TV).
- Theme (`src/ui/theme.ts`) drives every colour, font size/weight and corner radius: compose
  `theme.type.*` (+ `theme.weight.*` overrides), `theme.colors.*`, `theme.radii.*`, `space()`. No
  literals in components — add a token instead.
- Form controls: `TextField`, `Switch`, `Button` (`src/ui/`). Text fields and switches are the
  platform's own via `@expo/ui` when `nativeControls` (iOS/iPadOS/tvOS, Android phones — tvOS fields
  open the system keyboard), themed RN ones on Android TV and web. Screens never branch on it.
- People are items: `openItem` a cast entry or person result and `ItemScreen` renders
  `PersonDetail`. `PersonCard`/`PersonPhoto` (`src/ui/PersonCard.tsx`) draw people everywhere.
- Icons: Ionicons via `Icon` (`src/ui/Icon.tsx`) only — never import `@expo/vector-icons`
  directly. `iconVariant(base, filled)` picks filled (active/current) vs `-outline`.
- Every interactive element is a `Focusable` (`src/ui/Focusable.tsx`) so D-pad/keyboard focus is
  consistent. Artwork marks focus with `FocusRing` (outline ring, or tvOS-style sheen) inside the
  clipped container + `focusGlow()` on it + `focusLift` — the indicator is a Setting. On web
  "focused" = hover or keyboard focus (never click focus), eased by `hoverTransition`.
- Horizontal rows (`Shelf`) are TV focus guides and reserve `focusRoom` padding so the lift/glow
  isn't clipped; derive any new clip padding from it.
- **TV list gotcha:** react-native-tvos wraps FlatList's ScrollView in an unstyled
  `TVFocusGuideView`, so `flex: 1` collapses the list to ~1pt on TV. Give lists an explicit height
  on TV (see `LibraryScreen`). Diagnose layout bugs with `onLayout` logging + `adb shell dumpsys
  activity top` before theorising.
- Always size image requests: `imagePixelWidth(layoutWidth)` → `maxWidth`. Unsized requests decode
  full-res (up to 4K) frames and got the app lmkd-killed on a 1.8 GB TV.
- TV home hero (`src/ui/TVHero.tsx`): one mounted slide (crossfade), focus order actions → slide
  dots (left/right change slide) → rows. The touch/web hero is `HeroCarousel`.
- Perf on the test TV (32-bit ARM, Android 12): live blur and many masked fades are the heaviest
  effects; they're behind Settings (glass blur defaults off on TV). Judge perf on release builds —
  debug adds ~200 MB native heap.
- Playback (`docs/playback.md`): engines sit behind `player/engine.ts` (`EngineProps`) and describe
  themselves with a core `PlayerCapabilities` (`player/capabilities.ts` + `.web.ts`); core builds
  the DeviceProfile, negotiates the stream and decides track switches. Never branch on engine or
  platform in core — add a capability flag. Native engine = react-native-video; web = `<video>` +
  hls.js (react-native-video's web player lacks HLS/tracks). Media URLs carry the token as `ApiKey`.
- iOS/iPadOS device loop (from `apps/mobile`, `EXPO_TV` unset): `npx expo run:ios --device <udid>
  --no-bundler` (UDID from `xcrun devicectl list devices`); loads JS from the running Metro over
  Wi-Fi. Needs `expo-build-properties` `ios.enableSceneSupport` (crashes on launch without it) and
  the ATS exception in `app.json` for `http://` servers.
- Native builds: `npx expo prebuild --platform android` (add `EXPO_TV=1` and `--clean` for TV), then
  Gradle with JDK 17. `android/`/`ios/` are generated and gitignored; config lives in `app.json` +
  `plugins/`. Release builds need `plugins/withCleartextTraffic.js` for `http://` servers.
- Android TV loop (from `apps/mobile/android`, `ANDROID_SERIAL=<tv>`,
  `JAVA_HOME=/Library/Java/JavaVirtualMachines/jdk-17.jdk/Contents/Home`):
  `./gradlew app:installDebug -PreactNativeArchitectures=armeabi-v7a` then
  `adb reverse tcp:8081 tcp:8081` — the debug build loads JS from the running Metro (`pnpm mobile`),
  so JS edits hot-reload; rebuild only for native deps / `app.json` / plugins. `installRelease`
  bundles JS (use for perf). Dev menu: `adb shell input keyevent 82`. Screenshots:
  `adb exec-out screencap -p`.

## Conventions

- K&R braces, complete-word identifiers, DRY. `oxlint` + `oxfmt`. 4-space indent in core.
- Core is ESM, `strict` + `noUncheckedIndexedAccess`. Barrel export from `src/index.ts`.
- Every non-trivial core module has a colocated or `tests/` vitest spec. Persistence is tested
  against a real SQLite (better-sqlite3), not mocks.
- Docs live in `docs/`. **`docs/BACKLOG.md` tracks everything deferred** — keep it current.

## Commands

```bash
pnpm install                 # workspace install (respects 15-day rule)
pnpm core:test               # vitest for @anemone/core
pnpm core:typecheck          # tsc --noEmit for core
pnpm --filter @anemone/core test:watch
```
