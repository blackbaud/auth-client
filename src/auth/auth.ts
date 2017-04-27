import { BBAuthTokenIntegration } from './auth-token-integration';

export class BBAuth {
  public static mock = false;

  private static lastToken: string;
  private static expirationTime: number;
  private static pendingLookupPromise: Promise<string>;

  public static getToken(): Promise<string> {
    if (BBAuth.mock) {
      return Promise.resolve('mock_access_token_auth-client@blackbaud.com');
    }

    const tokenInteraction = new BBAuthTokenIntegration(
      'https://signin.blackbaud.com/api/v2/csrf',
      'https://signin.blackbaud.com/api/v2/oauth/token',
      'https://signin.blackbaud.com'
    );

    const now = new Date().valueOf();

    if (
      BBAuth.lastToken &&
      BBAuth.expirationTime &&
      (BBAuth.expirationTime - now > 60 * 1000) /* Refresh if within 1 minute of expiration */
    ) {
      // Return the stored token.
      return new Promise<string>((resolve: any, reject: any) => {
        resolve(BBAuth.lastToken);
      });
    }

    if (!BBAuth.pendingLookupPromise) {
      BBAuth.pendingLookupPromise = tokenInteraction.getToken().then((tokenResponse: any) => {
          BBAuth.expirationTime = new Date().valueOf() + tokenResponse['expires_in'] * 1000;
          BBAuth.lastToken = tokenResponse['access_token'];
          BBAuth.pendingLookupPromise = null;
          return BBAuth.lastToken;
        }).catch((reason) => {
          BBAuth.pendingLookupPromise = null;
          throw reason;
        });
    }

    return BBAuth.pendingLookupPromise;
  }
}
