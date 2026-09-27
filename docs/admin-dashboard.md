# Admin dashboard

Server administration for Jellyfin administrators, ported from Swiftfin's `AdminDashboardView`.
Reached from **Settings → Administration**, which only renders when the signed-in user's
`Policy.IsAdministrator` is true (`useIsAdministrator()`, backed by a fresh `getCurrentUser`).
The server refuses these endpoints to everyone else anyway.

## Pages

| Route | Page | Data | Writes |
| --- | --- | --- | --- |
| `AdminSessions` (`/settings/sessions`) | Sessions list: filter All/Playing/Idle, active within 15 min–1 week | `useActiveSessions` (polls every 5 s while focused) | — |
| `AdminSession` | Now playing, progress, user, device, stream method/codecs/HW accel, transcode reasons | `useActiveSession` (same query, `select`) | — |
| `AdminActivity` | Activity log, paged 50, filter All/Users/System | `useActivityLog` (infinite) | — |
| `AdminActivityEntry` | Overview, user, item, level/type/date | `useLoadedActivityEntry` (from the list cache) | — |
| `AdminDevices` | Devices, most recent first; "This device" badge | `useDevices` | — |
| `AdminDevice` | Custom name, last user, app/version/capabilities, delete | `useDevice` | `useRenameDevice`, `useDeleteDevice` |
| `AdminUsers` | Users by name with Administrator/Disabled/Hidden badges; Add User | `useServerUsers` | — |
| `AdminAddUser` | Name + optional password → opens the new user | — | `useCreateServerUser` |
| `AdminUser` | Rename, Permissions, Password, delete | `useServerUser` | `useRenameServerUser`, `useDeleteServerUser` |
| `AdminUserPermissions` | Policy switches (status, playback, management, access, remote control) | `useServerUser` | `useUpdateServerUserPolicy` (optimistic) |
| `AdminUserPassword` | Set or remove a password (no current password needed) | — | `useSetServerUserPassword` |

## Structure

- **Core** (`packages/core/src/admin/`): `adminQueries.ts` (query options), `adminActions.ts` (SDK
  writes), `adminHooks.ts` (React hooks; writes invalidate `jellyfinKeys.adminDevices` /
  `adminUsers` and `currentUser`), `sessions.ts` (filter/sort/progress/play-method, pure),
  `lastSeen.ts` ("3 hours ago"; hand-rolled because Hermes lacks `Intl.RelativeTimeFormat`).
  Keys live under `jellyfinKeys.admin(userID)`. Tests: `tests/admin.test.ts`.
- **App** (`apps/mobile/src/screens/admin/`): list pages use `AdminListPage` + `AdminRow` (themed
  RN on every platform: artwork, progress, paging, pull-to-refresh, TV list height fix). Detail and
  edit pages use the settings kit (`ui/settings`), so they're a native `Form` / Compose list where
  `nativeControls` is on. `DeleteSection` is the inline confirm for destructive actions;
  `DetailPlaceholder` is the loading/error state for detail pages.

## Guards and quirks

- You can't delete the device you're using, delete your own account, or remove your own
  administrator access / disable yourself (those switches are hidden on your own account).
- The activity log can't fetch one entry by id, so an entry's page reads it from the loaded list;
  a deep link to an unlisted entry says so.
- System activity entries carry the empty GUID as `UserId` (`activityUserID()` filters it).
- `DeviceApi.deleteDevice` takes an array of ids in this SDK version.
