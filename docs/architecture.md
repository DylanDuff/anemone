# Architecture — `@anemone/core`

The business logic of AnemoneReact is a **pure-TypeScript package** (`packages/core`) with no
React Native or Expo imports, so the same logic runs on iOS, Android, Android TV, tvOS, and in Node
tests. This document is the developer reference for how it is structured and how a UI plugs into it.

It is a port of [Swiftfin](https://github.com/jellyfin/Swiftfin)'s `Shared/` layer. Where Swiftfin
uses the Swift Jellyfin SDK, we use the official TypeScript [`@jellyfin/sdk`](https://www.npmjs.com/package/@jellyfin/sdk);
we do not reinvent networking or models.

## Layers

```
container/     Dependency injection (Factory equivalent) + injected adapter interfaces
logging/       Logger interface (swift-log equivalent)
errors/        ErrorMessage
data/          Persistence: any_data table, AnyDataStore, StoredValues, Defaults, key defs
jellyfin/      SDK client factory, operation re-exports, item/image/ticks/playstate helpers
session/       ServerState, UserState, UserSession, secrets, auth, connection, controller
stateful/      The @Stateful reducer store + React hook
query/          TanStack Query option builders + hooks (data-fetching view models)
react/         AnemoneProvider + hooks (useCurrentSession, useQueryContext, …)
viewmodels/    Stateful-pattern view models (connect, sign-in, select-user)
```

## Dependency injection (the cross-platform seam)

Core never imports a platform module. Instead the app injects four adapters at startup via
`configureContainer(...)` (or a test builds an `AnemoneContainer` directly):

| Interface | Purpose | App impl | Test impl |
| --- | --- | --- | --- |
| `SecureStore` | secrets: tokens, PINs | `expo-secure-store` | in-memory |
| `KeyValueStore` | settings (`Defaults`) | `react-native-mmkv` | in-memory |
| `AnemoneDatabase` | Drizzle SQLite handle | `expo-sqlite` | `better-sqlite3` |
| `Logger` | logging | console | noop |

`AnemoneContainer` wires these into `StoredValues`, `Defaults`, `UserSecrets`, the
`JellyfinClientFactory`, and resolves/caches the current `UserSession`
(`currentUserSession()` — Swiftfin's `Container.currentUserSession`).

## Persistence

Mirrors Swiftfin's `SwiftfinStore` V3 design: a **single blob table** `any_data(owner_id, field,
key, data)` (`data/schema.ts`) accessed through `AnyDataStore`. On top of it:

- **`StoredValues`** — typed keys routed to either `sql` (the blob table) or `defaults` (the
  key/value store). Keys live in `data/keys/serverKeys.ts` and `userKeys.ts`
  (`Server.servers`, `Server.publicInfo(id)`, `User.users`, `User.data(id)`, …).
- **`Defaults`** — app/user settings over `KeyValueStore` (`data/keys/appDefaults.ts`:
  `lastSignedInUserID`, library customization defaults).
- **`UserSecrets`** — access tokens & PINs in the `SecureStore`, keyed `${id}-accessToken` /
  `${id}-pin`.

> **PascalCase**: `@jellyfin/sdk` models use PascalCase properties (`Name`, `Id`, `ServerName`,
> `RunTimeTicks`, `UserData.PlaybackPositionTicks`) — unlike Swiftfin's camelCase Swift SDK.

## View models

Two flavors, per the agreed hybrid approach:

### 1. `@Stateful` reducer stores — interactive flows

`stateful/createStatefulStore.ts` ports Swiftfin's `@Stateful` macro: an action carries a
**transition** (`Transitions.to(state, then?)`, `.loop(state)`, `.background(bg)`, `.none()`), a
handler performs the async work, and side effects are emitted as **events**. Errors are coerced to
`ErrorMessage` and exposed on the store. React binds via `useStateful(store)` /
`useStatefulEvents(store, handler)`.

View models (`viewmodels/`):
- `createConnectToServerViewModel` — connect to & save a server (`connected` / `duplicateServer`).
- `createUserSignInViewModel` — username/password + Quick Connect + save-with-access-policy
  (`connected` / `existingUser` / `saved`).
- `createSelectUserViewModel` — list servers/users, delete users, sign in (`signedIn`).

Each is a factory taking the `AnemoneContainer` (and, where relevant, a `ServerState`).

### 2. TanStack Query — data fetching

`query/queries.ts` exposes pure `queryOptions`/`infiniteQueryOptions` builders keyed per user
(`query/queryKeys.ts`), e.g. `userViewsQuery`, `resumeItemsQuery`, `nextUpQuery`,
`latestInLibraryQuery`, `itemQuery`, `seasonsQuery`, `episodesQuery`, `searchItemsQuery`,
`libraryItemsInfiniteQuery`. `query/hooks.ts` wraps them as hooks (`useUserViews`,
`useLibraryItems`, `useItem`, `useSearch`, …) plus `useSetItemPlayed` / `useSetItemFavorite`
(mutations called with `{ itemID, enabled }`). The Home screen is a composition of the
resume/next-up/latest/genres queries; the paging library is a single infinite query (page grows
until a short page — Swiftfin's `hasNextPage` rule).

**Item detail.** `itemQuery` fetches the *full* item (`LibraryApi.getItem`: overview, people,
studios, media sources). Related data is keyed *under* the item via
`jellyfinKeys.itemRelation(user, itemID, relation)` — `similarItemsQuery`, `specialFeaturesQuery`
(theme songs excluded), `localTrailersQuery`, `additionalPartsQuery` (enabled only when
`PartCount > 1`) and `seriesPlayTargetQuery` (next-up → in-progress → first episode, via the pure
`seriesPlayTarget`). Played/favorite mutations invalidate every per-user item surface
(`resumeItems`, `nextUp`, `allItem`, `allItems`, `allEpisodes`) so all screens stay consistent.

**Library filters.** `query/libraryFilters.ts` holds a JSON-serialisable `LibraryFilters` (sort
field + order, unplayed/favorites traits, genre names) and `libraryItemsRequest(parent, filters)`,
which layers them on `libraryParentRequest`. Non-name sorts add `SortName` as a tiebreaker for
stable paging. Filters and grid/list mode persist per user per library via
`UserKeys.libraryFilters` / `UserKeys.libraryDisplayType`, read in React with
`useStoredValue(key)` — which caches the value in TanStack Query so every reader updates on write,
and exposes `isLoaded` so screens can wait before issuing the first page request.

**Display helpers.** `jellyfin/mediaInfo.ts` derives resolution/HDR/codec/channel labels and
per-version summaries from `MediaSources`; `itemMetadataLabels` gives the "2019 · PG-13 · 1h 52m ·
★ 7.8" facts line; `backdropImageSource` / `logoImageSource` fall back to the parent's art so
episodes show series imagery.

## Wiring a UI

```tsx
const container = await configureAnemone();            // app builds adapters + configureContainer
<QueryClientProvider client={queryClient}>
  <AnemoneProvider container={container}>
    <App />                                             // useCurrentSession, useUserViews, etc.
  </AnemoneProvider>
</QueryClientProvider>
```

`useCurrentSession()` drives the signed-in/out root (backed by `SessionController`).
`useQueryContext()` yields the authenticated `{ api, userID }` for data hooks.

## Testing

`vitest` + `better-sqlite3`. `tests/support/` provides in-memory adapters and `makeTestContainer`.
Persistence is tested against a real SQLite database; view models are tested by mocking
`src/jellyfin/api` and asserting on events/state and persisted `StoredValues`.

Run: `pnpm core:test`, `pnpm core:typecheck` (or `pnpm -r typecheck` / `pnpm -r test`).
