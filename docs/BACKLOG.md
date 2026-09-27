# Backlog — deferred work

Tracks everything intentionally **not** done in the current business-logic run, so it can be picked
up later. Grouped by area. Update this as items are completed or added.

## Dependencies / tooling

- ✅ `@jellyfin/sdk` 1.0.0 passed the 15-day window (published 2026-09-11); the one-time
  `minimumReleaseAgeExclude` is removed from `pnpm-workspace.yaml` (2026-09-27).
- [ ] Add `oxlint` + `oxfmt` config and a `lint`/`format` script (user has them installed globally).
- [ ] CI: run `pnpm core:test` + `pnpm core:typecheck` on push.

## Platform / app shell (UI phase)

- ✅ **Android TV target**: `react-native` is aliased to `react-native-tvos@0.86.2-0` (0.86.3-0 was
  under the 15-day window — bump once it ages) + `@react-native-tvos/config-tv` (off by default;
  `EXPO_TV=1 npx expo prebuild --clean` for TV). D-pad focus system: `ui/Focusable.tsx`
  (`Focusable`, `FocusRing`, `FocusWithin`), `ui/tv.ts` (+ `.web.tsx` stand-ins), shelves as
  `FocusGuide autoFocus`, `TVHero` (single mounted slide, crossfade, edge-press changes slide).
- [ ] Bump `react-native-tvos` to `0.86.3-0` (matches RN 0.86.3) once it passes the 15-day window
  (published 2026-09-18 → eligible 2026-10-03).
- [ ] **tvOS**: builds and runs in the Apple TV simulator (2026-09-26, `EXPO_TV=1` prebuild of
  `ios/`); still needs `appleTVImages` in the config-tv plugin, a device run, and a check of the
  native `@expo/ui` switches/text fields (SwiftUI) inside the RN focus engine.
- [ ] Android TV **banner** (`androidTVBanner`, 320×180) — the launcher currently uses the icon.
- [ ] Focus polish: animated focus lift on TV (web already eases), TV-sized type/spacing pass,
  library grid "jump to letter", long-press menus.
