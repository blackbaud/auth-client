//#region imports

import {
  BBCsrfXhr
} from '../shared/csrf-xhr';

import {
  BBAuthCrossDomainIframe
} from './auth-cross-domain-iframe';

import { BBAuthGetDomain } from './auth-get-domain';

//#endregion

export class BBAuthTokenIntegration {
  public static getToken(
    disableRedirect?: boolean,
    envId?: string,
    permissionScope?: string,
    leId?: string
  ): Promise<any> {
    if (BBAuthGetDomain.isRegisteredDomain()) {
      return BBCsrfXhr.request(
        BBAuthGetDomain.getSTSDomain() + '/oauth2/token',
        undefined,
        disableRedirect,
        envId,
        permissionScope,
        leId,
        true
      );
    }
    if (!this.hostNameEndsWith('blackbaud.com')) {
      return BBAuthCrossDomainIframe.getToken({
        disableRedirect,
        envId,
        leId,
        permissionScope
      });
    }
    return BBCsrfXhr.request(
      BBAuthGetDomain.getSTSDomain() + '/oauth2/token',
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
