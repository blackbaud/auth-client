import { BBCsrfXhr } from '../shared/csrf-xhr';

export class BBAuthTokenIntegration {
  public static getToken(disableRedirect?: boolean, envId?: string, permissionScope?: string) {
    return BBCsrfXhr.request(
      'https://s21aidntoken00blkbapp01.nxt.blackbaud.com/oauth2/token',
      undefined,
      disableRedirect,
      envId,
      permissionScope
    );
  }
}
