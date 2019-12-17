//#region imports

import {
  BBAuthDomUtility
} from '../shared/dom-utility';

import {
  BBAuthRenewSessionIframe
} from './auth-renew-session-iframe';

//#endregion

describe('Auth Renew Session Iframe', () => {
  // URL to get IFrame
  const URL = 'https://s21aidntoken00blkbapp01.nxt.blackbaud.com/Iframes/RenewSessionFrame.html';

  let fakeIframe: HTMLIFrameElement;

  function iframeMock(frame: HTMLIFrameElement, error = false) {
    // This mock should match the code at the URL
    const SOURCE = 'security-token-svc';

    frame.contentWindow.addEventListener('message', (event: MessageEvent) => {
      const HOST = 'auth-client';

      const message = event.data;

      if (message.source !== HOST) {
        return;
      }
      if (message.messageType === 'renew') {
        /* todo ac - how do we represent the ajax calls to relying party, csrf, and session renew? */
      }
    });
    window.postMessage(
      {
        messageType: 'ready',
        source: SOURCE
      },
      '*'
    );
  }

  beforeEach(() => {
    fakeIframe = document.createElement('iframe');
  });

  afterEach(() => {
    BBAuthRenewSessionIframe.reset();
  });

  describe('renewSession', () => {
    it('gets or creates an iframe', () => {
      const getOrMakeFrameSpy = spyOn(BBAuthRenewSessionIframe, 'getOrMakeIframe').and.returnValue(fakeIframe);
      const renewSessionFromIframeSpy = spyOn(BBAuthRenewSessionIframe, 'renewSessionFromIframe');

      BBAuthRenewSessionIframe.renewSession();

      expect(getOrMakeFrameSpy).toHaveBeenCalled();
      expect(renewSessionFromIframeSpy).toHaveBeenCalledWith(fakeIframe);
    });

    it('should only add a message event listener to window on the first getToken() call', () => {
      let messageListenerCalls = 0;

      spyOn(BBAuthRenewSessionIframe, 'getOrMakeIframe').and.returnValue(fakeIframe);
      spyOn(window, 'addEventListener').and.callFake((eventType: string) => {
        if (eventType === 'message') {
          messageListenerCalls++;
        }
      });

      spyOn(BBAuthRenewSessionIframe, 'renewSessionFromIframe');

      BBAuthRenewSessionIframe.renewSession();

      expect(messageListenerCalls).toBe(1);

      BBAuthRenewSessionIframe.renewSession();

      expect(messageListenerCalls).toBe(1);
    });
  });

  describe('getOrMakeIframe', () => {
    it('creates a new frame if none exist', () => {
      const getElementSpy = spyOn(document, 'getElementById').and.callThrough();
      const requestSpy = spyOn(BBAuthDomUtility, 'addIframe').and.returnValue(fakeIframe);

      BBAuthRenewSessionIframe.getOrMakeIframe();

      expect(getElementSpy).toHaveBeenCalledWith('auth-renew-session-iframe');
      expect(requestSpy).toHaveBeenCalledWith(URL, 'auth-renew-session-iframe', '');
      expect(fakeIframe.id).toBe('auth-renew-session-iframe');
      expect(fakeIframe.hidden).toBe(true);
    });

    it('uses an existing frame if one exists', () => {
      const getElementSpy = spyOn(document, 'getElementById').and.returnValue(fakeIframe);
      const requestSpy = spyOn(BBAuthDomUtility, 'addIframe');

      BBAuthRenewSessionIframe.getOrMakeIframe();

      expect(getElementSpy).toHaveBeenCalledWith('auth-renew-session-iframe');
      expect(requestSpy).not.toHaveBeenCalled();
    });
  });

  describe('renewSessionFromIframe', () => {

    beforeEach(() => {
      spyOn(BBAuthRenewSessionIframe, 'TARGET_ORIGIN').and.returnValue('*');
    });

    /* todo ac - how do we change this to just test the communication via 'ready' and 'renew'? */
    it('communicates with the iframe via "ready" and "getToken" and kicks off "ready"', (done) => {
      fakeIframe = BBAuthDomUtility.addIframe('', 'auth-cross-domain-iframe', '');

      iframeMock(fakeIframe);

      BBAuthRenewSessionIframe.renewSessionFromIframe(fakeIframe).then((tokenResonse) => {
          expect(tokenResonse.access_token).toEqual('accessToken!');
          expect(tokenResonse.expires_in).toEqual(0);
          done();
        });
    });
  });
});
