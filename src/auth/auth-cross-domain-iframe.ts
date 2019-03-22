//#region imports

import {
  BBAuthDomUtility
} from '../shared/dom-utility';

import { BBAuthTokenErrorCode } from '../../dist';
import { BBAuthNavigator } from '../shared/navigator';
import { BBAuthGetTokenArgs } from './auth-get-token-args';
import { BBAuthTokenError } from './auth-token-error';
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
          }, '*'); // set this * to something else
        } else if (msg.data.messageType === 'error') {
          const reason: BBAuthTokenError = msg.data.value;
          if (reason.code === BBAuthTokenErrorCode.Offline) {
            reject(reason);
          } else if (reason.code === BBAuthTokenErrorCode.NotLoggedIn) {
            BBAuthNavigator.redirectToSignin(undefined);
          } else {
            BBAuthNavigator.redirectToError(reason.code);
          }
        } else if (msg.data.messageType === 'getToken') {
          const tokenResponse: BBAuthTokenResponse = {
            access_token: msg.data['value'],
            expires_in: 0
          };
          // this is required to prevent subsequent calls of getTOkenFromIFrame to not make extra calls to the IFrame
          window.removeEventListener('message', handleMessageFromIframe);
          resolve(tokenResponse);
        }
      });
      this.sendInitialMessage(iframeEl);
    });
  }

  private static sendInitialMessage(iframeEl: HTMLIFrameElement) {
    let readyMessageSent = false;
    iframeEl.onload = (() => {
      if (!readyMessageSent) {
        iframeEl.contentWindow.postMessage({messageType: 'ready', source: SOURCE}, '*');
        readyMessageSent = true;
      }
    });
    if (!readyMessageSent) {
      iframeEl.contentWindow.postMessage({messageType: 'ready', source: SOURCE}, '*');
      readyMessageSent = true;
    }

  }
}
