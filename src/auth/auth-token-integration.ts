import { BBCsrfXhr } from '../shared/csrf-xhr';

export class BBAuthTokenIntegration {
  public static getToken() {
    return BBCsrfXhr.request('https://s21aidntoken00blkbapp01.nxt.blackbaud.com/oauth2/token');
  }
}
