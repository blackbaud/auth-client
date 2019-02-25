import { BBCsrfXhr } from '../shared/csrf-xhr';
import { BBAuthCrossDomainIframe } from './auth-cross-domain-iframe';

export class BBAuthTokenIntegration {
  public static getToken(
    disableRedirect?: boolean,
    envId?: string,
    permissionScope?: string,
    leId?: string
  ) {
    if (!this.getLocationHostname().endsWith('blackbaud.com')) {
      return BBAuthCrossDomainIframe.GetToken();
    }
    return BBCsrfXhr.request(
      'https://s21aidntoken00blkbapp01.nxt.blackbaud.com/oauth2/token',
      undefined,
      disableRedirect,
      envId,
      permissionScope,
      leId,
      true
    );
  }

  // wrapper for window.location.hostName so it can be tested.
  public static getLocationHostname() {
    return window.location.hostname;
  }
}
