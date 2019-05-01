//#region imports

import {
  BBAuthTokenIntegration
} from './auth-token-integration';

import {
  BBAuthGetTokenArgs
} from './auth-get-token-args';

import {
  BBAuthTokenResponse
} from './auth-token-response';

//#endregion

function buildCacheKey(args: BBAuthGetTokenArgs) {
  const { envId, permissionScope, leId } = args;

  return 'token|'
    + (leId || '-')
    + '|'
    + (envId || '-')
    + '|'
    + (permissionScope || '-');
}

export class BBAuth {
  public static mock = false;

  private static tokenCache: {
    [key: string]: {
      lastToken?: string,
      expirationTime?: number,
      pendingLookupPromise?: Promise<string>
    }
  } = {};

  public static getToken(
    args?: BBAuthGetTokenArgs
  ): Promise<string> {
    return BBAuth.getTokenInternal(args);
  }

  public static clearTokenCache() {
    BBAuth.tokenCache = {};
  }

  private static getTokenInternal(args: BBAuthGetTokenArgs): Promise<string> {
    args = args || {};

    const { forceNewToken, disableRedirect } = args;

    if (BBAuth.mock) {
      return Promise.resolve('mock_access_token_auth-client@blackbaud.com');
    }

    const cacheKey = buildCacheKey(args);

    const cachedItem =
      BBAuth.tokenCache[cacheKey] =
      (BBAuth.tokenCache[cacheKey] || {});

    const now = new Date().valueOf();

    if (
      !forceNewToken &&
      cachedItem.lastToken &&
      cachedItem.expirationTime &&
      (cachedItem.expirationTime - now > 60 * 1000) /* Refresh if within 1 minute of expiration */
    ) {
      // Return the stored token.
      return Promise.resolve(cachedItem.lastToken);
    }

    if (!cachedItem.pendingLookupPromise) {
      cachedItem.pendingLookupPromise = BBAuthTokenIntegration.getToken(
        disableRedirect,
        args.envId,
        args.permissionScope,
        args.leId
      )
        .then((tokenResponse: BBAuthTokenResponse) => {
          cachedItem.expirationTime = new Date().valueOf() + tokenResponse.expires_in * 1000;
          cachedItem.lastToken = tokenResponse.access_token;
          cachedItem.pendingLookupPromise = null;

          return cachedItem.lastToken;
        })
        .catch((reason) => {
          cachedItem.pendingLookupPromise = null;
          throw reason;
        });
    }

    return cachedItem.pendingLookupPromise;
  }
}
