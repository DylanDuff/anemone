# AnemoneReact

A cross-platform [Jellyfin](https://jellyfin.org) client for **iOS, Android, Android TV, and
tvOS**, built with React Native + Expo. It is a TypeScript port of
[Swiftfin](https://github.com/jellyfin/Swiftfin) / the `anemone` fork, structured so the **business
logic is a shared, platform-agnostic package** and the UI is a thin, fast-to-iterate layer on top.

## Status

The **business logic layer is built and tested**; the UI comes next.

- ✅ `@anemone/core` — foundation (DI, persistence, session, auth), view models, and playback
  (device profiles, stream negotiation, track switching, progress reporting).
- ✅ Video playback on iOS/Android/Android TV (react-native-video) and web (hls.js) — see
  [`docs/playback.md`](docs/playback.md).
- 🚧 Remaining UI, tvOS, playback follow-ups, downloads, admin — see
  [`docs/BACKLOG.md`](docs/BACKLOG.md).

## Layout

```
packages/core/   @anemone/core — platform-agnostic business logic (no react-native / expo). The core deliverable.
apps/mobile/     @anemone/mobile — Expo (SDK 57) app shell; injects platform adapters into core.
docs/            architecture reference + backlog.
```

## Getting started

Requires Node 22+, pnpm 10+.

```bash
pnpm install          # respects a 15-day minimum-release-age policy (see pnpm-workspace.yaml)
pnpm -r typecheck     # typecheck core + app
pnpm core:test        # run the core test suite (vitest)
```

Running the app needs a **custom dev build** (native modules: `expo-sqlite`, `expo-secure-store`,
`react-native-mmkv`) — not Expo Go. Dev-client/prebuild wiring is a backlog item.

## How it fits together

The business logic depends only on injected interfaces (`SecureStore`, `KeyValueStore`, a Drizzle
SQLite handle, `Logger`); the app provides Expo implementations. A UI consumes view models and
TanStack Query hooks from `@anemone/core`:

```tsx
const container = await configureAnemone();
<QueryClientProvider client={queryClient}>
  <AnemoneProvider container={container}>
    {/* screens use useCurrentSession(), useUserViews(), useLibraryItems(), createConnectToServerViewModel(), … */}
  </AnemoneProvider>
</QueryClientProvider>
```

See **[`docs/architecture.md`](docs/architecture.md)** for the full design (DI, persistence, the
`@Stateful` reducer pattern, the query layer, and the Swiftfin→TypeScript mapping),
**[`docs/playback.md`](docs/playback.md)** for the player (engines, negotiation, subtitles), and
**[`CLAUDE.md`](CLAUDE.md)** for conventions.

## License

MPL-2.0, following Swiftfin.
