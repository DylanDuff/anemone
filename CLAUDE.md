# AnemoneReact

A cross-platform Jellyfin client (iOS, Android, Android TV, tvOS), ported from
[Swiftfin](https://github.com/jellyfin/Swiftfin) / the `../anemone` fork. The **business logic
is a pure-TypeScript package** so the same logic drives every platform and any future UI.

## Monorepo layout

```
packages/core/   @anemone/core — platform-agnostic business logic. NO react-native, NO expo.
                 Tested in plain Node (vitest + better-sqlite3). This is the primary deliverable.
apps/mobile/     @anemone/mobile — Expo (SDK 57) shell. Injects platform adapters into core and
                 (later) renders the UI. iOS/Android now; TV targets are backlog.
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
