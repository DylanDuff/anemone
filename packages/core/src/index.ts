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
    formatHoursMinutes,
    secondsToTicks,
    TICKS_PER_SECOND,
    ticksToSeconds,
} from "./jellyfin/ticks";
export {
    displayTitle,
    episodeLocator,
    isLiveStream,
    isMissing,
    isPlayable,
    isPlayed,
    isUnaired,
    playbackPositionTicks,
    playedFraction,
    premiereYear,
    progressLabel,
    runtimeLabel,
    runtimeSeconds,
    seasonEpisodeLabel,
} from "./jellyfin/itemHelpers";
export {
    blurHashString,
    ImageType,
    type ImageRequestOptions,
    type ImageSource,
    itemImageSource,
    itemImageURLById,
    resumeFrameSource,
    seriesImageSource,
    userImageURL,
} from "./jellyfin/images";
export { setItemPlayed } from "./jellyfin/playstate";

// Query layer (data-fetching view models)
export { type QueryContext, queryContextFromSession } from "./query/queryContext";
export { libraryParentRequest } from "./query/libraryParent";
export { jellyfinKeys } from "./query/queryKeys";
export {
    DEFAULT_PAGE_SIZE,
    episodesQuery,
    genresQuery,
    type ItemsRequest,
    itemQuery,
    latestInLibraryQuery,
    libraryItemsInfiniteQuery,
    nextUpQuery,
    resumeItemsQuery,
    seasonsQuery,
    searchItemsQuery,
    userViewsQuery,
} from "./query/queries";
export {
    useEpisodes,
    useGenres,
    useItem,
    useLatestInLibrary,
    useLibraryItems,
    useNextUp,
    useResumeItems,
    useSearch,
    useSeasons,
    useSetItemPlayed,
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
