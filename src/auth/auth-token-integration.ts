//#region imports

import {
  BBCsrfXhr
} from '../shared/csrf-xhr';

import {
  BBAuthCrossDomainIframe
} from './auth-cross-domain-iframe';

import { BBAuthGetDomain } from './auth-get-domain';

import {
  BBAuthTokenError,
  BBAuthTokenErrorCode
} from '../auth';

import { BBAuthNavigator } from '../shared/navigator';
import { BBAuthTokenResponse } from './auth-token-response';

//#endregion

export class BBAuthTokenIntegration {
  public static getToken(
    disableRedirect?: boolean,
    envId?: string,
    permissionScope?: string,
    leId?: string
  ): Promise<any> {
    if (BBAuthGetDomain.isRegisteredDomain()) {
      return this.getTokenForRegisteredDomain(disableRedirect, envId, permissionScope, leId);
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

  private static getTokenForRegisteredDomain(
    disableRedirect?: boolean,
    envId?: string,
    permissionScope?: string,
    leId?: string
  ): Promise<any> {
    return new Promise((resolve: any, reject: any) => {
      BBCsrfXhr.request(
        BBAuthGetDomain.getSTSDomain() + '/oauth2/token',
        undefined,
        true,
        envId,
        permissionScope,
        leId,
        true
      )
      .then(resolve)
      .catch((reason: BBAuthTokenError) => {
        // if there is no cookie on the registered domain then the token endpoint will return a 401
        // in this scenario try and get the token from blackbaud.com and, if a token is returned, use
        // that token to set the cookie on the registered domain and return the token
        if (reason.code === BBAuthTokenErrorCode.NotLoggedIn) {
          BBAuthCrossDomainIframe.getToken({
            disableRedirect,
            envId,
            leId,
            permissionScope
          })
          .then((tokenResponse: BBAuthTokenResponse) => {
            const body = {
              accessToken: tokenResponse.access_token,
              redirectUrl: window.location.href
            };
            this.setCookie(BBAuthGetDomain.getSTSDomain() + '/cookie', body)
            .then(resolve(tokenResponse))
            .catch(reject);
          })
          .catch(reject);
        } else if (disableRedirect || reason.code === BBAuthTokenErrorCode.Offline) {
          reject(reason);
        } else {
          BBAuthNavigator.redirectToError(reason.code);
        }
      });
    });
  }

  private static setCookie(url: string, body: any): Promise<any> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      xhr.onreadystatechange = () => {
        if (xhr.readyState === 4) {
          switch (xhr.status) {
            case 200:
              resolve(JSON.parse(xhr.responseText));
              break;
            default:
              reject();
              break;
          }
        }
      };

      xhr.open('POST', url, true);
      xhr.setRequestHeader('Accept', 'application/json');
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.send(JSON.stringify(body));
    });
  }
}
