import { BBAuthInterop } from '../shared/interop';

import { BBCsrfXhr } from '../shared/csrf-xhr';

import { BBAuthUserActivity } from './auth-user-activity';

export class BBAuthTokenIntegration {
  public static getToken() {
    return BBCsrfXhr.request('https://s21aidntoken00blkbapp01.nxt.blackbaud.com/oauth2/token');
  }
}