- ✅ Error states with retry (`ui/ErrorState.tsx`, core `describeError`): Home, Library, Search and
  item pages explain a failure (can't reach the server, signed out, not found, server fault) and
  offer Try Again (TV focus lands on it). Rows that fail on an otherwise-loaded Home stay hidden.
- [x] `@expo/ui` installed; UI uses its **universal** components (browser-testable via
  react-native-web). `expo-router` still not installed — navigation is currently simple
  session/state-based; add routing when the screen count grows.
- ✅ **`@expo/ui` on native**: connect/sign-in screens render on Android TV (debug + release).
- [ ] Web `SecureStore` is a `localStorage` stub (NOT secure) for dev only — never ship it.
- ✅ Native builds: `expo prebuild` (+ `EXPO_TV=1` for TV) and Gradle; see CLAUDE.md for the TV loop.
- ✅ Expo platform adapters (MMKV / secure-store / expo-sqlite) wired via `configureAnemone`.

## Business logic — deferred view models & services

These exist in Swiftfin `Shared/` but are out of scope for the foundation + core-VM run:

- 🚧 **Admin dashboard** (`ViewModels/AdminDashboard/*`): sessions, activity, devices and user
  management are done (`docs/admin-dashboard.md`); API keys, server logs and tasks remain.
- [ ] **Item administration / editors** (`ViewModels/ItemAdministration/*`): identify item, metadata
  editor, genres/people/studios/tags editors, subtitle search, remote images.
- [ ] **Downloads** (`Services/DownloadManager`, `DownloadTask`, `DownloadListViewModel`): offline
  media. Ties into native file storage — needs a platform adapter.
- ✅ **Media player manager — first cut** (see [`docs/playback.md`](playback.md)): device profiles
  from engine capabilities, PlaybackInfo negotiation, audio/subtitle switching (local or
  re-negotiated), start/progress/stop reporting, player screen on react-native-video + hls.js (web).
- [ ] **Playback follow-ups** (Swiftfin `MediaPlayerManager` remainder):
  - [ ] Queue / next-episode autoplay and "Up next" prompt (`EpisodeMediaPlayerQueue`).
  - [ ] Trickplay / chapter preview images on the seek bar (`PreviewImageProvider`).
  - [ ] Max bitrate setting + "compatibility mode" (Swiftfin `PlaybackBitrate`,
    `PlaybackCompatibility`); `resolvePlayback` already takes `maxBitrate`.
  - [ ] Version picker for items with several media sources (`mediaSourceID` route param exists).
  - [ ] Opt-in **mpv/VLC engine** adapter for broad direct play (ASS styling, DTS/TrueHD, image
    subtitles) — implement `EngineProps` + a `PlayerCapabilities`.
  - [ ] Android: probe AC-3/E-AC-3/DTS decoders (currently always converted by the server) and HDR
    display support (currently SDR only, so HDR sources are tone-mapped by the server).
  - [ ] iOS/iPadOS: runs on device (iPhone 14 Pro, 2026-09-27); **verify playback** — AVPlayer
    profile, HLS-manifest subtitles, HDR. tvOS runs in the simulator. AV1 on capable hardware.
  - [ ] Report stop when the app is backgrounded/killed mid-playback; PiP, AirPlay/Chromecast,
    now-playing/lock-screen controls (`NowPlayable`); playback speed; audio-only items.
  - [ ] Web: keyboard shortcuts (space, arrows); ASS/SSA are converted to WebVTT (styling lost).
  - [ ] **Chrome (macOS) decode failure**: an MKV 1080p H.264 item (remuxed, video copied,
    manifest `avc1.640028`) fails with `DECODER_ERROR_NOT_SUPPORTED … kUnsupportedConfig` →
    hls.js `mediaSourceRequiresReset`. Same in jellyfin-web on Chrome; plays in Safari. Suspect
    Hi10P mis-reported as 8-bit — check the item's Media Info and `chrome://media-internals`.
    Possible fix: on a decode error, re-negotiate once with video stream copy disabled.
- [ ] **Localization view models** (`ViewModels/Localization/*`): countries, cultures, parental ratings.
- [ ] **Programs / live TV** (`ProgramsViewModel`, `ChannelLibraryViewModel`, `ChannelProgram`).
- [ ] **Reset password / local user security** beyond sign-in basics.
- [ ] Server discovery (`JellyfinClient.discover()` UDP broadcast): SDK has HTTP-based
  `discovery` service; the local-network broadcast form is a later, platform-specific concern.

## Foundation — follow-ups

- [ ] **Value observation / reactivity for `StoredValues`** (Swiftfin's `_Observable`): current port
  is read/write; add change subscriptions when a UI needs live settings updates.
- ✅ **Device profile / playback capabilities**: `playback/deviceProfile.ts` from an engine's
  `PlayerCapabilities`.
- [ ] **Strings / i18n** (`Shared/Strings`, `L10n`): port the localization catalog. For now,
  user-facing strings are inlined/English.
- [ ] Schema migrations framework (Drizzle migrations) — start with a single initial schema; add
  migration tooling if the model evolves (mirrors Swiftfin V1→V2→V3).

## Foundation — follow-ups (added this run)

- [ ] **Redirect-aware connection URL**: `connectToServer` keeps the entered (normalized) URL;
  Swiftfin rewrites it from the response URL after proxy redirects. Add response-URL handling.
- [ ] **Local server discovery**: `ConnectToServerViewModel.localServers` is present but unpopulated;
  wire the SDK's HTTP `discovery` service (and/or a native UDP broadcast) later.
- ✅ **Library setting keys**: `UserKeys.libraryDisplayType` / `libraryFilters` (per user, per
  library) + `useStoredValue`. Defaults are fixed (`grid`, name ascending) rather than read from
  `AppDefaults.Customization.Library` — wire that fallback when a settings screen exists.
- [ ] Remaining Swiftfin filters: tags, years, traits beyond played/favorite, letter picker; genre
  list comes from `getGenres` rather than `/Items/Filters` (`getQueryFilters`).
- ✅ **Device profile / playback capabilities**: see `docs/playback.md`.

## Basic UI (built)

- ✅ Connect-to-server, sign-in, and library-browse screens using `@expo/ui` universal components,
  driven by the core view models / query hooks. Session-based flow in `AppNavigator`.
- ✅ Web support: `.web.ts` platform adapters (localStorage KV + secure stub) + core "defaults-only"
  storage mode (no SQLite) + monorepo `metro.config.js`; `expo export --platform web` builds clean.

### UI follow-ups

- ✅ Home experience: dark theme, hero carousel (recently added, auto-advancing) + per-library
  "recently added" poster rows, built with RN primitives (browser-testable via react-native-web,
  since Expo UI universal has no Image). Row titles open the full library.
- ✅ Continue Watching row: landscape resume cards with a progress bar. The thumbnail uses
  `resumeFrameSource` — the chapter image at/just-before the resume position (a real frame near
  where you resume), falling back to a landscape image.
- ✅ **Navigation**: React Navigation native stack (`navigation/RootStack.tsx`), id-only params
  with web linking (`/library/:libraryID`, `/item/:itemID`) so refresh/back work in the browser.
  Auth screens remain state-based in `AppNavigator`.
- ✅ **Section switcher**: `Browse` shell (`navigation/BrowseShell.tsx`) with a nested section stack
  (Home / one library). Wide screens + TV: collapsing icon rail (`ui/SectionRail.tsx`, expands on
  focus/hover); phones < 700pt: bottom tab bar (`ui/SectionTabBar.tsx`). Home rows no longer have
  "See all". Pages size from `useContentWidth()` (window minus rail).
- ✅ Rail is a floating glass pill (`GlassSurface`: `expo-glass-effect` on iOS 26+, `expo-blur`
  elsewhere incl. Android TV); pages run full width beneath it via `useContentLayout()` insets.
- ✅ **Navigation position** setting (Left | Right | Top | Bottom, default Left) for wide screens.
  Side pills expand on focus/hover and push that side's inset past the pill; top/bottom pills are
  horizontal, never expand, keep the standard gutter and reserve `insetTop`/`insetBottom`. "Show
  labels" (top/bottom only) puts names under the icons. Phones always get a compact icon-only
  bottom pill — the old `SectionTabBar` is gone. D-pad: the direction toward the page (or Back)
  returns focus to it. Untested on TV/tablet so far.
- ✅ Compact screens (phones, narrow web) use smaller posters (120), 16:9 cards (260 for Continue
  Watching, episodes and extras) via `useCardWidths()`, and a 20pt gutter (`gutterFor`).
- ✅ **Settings section** (`/settings`, gear at the bottom of the rail/tab bar): "Hero glow" and
  "Glass blur" toggles, persisted per device (`AppSettingsKeys` in core, defaults in
  `apps/mobile/src/settings.ts`). Glass blur defaults off on TV. Sub-setting "Glass buttons"
  (opt-in, only while blur is on) frosts the translucent action buttons; the hero slide and item
  header each have their own `GlassScope` so Android can blur the artwork beneath them.
  "Focus highlight" (Outline | Glow) under Focus: outline default on TV, glow elsewhere;
  `useFocusIndicator()` + `FocusRing` / `focusGlow()` in `ui/Focusable.tsx`. Rows reserve
  `focusRoom` (lift + glow reach) so the glow isn't clipped.
- ✅ **Settings hub** (`ui/settings/`): native grouped lists — SwiftUI `Form` on iOS/iPadOS/tvOS,
  Material connected rows on Android phones — and themed rows on web/Android TV (`nativeControls`).
  Hub = Account (inline) + Preferences (Navigation, Appearance) + About (app version, server name,
  Jellyfin version, address), sub-pages via `SettingsPage` (`/settings/:page`).
- ✅ **Admin dashboard** (`docs/admin-dashboard.md`): Settings → Administration (administrators
  only) → Sessions (live list + detail), Activity (paged log + detail), Devices (rename, delete),
  Users (add, rename, permissions, password, delete).
- [ ] Admin: per-user media / device / Live TV access, parental ratings, access schedules and tags,
  Quick Connect authorise, user profile image (Swiftfin `ServerUserSettings/*`).
- [ ] Admin: API keys, server logs, scheduled tasks (Swiftfin's "Advanced" dashboard section).
- [ ] Admin: session remote control (pause/stop/message), multi-select delete for devices/users.
- ✅ Artwork via `expo-image` (`ui/Artwork.tsx`): disk cache across launches (plus memory off TV),
  BlurHash placeholders on posters and hero backdrops, short fade-in.
- [ ] Drop the temporary `minimumReleaseAgeExclude: [expo]` in `pnpm-workspace.yaml` after 9 Oct
  2026 (expo 57.0.25 then meets the 15-day rule).
- [ ] BlurHash placeholders for landscape cards (callers pass a URL only today).
- [ ] iOS/Android settings lists stop above the phone pill (a native list can't scroll under it)
  and don't report page scroll, so the phone pill doesn't shrink on Settings.
- [ ] Verify the native settings lists on device: iPhone, iPad, tvOS (menu picker + focus), Android
  phone (dropdown anchoring, row corner clipping).
- [ ] Revisit TV blur cost: blur only while the rail is expanded, or a static pre-blurred backdrop;
  measure on a release build.
- [ ] Release-build memory check on TV: debug build sits at ~200 MB native heap / ~400 MB PSS on a
  1.8 GB box and got killed by lmkd once. Images are now sized via `imagePixelWidth()`.
- ✅ Ionicons (`@expo/vector-icons`) everywhere via `ui/Icon.tsx` — rail/tabs, actions, chips,
  badges, chevrons.
- ✅ **Accounts**: signed out, the app shows a "Who's watching?" picker (`screens/SelectUserScreen.tsx`)
  of saved accounts per server — tap to sign straight in, Add User / Add Server, Edit to remove
  accounts or servers; empty goes to Connect. Settings → Account: Switch User (back to the picker,
  account kept) and Sign Out (confirms, then forgets the account on this device).
- ✅ **Library screen**: responsive poster grid / list toggle, infinite scroll, sort + direction,
  unplayed/favorites/genre filters, all persisted per library.
- ✅ **Item screen**: cinematic backdrop + logo header, facts & media badges, Play/Resume target,
  played/favorite toggles, overview, season picker + episodes (series), season episodes, box-set
  members, cast, additional parts/trailers/special features, similar items, About (credits +
  per-version media info).
- ✅ **Playback**: Play/Resume opens the player (`usePlayItem`).
- [ ] Trailers/extras still open their own item page; play them directly with `usePlayItem`.
- ✅ **Person page**: people are items, so the `Item` route renders `PersonDetail` for them —
  photo, birth/death (`personLifeLabels`), biography, Movies/Shows shelves (`personItemsQuery`).
  Cast cards and people search results open it (`ui/PersonCard.tsx`).
- [ ] Person page: episodes / guest roles, and a full filterable library of the person's items.
- ✅ Hover/focus states: `Focusable` (hover-driven + eased on web, D-pad on TV).
- ✅ Home hero reuses the item page's `ItemTitleBlock` (title art, facts, Play/played/favorite) and `backdropImageSource`.
- ✅ Native stack verified on iOS (iPhone 14 Pro), Android and Android TV.
- ✅ **Search** section in the pill: debounced field, then Movies / Shows / Episodes / Collections
  / People shelves (`useSearchResults`, `searchItemScopes`, `searchPeopleQuery`).
- [ ] Search: recent searches, and filters (genre, year) like Swiftfin.
- [ ] PIN / biometric access-policy capture on sign-in (currently always `none`).

- [ ] Verify image auth on servers that require `api_key` (hero/backdrops use `backdropImageSource`).
- ✅ Theme layer (`ui/theme.ts`): colours, type scale, weights, radii drive every screen,
  connect/sign-in included. Form controls are platform-native via `@expo/ui` where it fits
  (`ui/nativeControls.ts`): iOS/iPadOS/tvOS and Android phones; themed ones on Android TV and web.

## Completed (foundation run)

- ✅ Monorepo scaffold: pnpm workspace, Expo SDK 57 app, `@anemone/core` package, 15-day release-age
  policy, vitest + better-sqlite3.
- ✅ Foundation: DI container + injected adapters (`SecureStore`, `KeyValueStore`, `AnemoneDatabase`,
  `Logger`); `any_data` blob store; `StoredValues` + `Defaults` + server/user keys; `UserSecrets`;
  `ServerState`/`UserState`/`UserSession`; `JellyfinClientFactory`; `ErrorMessage`; logging.
- ✅ `@Stateful` reducer store (`createStatefulStore`) + `useStateful` hook.
- ✅ Auth/session VMs: `createConnectToServerViewModel`, `createUserSignInViewModel` (incl. Quick
  Connect + save/access-policy), `createSelectUserViewModel`; `SessionController` + `AnemoneProvider`.
- ✅ Data layer (TanStack Query): user views, resume, next-up, latest-in-library, item, seasons,
  episodes, genres, search, infinite paging library + hooks + `useSetItemPlayed`.
- ✅ `BaseItemDto` helpers (display title, episode/season labels, progress/runtime, played fraction,
  premiere year, playability), `ImageSource` builders (via SDK `ImageUrlsApi`), ticks utilities.
- ✅ Expo platform adapters (MMKV / secure-store / expo-sqlite) + `configureAnemone` bootstrap;
  app compiles against core.
- ✅ 54 vitest tests; `@anemone/core` and `@anemone/mobile` typecheck clean.
