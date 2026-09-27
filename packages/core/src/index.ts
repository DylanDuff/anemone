//
// AnemoneReact is subject to the terms of the Mozilla Public
// License, v2.0. Ported from Swiftfin (c) Jellyfin & Jellyfin Contributors.
//
// Public API of @anemone/core — the platform-agnostic business logic.
//

// Container / dependency injection
export type { AnemoneDatabase, KeyValueStore, SecureStore } from "./container/adapters";
export {
    AnemoneContainer,
    configureContainer,
    type ContainerConfig,
    getContainer,
    resetContainer,
} from "./container/container";

// Logging
export { consoleLogger, type Logger, type LogLevel, noopLogger } from "./logging/logger";

// Errors
export { ErrorMessage } from "./errors/errorMessage";
export { describeError, type ErrorDescription, type ErrorKind } from "./errors/describeError";

// Data / persistence
export { AnyDataStore } from "./data/anyData";
export { initializeSchema } from "./data/database";
export { Defaults, defaultsKey, type DefaultsKey } from "./data/defaults";
export {
    APP_OWNER_ID,
    alwaysKey,
    type StorageDestination,
    StoredValues,
    type StoredValueKey,
    storedKey,
} from "./data/storedValues";
export { AppDefaults } from "./data/keys/appDefaults";
export {
    AppSettingsKeys,
    type FocusIndicator,
    focusIndicatorValues,
    type NavigationPlacement,
    navigationPlacementValues,
} from "./data/keys/appSettingsKeys";
export { ServerKeys } from "./data/keys/serverKeys";
export { UserKeys } from "./data/keys/userKeys";
export { anyData, type AnyDataRow, createSchemaStatements } from "./data/schema";

// Models
export {
    type LibraryDisplayType,
    libraryDisplayTypeMeta,
    libraryDisplayTypeValues,
    type PosterDisplayType,
    posterDisplayTypeMeta,
    posterDisplayTypeValues,
    supportedPosterDisplayTypes,
} from "./models/displayTypes";
export {
    type LocalUserAccessPolicy,
    localUserAccessPolicyValues,
} from "./models/localUserAccessPolicy";
export { isSignedIn, signedIn, signedOut, type UserSignInState } from "./models/userSignInState";

// Jellyfin client
export {
    type Api,
    type ClientIdentity,
    type ClientInfo,
    type DeviceInfo,
    JellyfinClientFactory,
} from "./jellyfin/client";

// Session
export {
    makeServerState,
    type ServerState,
    serverStateAddingURL,
} from "./session/serverState";
export { makeUserState, type UserState } from "./session/userState";
export { makeUserSession, type UserSession } from "./session/userSession";
export { UserSecrets } from "./session/userSecrets";
export {
    connectToServer,
    normalizeServerURL,
    type ServerConnectionResult,
} from "./session/serverConnection";
export {
    type AuthenticationResult,
    signIn,
    signInWithQuickConnect,
} from "./session/authentication";
export { deleteServer, deleteUser } from "./session/userManagement";

// Jellyfin operation factories (Paths.* equivalents)
export * as JellyfinApi from "./jellyfin/api";
export {
    formatClock,
    formatHoursMinutes,
    secondsToTicks,
    TICKS_PER_SECOND,
    ticksToSeconds,
} from "./jellyfin/ticks";
export {
    displayTitle,
    episodeLocator,
    formatLongDate,
    isFavorite,
    isLiveStream,
    isMissing,
    isPlayable,
    isPlayed,
    isUnaired,
    itemMetadataLabels,
    playbackPositionTicks,
    playButtonLabel,
    playedFraction,
    premiereYear,
    progressLabel,
    runtimeLabel,
    runtimeSeconds,
    seasonEpisodeLabel,
    type SeriesPlayCandidates,
    seriesPlayTarget,
    personFromItem,
    personLifeLabels,
    uniqueItems,
} from "./jellyfin/itemHelpers";
export {
    audioChannelsLabel,
    codecLabel,
    mediaAttributeBadges,
    mediaSourceSummary,
    type MediaSourceSummary,
    videoRangeLabel,
    videoResolutionLabel,
} from "./jellyfin/mediaInfo";
export {
    backdropImageSource,
    blurHashString,
    ImageType,
    type ImageRequestOptions,
    type ImageSource,
    itemImageSource,
    itemImageURLById,
    logoImageSource,
    personImageSource,
    resumeFrameSource,
    savedUserImageURL,
    seriesImageSource,
    userImageURL,
} from "./jellyfin/images";
export { setItemFavorite, setItemPlayed } from "./jellyfin/playstate";

// Playback
export {
    type DirectPlayFormat,
    IMAGE_SUBTITLE_FORMATS,
    type PlayerCapabilities,
    type TranscodeFormat,
} from "./playback/capabilities";
export { buildDeviceProfile } from "./playback/deviceProfile";
export {
    type AudioDelivery,
    type ExternalSubtitle,
    mediaURL,
    type PlaybackRequest,
    type PlaybackSource,
    type PlaybackTrack,
    resolvePlayback,
    type SubtitleDelivery,
    SUBTITLES_OFF,
} from "./playback/playbackSource";
export { selectTrackLocally, type TrackChange } from "./playback/trackSelection";
export {
    type PlaybackProgress,
    PlaybackReporter,
    type PlaybackReporterOptions,
} from "./playback/playbackReporter";
export {
    createPlaybackViewModel,
    type PlaybackAction,
    type PlaybackBackgroundState,
    type PlaybackData,
    type PlaybackState,
    type PlaybackViewModel,
    type PlaybackViewModelOptions,
} from "./playback/playbackViewModel";
export { type PlaybackReporting, usePlaybackReporting } from "./playback/usePlaybackReporting";

