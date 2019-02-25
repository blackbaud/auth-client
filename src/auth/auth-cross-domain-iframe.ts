//#region imports

import {
  BBAuthDomUtility
} from '../shared/dom-utility';
import { TokenResponse } from './token-response';

//#endregion

function bindEvent(element: any, eventName: string, eventHandler: any) {
  if (element.addEventListener) {
      element.addEventListener(eventName, eventHandler, false);
  } else if (element.attachEvent) {
      element.attachEvent('on' + eventName, eventHandler);
  }
}

// URL to get iframe
const URL = '';

export class BBAuthCrossDomainIframe {

  public static GetToken(): Promise<TokenResponse> {
    let iframeEl: HTMLIFrameElement;
    iframeEl = this.getOrMakeIframe();
    return this.getTokenFromIFrame(iframeEl);
  }

  public static getOrMakeIframe(): HTMLIFrameElement {
    let iframeEl = document.getElementById('auth-cross-domain-iframe') as HTMLIFrameElement;
    // if iframe doesn't exist, make it
    if (iframeEl === undefined || iframeEl === null) {
      iframeEl = BBAuthDomUtility.addIframe(
        URL,
        'auth-cross-domain-iframe',
        ''
      );
    }
    return iframeEl;
  }

  public static getTokenFromIFrame(iframeEl: HTMLIFrameElement): Promise<TokenResponse> {
    return new Promise<TokenResponse>((resolve) => {
      bindEvent(window, 'message', function handleMessageFromIFrame(msg: any) {
        if (msg.data === 'ready') {
          iframeEl.contentWindow.postMessage({methodName: 'getToken'}, '*'); // set this * to something else
        } else {
          const tokenResponse: TokenResponse = {
            access_token: msg.data,
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
