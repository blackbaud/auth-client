//#region imports

import {
  BBAuthDomUtility
} from '../shared/dom-utility';

import {
  BBAuthNavigator
} from '../shared/navigator';

import {
  BBAuthGetTokenArgs
} from './auth-get-token-args';

import {
  BBAuthTokenError
} from './auth-token-error';

import {
  BBAuthTokenErrorCode
} from './auth-token-error-code';

import {
  BBAuthTokenResponse
} from './auth-token-response';

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
    return new Promise<BBAuthTokenResponse>((resolve, reject) => {
      function handleMessageFromIframe(event: MessageEvent) {
        const message = event.data;

        if (message.source !== HOST) {
          return;
        }

        switch (message.messageType) {
          case 'ready':
            iframeEl.contentWindow.postMessage(
              {
                messageType: 'getToken',
                source: SOURCE,
                value: args
              },
              '*'
            );

            break;
          case 'error':
            BBAuthCrossDomainIframe.handleErrorMessage(message.value, reject);
            window.removeEventListener('message', handleMessageFromIframe);

            break;
          case 'getToken':
            const tokenResponse: BBAuthTokenResponse = {
              access_token: message.value,
              expires_in: 0
            };

            // this is required to prevent subsequent calls of getTokenFromIFrame to not make extra calls to the IFrame
            window.removeEventListener('message', handleMessageFromIframe);
            resolve(tokenResponse);

            break;
        }
      }

      function postReadyMessage() {
        iframeEl.contentWindow.postMessage(
          {
            messageType: 'ready',
            source: SOURCE
          },
          '*'
        );
      }

      window.addEventListener('message', handleMessageFromIframe);

      // when the iframe has been loaded, start the request
      iframeEl.onload = postReadyMessage;

      // makes sure if we load the iframe before this is setup, it will call ready
      postReadyMessage();
    });
  }

  public static handleErrorMessage(reason: BBAuthTokenError, reject: any) {
    switch (reason.code) {
      case BBAuthTokenErrorCode.Offline:
        reject(reason);
        break;
      case BBAuthTokenErrorCode.NotLoggedIn:
        BBAuthNavigator.redirectToSignin(undefined);
        break;
      default:
        BBAuthNavigator.redirectToError(reason.code);
    }
  }
}