// Query layer (data-fetching view models)
export { type QueryContext, queryContextFromSession } from "./query/queryContext";
export { libraryParentRequest } from "./query/libraryParent";
export {
    activeFilterCount,
    clearedFilters,
    defaultLibraryFilters,
    type LibraryFilters,
    libraryItemsRequest,
    type LibrarySortField,
    librarySortFields,
    librarySortMeta,
    SortOrder,
    toggleGenre,
    withSortField,
} from "./query/libraryFilters";
export { jellyfinKeys } from "./query/queryKeys";
export {
    additionalPartsQuery,
    DEFAULT_PAGE_SIZE,
    episodesQuery,
    genresQuery,
    type ItemsRequest,
    itemQuery,
    latestInLibraryQuery,
    libraryItemsInfiniteQuery,
    libraryPageItems,
    localTrailersQuery,
    nextUpQuery,
    personItemsQuery,
    resumeItemsQuery,
    SEARCH_RESULT_LIMIT,
    type SearchItemScope,
    type SearchFilter,
    searchFilterIncludes,
    searchFilters,
    searchItemScopes,
    searchScopeRequest,
    seasonsQuery,
    searchItemsQuery,
    searchPeopleQuery,
    seriesPlayTargetQuery,
    serverInfoQuery,
    itemsByIDsQuery,
    similarItemsQuery,
    specialFeaturesQuery,
    userViewsQuery,
} from "./query/queries";
export {
    useAdditionalParts,
    useEpisodes,
    useGenres,
    useItem,
    useLatestInLibrary,
    useLibraryItems,
    useLocalTrailers,
    useNextUp,
    usePersonItems,
    useRefreshUserItemData,
    useResumeItems,
    useSearch,
    useSearchPeople,
    type SearchCategoryResults,
    useSearchResults,
    useSeasons,
    useSeriesPlayTarget,
    useServerInfo,
    useSetItemFavorite,
    useSetItemPlayed,
    useSimilarItems,
    useSpecialFeatures,
    useUserViews,
} from "./query/hooks";

// React integration
export {
    AnemoneProvider,
    type AnemoneProviderProps,
    useContainer,
    useCurrentSession,
    useQueryContext,
    useSessionController,
} from "./react/context";
export { type StoredValueBinding, useStoredValue } from "./react/useStoredValue";
export {
    SessionController,
    type SessionSnapshot,
} from "./session/sessionController";

// Stateful reducer pattern
export { EventBus } from "./stateful/eventBus";
export {
    createStatefulStore,
    type StatefulConfig,
    type StatefulContext,
    type StatefulSnapshot,
    StatefulStore,
    type Transition,
    Transitions,
} from "./stateful/createStatefulStore";
export { useStateful, useStatefulEvents } from "./stateful/useStateful";

// View models
export {
    type ConnectToServerAction,
    type ConnectToServerData,
    type ConnectToServerEvent,
    type ConnectToServerState,
    type ConnectToServerViewModel,
    createConnectToServerViewModel,
} from "./viewmodels/connectToServerViewModel";
export {
    createSelectUserViewModel,
    type SavedUser,
    type SelectUserAction,
    type SelectUserBackgroundState,
    type SelectUserData,
    type SelectUserEvent,
    type SelectUserState,
    type SelectUserViewModel,
    type ServerUsers,
} from "./viewmodels/selectUserViewModel";
export {
    createUserSignInViewModel,
    type DecidedAccessPolicy,
    type SaveUserRequest,
    type UserSignInAction,
    type UserSignInBackgroundState,
    type UserSignInData,
    type UserSignInEvent,
    type UserSignInViewState,
    type UserSignInViewModel,
} from "./viewmodels/userSignInViewModel";

// Admin dashboard
export {
    createServerUser,
    deleteDevice,
    deleteServerUser,
    renameDevice,
    renameServerUser,
    setServerUserPassword,
    updateServerUserPolicy,
} from "./admin/adminActions";
export {
    useActiveSession,
    useActiveSessions,
    useActivityLog,
    useCreateServerUser,
    useCurrentUser,
    useDeleteDevice,
    useDeleteServerUser,
    useDevice,
    useDevices,
    useIsAdministrator,
    useLoadedActivityEntry,
    useRenameDevice,
    useRenameServerUser,
    useServerUser,
    useServerUsers,
    useSetServerUserPassword,
    useUpdateServerUserPolicy,
} from "./admin/adminHooks";
export {
    ACTIVITY_PAGE_SIZE,
    type ActivityFilter,
    activeSessionsQuery,
    activityLogInfiniteQuery,
    currentUserQuery,
    deviceQuery,
    devicesQuery,
    SESSIONS_REFRESH_INTERVAL,
    serverUserQuery,
    serverUsersQuery,
} from "./admin/adminQueries";
export { formatDateTime, formatLastSeen } from "./admin/lastSeen";
export {
    compareSessions,
    dashboardSessions,
    filterSessions,
    humanizeEnumValue,
    isSessionPlaying,
    playMethodTitle,
    type SessionFilter,
    type SessionProgress,
    sessionProgress,
} from "./admin/sessions";

// Search
export {
    groupSearchItems,
    RECENT_SEARCH_LIMIT,
    type RecentSearchItems,
    type SearchItemGroups,
    useRecentSearchItems,
    withRecentItem,
} from "./query/recentSearchItems";
