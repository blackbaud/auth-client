//#region imports

import {
  BBAuthDomUtility
} from '../shared/dom-utility';

import { BBAuthTokenResponse } from './bbauth-token-response';

//#endregion
const URL = ''; // URL to get IFrame

export class BBAuthCrossDomainIframe {

  public static getToken(): Promise<BBAuthTokenResponse> {
    let iframeEl: HTMLIFrameElement;
    iframeEl = this.getOrMakeIframe();
    return this.getTokenFromIframe(iframeEl);
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

  public static getTokenFromIframe(iframeEl: HTMLIFrameElement): Promise<BBAuthTokenResponse> {
    return new Promise<BBAuthTokenResponse>((resolve) => {
      window.addEventListener('message', function handleMessageFromIFrame(msg: any) {
        if (msg.data.methodName === 'ready') {
          iframeEl.contentWindow.postMessage({methodName: 'getToken'}, '*'); // set this * to something else
        } else if (msg.data.methodName === 'getToken') {
          const tokenResponse: BBAuthTokenResponse = {
            access_token: msg.data['value'],
            expires_in: 0
          };
          // this is required to prevent subsequent calls of getTOkenFromIFrame to not make extra calls to the IFrame
          window.removeEventListener('message', handleMessageFromIFrame);
          resolve(tokenResponse);
        }
      });
      iframeEl.contentWindow.postMessage({methodName: 'ready'}, '*');
    });
  }
}
