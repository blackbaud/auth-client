//#region imports

import {
  BBAuthTokenIntegration
} from './auth-token-integration';

import {
  BBAuthGetTokenArgs
} from './auth-get-token-args';

import {
  BBAuthGetUrlArgs
} from './auth-get-url-args';

import {
  BBAuthTokenResponse
} from './auth-token-response';

//#endregion

const TOKENIZED_URL_REGEX = /1bb:\/\/([a-z]{3})-([a-z0-9]{5})(-[a-z]{4}[0-9]{2})?\/(.*)/;

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

  public static getUrl(
    tokenizedUrl: string,
    args?: BBAuthGetUrlArgs
  ): Promise<string> {
    // Returning a promise so eventually this could be enhanced
    // to use a service discovery solution instead of using a convention.
    const match = TOKENIZED_URL_REGEX.exec(tokenizedUrl);
    let result = tokenizedUrl;
    let zone = args ? args.zone : undefined;

    if (match) {
      if (match[3]) {
        zone = match[3].substring(1);
      }
      // https://eng-pusa01.app.blackbaud.net/hub00/version
      result = `https://${match[1]}-${zone}.app.blackbaud.net/${match[2]}/${match[4]}`;
    }
    return Promise.resolve(result);
  }

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
