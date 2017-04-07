import { BBAuthTokenIntegration } from './auth-token-integration';

export class BBAuth {
  private static lastToken: string;
  private static expirationTime: number;

  public static getToken(): Promise<string> {
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
    } else {
      return tokenInteraction.getToken().then((tokenResponse: any) => {
        BBAuth.expirationTime = new Date().valueOf() + tokenResponse['expires_in'] * 1000;
        BBAuth.lastToken = tokenResponse['access_token'];
        return BBAuth.lastToken;
      });
    }
  }
}
