//#region imports

import {
  BBAuthDomUtility
} from '../shared/dom-utility';

//#endregion

const URL = 'https://s21aidntoken00blkbapp01.nxt.blackbaud.com/Iframes/RenewSessionFrame.html'; // URL to get IFrame
const HOST = 'security-token-svc';
const SOURCE = 'auth-client';

export class BBAuthRenewSessionIframe {

  public static iframeEl: HTMLIFrameElement;
  public static listenerSetup = false;
  public static iframeReadyResolve: any;
  public static iframeReadyPromise = new Promise<boolean>((resolve) =>
  BBAuthRenewSessionIframe.iframeReadyResolve = resolve
  );

  private static TARGETORIGIN = 'https://s21aidntoken00blkbapp01.nxt.blackbaud.com';

  public static reset() {
    this.iframeReadyPromise = new Promise<boolean>((resolve) =>
      this.iframeReadyResolve = resolve
    );
    this.listenerSetup = false;
  }

  public static TARGET_ORIGIN() {
    return this.TARGETORIGIN;
  }

  public static getOrMakeIframe(): HTMLIFrameElement {
    BBAuthRenewSessionIframe.iframeEl = document.getElementById('auth-renew-session-iframe') as HTMLIFrameElement;

    // if iframe doesn't exist, make it
    if (!BBAuthRenewSessionIframe.iframeEl) {
      BBAuthRenewSessionIframe.iframeEl = BBAuthDomUtility.addIframe(
        URL,
        'auth-renew-session-iframe',
        ''
      );

      BBAuthRenewSessionIframe.iframeEl.id = 'auth-renew-session-iframe';
      BBAuthRenewSessionIframe.iframeEl.hidden = true;
    }

    return BBAuthRenewSessionIframe.iframeEl;
  }

  public static renewSession(): Promise<any> {
    this.setupListenersForIframe();

    return this.renewSessionFromIframe(
      this.getOrMakeIframe()
    );
  }

  public static setupListenersForIframe() {
    if (this.listenerSetup) {
      return;
    }

    window.addEventListener('message', (event: MessageEvent) => {
      const message = event.data;

      if (message.source !== HOST && message.origin !== this.TARGET_ORIGIN()) {
        return;
      }
      if (message.messageType === 'ready') {
        this.iframeReadyResolve(true);
      }
    });

    this.listenerSetup = true;
  }

  public static renewSessionFromIframe(
    iframeEl: HTMLIFrameElement
  ): Promise<any> {
    return new Promise<any>((resolve, reject) => {
      BBAuthRenewSessionIframe.iframeReadyPromise.then(() => {
        iframeEl.contentWindow.postMessage({
          messageType: 'renew',
          source: SOURCE
        },
        BBAuthRenewSessionIframe.TARGET_ORIGIN());
      });
    });
  }
}
