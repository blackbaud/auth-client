//#region imports

import {
  BBAuthDomUtility
} from '../shared/dom-utility';

import { BBAuthNavigator } from '../shared/navigator';
import { BBAuthGetTokenArgs } from './auth-get-token-args';
import { BBAuthTokenError } from './auth-token-error';
import { BBAuthTokenErrorCode } from './auth-token-error-code';
import { BBAuthTokenResponse } from './bbauth-token-response';

//#endregion
const URL = 'https://s21aidntoken00blkbapp01.nxt.blackbaud.com/Iframes/CrossDomainAuthFrame.html'; // URL to get IFrame
const HOST = 'security-token-svc';
const SOURCE = 'auth-client';

export class BBAuthCrossDomainIframe {

  public static getToken(args: BBAuthGetTokenArgs): Promise<BBAuthTokenResponse> {
    return this.getTokenFromIframe(
      this.getOrMakeIframe(),
      args
    );
  }

  public static getOrMakeIframe(): HTMLIFrameElement {
    let iframeEl = document.getElementById('auth-cross-domain-iframe') as HTMLIFrameElement;
    // if iframe doesn't exist, make it
    if (!iframeEl) {
      iframeEl = BBAuthDomUtility.addIframe(
        URL,
        'auth-cross-domain-iframe',
        ''
      );
      iframeEl.id = 'auth-cross-domain-iframe';
      iframeEl.hidden = true;
    }
    return iframeEl;
  }

  public static getTokenFromIframe(
    iframeEl: HTMLIFrameElement,
    args: BBAuthGetTokenArgs
  ): Promise<BBAuthTokenResponse> {
    return new Promise<BBAuthTokenResponse>((resolve: any, reject: any) => {
      window.addEventListener('message', function handleMessageFromIframe(msg: any) {
        if (msg.data.source !== HOST) { return; }
        if (msg.data.messageType === 'ready') {
          iframeEl.contentWindow.postMessage({
            messageType: 'getToken',
            source: SOURCE,
            value: args
          }, '*');
        } else if (msg.data.messageType === 'error') {
          BBAuthCrossDomainIframe.handleErrorMessage(msg.data.value, reject);
          window.removeEventListener('message', handleMessageFromIframe);
          reject();
        } else if (msg.data.messageType === 'getToken') {
          const tokenResponse: BBAuthTokenResponse = {
            access_token: msg.data['value'],
            expires_in: 0
          };
          // this is required to prevent subsequent calls of getTokenFromIFrame to not make extra calls to the IFrame
          window.removeEventListener('message', handleMessageFromIframe);
          resolve(tokenResponse);
        }
      });
      iframeEl.onload = (() => iframeEl.contentWindow.postMessage({messageType: 'ready', source: SOURCE}, '*'));
      iframeEl.contentWindow.postMessage({messageType: 'ready', source: SOURCE}, '*');
    });
  }

  public static handleErrorMessage(reason: BBAuthTokenError, reject: any) {
    if (reason.code === BBAuthTokenErrorCode.Offline) {
      reject(reason);
    } else if (reason.code === BBAuthTokenErrorCode.NotLoggedIn) {
      BBAuthNavigator.redirectToSignin(undefined);
    } else {
      BBAuthNavigator.redirectToError(reason.code);
    }
  }
}
