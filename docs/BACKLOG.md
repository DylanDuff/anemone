# Backlog — deferred work

Tracks everything intentionally **not** done in the current business-logic run, so it can be picked
up later. Grouped by area. Update this as items are completed or added.

## Dependencies / tooling

- [ ] **Upgrade `@jellyfin/sdk` 1.0.0 → keep current once aged.** Installed under a one-time
  15-day-rule exclusion (`minimumReleaseAgeExclude`). Once 1.0.0 is >15 days old (after ~2026-09-26),
  remove the exclusion from `pnpm-workspace.yaml`.
- [ ] Add `oxlint` + `oxfmt` config and a `lint`/`format` script (user has them installed globally).
- [ ] CI: run `pnpm core:test` + `pnpm core:typecheck` on push.

## Platform / app shell (UI phase)

- [ ] **TV targets** (tvOS, Android TV): needs `react-native-tvos` + `@react-native-tvos/config-tv`.
  Business logic is already TV-agnostic; only the app shell + UI need TV wiring.
- [ ] Install `@expo/ui` and `expo-router` when UI work begins (deliberately not installed yet).
- [ ] Dev client / prebuild: `expo-sqlite`, `expo-secure-store`, `react-native-mmkv` are native
  modules — the app needs a custom dev build (not Expo Go). Wire `expo prebuild` / EAS later.
- [ ] Implement the real Expo platform adapters in `apps/mobile` (SecureStore/KeyValueStore/DB/Logger)
  and call `configureContainer(...)` at app startup.

## Business logic — deferred view models & services

These exist in Swiftfin `Shared/` but are out of scope for the foundation + core-VM run:

- [ ] **Admin dashboard** (`ViewModels/AdminDashboard/*`): active sessions, API keys, devices,
  server activity/logs, server tasks, user management.
- [ ] **Item administration / editors** (`ViewModels/ItemAdministration/*`): identify item, metadata
  editor, genres/people/studios/tags editors, subtitle search, remote images.
- [ ] **Downloads** (`Services/DownloadManager`, `DownloadTask`, `DownloadListViewModel`): offline
  media. Ties into native file storage — needs a platform adapter.
- [ ] **Media player manager** (`Objects/MediaPlayerManager/*`): playback queue, now-playing,
  proxies, trickplay/preview images, device profiles, playback compatibility. Deeply tied to native
  video playback (VLCKit/AVKit) — the RN equivalent (e.g. a video player module) is a separate track.
- [ ] **Localization view models** (`ViewModels/Localization/*`): countries, cultures, parental ratings.
- [ ] **Programs / live TV** (`ProgramsViewModel`, `ChannelLibraryViewModel`, `ChannelProgram`).
- [ ] **Reset password / local user security** beyond sign-in basics.
- [ ] Server discovery (`JellyfinClient.discover()` UDP broadcast): SDK has HTTP-based
  `discovery` service; the local-network broadcast form is a later, platform-specific concern.

## Foundation — follow-ups

- [ ] **Value observation / reactivity for `StoredValues`** (Swiftfin's `_Observable`): current port
  is read/write; add change subscriptions when a UI needs live settings updates.
- [ ] **Device profile / playback capabilities** (`Objects/PlaybackDeviceProfile`, `DeviceProfile`):
  needed for constructing playback URLs; deferred with the media player.
- [ ] **Strings / i18n** (`Shared/Strings`, `L10n`): port the localization catalog. For now,
  user-facing strings are inlined/English.
- [ ] Schema migrations framework (Drizzle migrations) — start with a single initial schema; add
  migration tooling if the model evolves (mirrors Swiftfin V1→V2→V3).

## Foundation — follow-ups (added this run)

- [ ] **Redirect-aware connection URL**: `connectToServer` keeps the entered (normalized) URL;
  Swiftfin rewrites it from the response URL after proxy redirects. Add response-URL handling.
- [ ] **Local server discovery**: `ConnectToServerViewModel.localServers` is present but unpopulated;
  wire the SDK's HTTP `discovery` service (and/or a native UDP broadcast) later.
- [ ] **Library setting keys** (`libraryDisplayType`, `libraryFilters`, etc.): current-user-scoped
  `StoredValues` keys whose defaults read from `Defaults`; port with the library UI + `FilterViewModel`.
- [ ] **Device profile / playback capabilities**: needed for real playback URLs; deferred with the
  media player.

## Completed (this run)

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
