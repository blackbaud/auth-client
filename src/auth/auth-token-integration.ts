//#region imports

import {
  BBCsrfXhr
} from '../shared/csrf-xhr';

import {
  BBAuthCrossDomainIframe
} from './auth-cross-domain-iframe';

//#endregion

export class BBAuthTokenIntegration {
  public static getToken(
    disableRedirect?: boolean,
    envId?: string,
    permissionScope?: string,
    leId?: string
  ): Promise<any> {
    if (!this.hostNameEndsWith('blackbaud.com')) {
      return BBAuthCrossDomainIframe.getToken({
        envId,
        permissionScope,
        leId,
        disableRedirect: true
      });
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

  public static hostNameEndsWith(domain: string) {
    return this.getLocationHostname().substr(-domain.length) === domain;
  }

  // wrapper for window.location.hostName so it can be tested.
  public static getLocationHostname() {
    return window.location.hostname;
  }
}
