import { BBAuthTokenIntegration } from './auth-token-integration';

import { BBAuthGetTokenArgs } from './auth-get-token-args';

function buildCacheKey(args: BBAuthGetTokenArgs) {
  const { envId, permissionScope } = args;

  return 'token|' + (envId || '-') + '|' + (permissionScope || '-');
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
    argsOrForceNewToken?: boolean | BBAuthGetTokenArgs,
    disableRedirect?: boolean
  ): Promise<string> {
    let args: BBAuthGetTokenArgs;

    switch (typeof argsOrForceNewToken) {
      case 'undefined':
        args = {};
        break;
      case 'boolean':
        args = {
          disableRedirect,
          forceNewToken: argsOrForceNewToken as boolean
        };
        break;
      default:
        args = argsOrForceNewToken as BBAuthGetTokenArgs;
    }

    return BBAuth.getTokenInternal(args);
  }

  public static clearTokenCache() {
    BBAuth.tokenCache = {};
  }

  private static getTokenInternal(args: BBAuthGetTokenArgs): Promise<string> {
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
        args.permissionScope
      )
        .then((tokenResponse: any) => {
          cachedItem.expirationTime = new Date().valueOf() + tokenResponse['expires_in'] * 1000;
          cachedItem.lastToken = tokenResponse['access_token'];
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
