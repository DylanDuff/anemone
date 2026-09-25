//
// AnemoneReact is subject to the terms of the Mozilla Public
// License, v2.0. Ported from Swiftfin (c) Jellyfin & Jellyfin Contributors.
//

import type { UserDto } from "@jellyfin/sdk/lib/generated-client/models/user-dto";
import { ErrorMessage } from "../errors/errorMessage";
import { getAuthenticationApi } from "../jellyfin/api";
import type { Api } from "../jellyfin/client";

/** The result of a successful sign-in: an access token and the authenticated user. */
export interface AuthenticationResult {
    readonly accessToken: string;
    readonly user: UserDto;
    readonly userID: string;
    readonly username: string;
}

function requireResult(
    accessToken: string | null | undefined,
    user: UserDto | null | undefined,
): AuthenticationResult {
    const id = user?.Id;
    const username = user?.Name;
    if (!accessToken || !user || !id || !username) {
        throw new ErrorMessage("Missing user data from network call");
    }
    return { accessToken, user, userID: id, username };
}

/** Sign in with a username and password (Swiftfin `client.signIn(username:password:)`). */
export async function signIn(
    api: Api,
    username: string,
    password: string,
): Promise<AuthenticationResult> {
    const trimmedUsername = username.trim();
    const trimmedPassword = password.trim();

    const response = await getAuthenticationApi(api).authenticateUserByName({
        authenticateUserByName: { Username: trimmedUsername, Pw: trimmedPassword },
    });

    return requireResult(response.data.AccessToken, response.data.User);
}

/** Complete a Quick Connect sign-in with an approved secret. */
export async function signInWithQuickConnect(
    api: Api,
    secret: string,
): Promise<AuthenticationResult> {
    const response = await getAuthenticationApi(api).authenticateWithQuickConnect({
        quickConnectDto: { Secret: secret },
    });

    return requireResult(response.data.AccessToken, response.data.User);
}
