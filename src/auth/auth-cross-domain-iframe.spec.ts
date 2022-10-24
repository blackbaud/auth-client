//#region imports

import { BBAuthDomUtility } from '../shared/dom-utility';

import { BBAuthNavigator } from '../shared/navigator';

import { BBAuthCrossDomainIframe } from './auth-cross-domain-iframe';

import { BBAuthTokenError } from './auth-token-error';

import { BBAuthTokenErrorCode } from './auth-token-error-code';

//#endregion

describe('Auth Cross Domain Iframe', () => {
  // URL to get IFrame
  const URL = 'https://sts.sky.blackbaud.com/Iframes/CrossDomainAuthFrame.html';

  let fakeIframe: HTMLIFrameElement;

  let getTokenCalls: number;

  function iframeMock(frame: HTMLIFrameElement, error = false) {
    // This mock should match the code at the URL
    const SOURCE = 'security-token-svc';

    frame.contentWindow.addEventListener('message', (event: MessageEvent) => {
      const HOST = 'auth-client';

      const message = event.data;

      if (message.source !== HOST) {
        return;
      }

      switch (message.messageType) {
        case 'getToken':
          if (error) {
            window.postMessage(
              {
                messageType: 'error',
                requestId: message.requestId,
                source: SOURCE,
                value: {
                  code: BBAuthTokenErrorCode.Offline,
                  message: 'it broke',
                },
              },
              '*'
            );
          } else {
            expect(message.value.disableRedirect).toBe(true);

            getTokenCalls += 1;

            window.postMessage(
              {
                messageType: 'getToken',
                requestId: message.requestId,
                source: SOURCE,
                value: 'accessToken!',
              },
              '*'
            );
          }

          break;
      }
    });
    window.postMessage(
      {
        messageType: 'ready',
        source: SOURCE,
      },
      '*'
    );
  }

  beforeEach(() => {
    fakeIframe = document.createElement('iframe');
    getTokenCalls = 0;
  });

  afterEach(() => {
    BBAuthCrossDomainIframe.reset();
  });

  describe('getToken', () => {
    it('gets or creates an iframe then returns the token promise', () => {
      const getOrMakeFrameSpy = spyOn(
        BBAuthCrossDomainIframe,
        'getOrMakeIframe'
      ).and.returnValue(fakeIframe);
      const getTokenFromIframeSpy = spyOn(
        BBAuthCrossDomainIframe,
        'getTokenFromIframe'
      );

      BBAuthCrossDomainIframe.getToken({ disableRedirect: true });

      expect(getOrMakeFrameSpy).toHaveBeenCalled();

      expect(getTokenFromIframeSpy).toHaveBeenCalledWith(fakeIframe, {
        disableRedirect: true,
      });
    });

    it('should only add a message event listener to window on the first getToken() call', () => {
      let messageListenerCalls = 0;

      spyOn(BBAuthCrossDomainIframe, 'getOrMakeIframe').and.returnValue(
        fakeIframe
      );
      spyOn(window, 'addEventListener').and.callFake((eventType: string) => {
        if (eventType === 'message') {
          messageListenerCalls++;
        }
      });

      spyOn(BBAuthCrossDomainIframe, 'getTokenFromIframe');

      BBAuthCrossDomainIframe.getToken({ disableRedirect: true });

      expect(messageListenerCalls).toBe(1);

      BBAuthCrossDomainIframe.getToken({ disableRedirect: true });

      expect(messageListenerCalls).toBe(1);
    });
  });

  describe('getOrMakeIframe', () => {
    it('creates a new frame if none exist', () => {
      const getElementSpy = spyOn(document, 'getElementById').and.callThrough();
      const requestSpy = spyOn(BBAuthDomUtility, 'addIframe').and.returnValue(
        fakeIframe
      );

      BBAuthCrossDomainIframe.getOrMakeIframe();

      expect(getElementSpy).toHaveBeenCalledWith('auth-cross-domain-iframe');
      expect(requestSpy).toHaveBeenCalledWith(
        URL,
        'auth-cross-domain-iframe',
        ''
      );
      expect(fakeIframe.id).toBe('auth-cross-domain-iframe');
      expect(fakeIframe.hidden).toBe(true);
    });

    it('uses an existing frame if one exists', () => {
      const getElementSpy = spyOn(document, 'getElementById').and.returnValue(
        fakeIframe
      );
      const requestSpy = spyOn(BBAuthDomUtility, 'addIframe');

      BBAuthCrossDomainIframe.getOrMakeIframe();

      expect(getElementSpy).toHaveBeenCalledWith('auth-cross-domain-iframe');
      expect(requestSpy).not.toHaveBeenCalled();
    });
  });

  describe('getTokenFromIframe', () => {
    beforeEach(() => {
      spyOn(BBAuthCrossDomainIframe, 'TARGET_ORIGIN').and.returnValue('*');
    });

    it('communicates with the iframe via "ready" and "getToken" and kicks off "ready"', (done) => {
      fakeIframe = BBAuthDomUtility.addIframe(
        '',
        'auth-cross-domain-iframe',
        ''
      );

      iframeMock(fakeIframe);

      BBAuthCrossDomainIframe.getTokenFromIframe(fakeIframe, {
        disableRedirect: true,
      }).then((tokenResonse) => {
        expect(tokenResonse.access_token).toEqual('accessToken!');
        expect(tokenResonse.expires_in).toEqual(0);
        done();
      });
    });

    it('handles errors', (done) => {
      fakeIframe = BBAuthDomUtility.addIframe(
        '',
        'auth-cross-domain-iframe',
        ''
      );

      iframeMock(fakeIframe, true);

      BBAuthCrossDomainIframe.getTokenFromIframe(fakeIframe, {
        disableRedirect: true,
      }).catch(done); // if this is caught, it must have thrown the reject
    });

    it('only calls the iframe once if the getToken is called', (done) => {
      fakeIframe = BBAuthDomUtility.addIframe(
        '',
        'auth-cross-domain-iframe',
        ''
      );

      iframeMock(fakeIframe);

      BBAuthCrossDomainIframe.getTokenFromIframe(fakeIframe, {
        disableRedirect: true,
      }).then(() => {
        BBAuthCrossDomainIframe.getTokenFromIframe(fakeIframe, {
          disableRedirect: true,
        }).then(() => {
          expect(getTokenCalls).toEqual(2);
          done();
        });
      });
    });
  });

  describe('handleErrorMessage', () => {
    let rej: (_: unknown) => void;
    let reason: BBAuthTokenError;

    beforeEach(() => {
      rej = jasmine.createSpy('rej');

      reason = {
        code: BBAuthTokenErrorCode.Offline,
        message: 'it broke',
      };
    });

    it('handles the code for offline', () => {
      const obj = {
        rej,
      };

      BBAuthCrossDomainIframe.handleErrorMessage(reason, obj.rej, false);

      expect(rej).toHaveBeenCalledWith(reason);
    });

    it('handles not logged in', () => {
      const navSpy = spyOn(BBAuthNavigator, 'redirectToSignin');
      reason.code = BBAuthTokenErrorCode.NotLoggedIn;

      BBAuthCrossDomainIframe.handleErrorMessage(reason, rej, false);

      expect(navSpy).toHaveBeenCalledWith(undefined);
    });

    it('handles other codes', () => {
      const navSpy = spyOn(BBAuthNavigator, 'redirectToError');
      reason.code = BBAuthTokenErrorCode.InvalidEnvironment;

      BBAuthCrossDomainIframe.handleErrorMessage(reason, rej, false);

      expect(navSpy).toHaveBeenCalledWith(reason.code);
    });

    it('rejects if redirect is disabled', () => {
      const obj = {
        rej,
      };
      reason.code = BBAuthTokenErrorCode.NotLoggedIn;

      BBAuthCrossDomainIframe.handleErrorMessage(reason, obj.rej, true);

      expect(rej).toHaveBeenCalledWith(reason);
    });

    it('redirects if redirect is undefined', () => {
      const navSpy = spyOn(BBAuthNavigator, 'redirectToSignin');
      reason.code = BBAuthTokenErrorCode.NotLoggedIn;

      BBAuthCrossDomainIframe.handleErrorMessage(reason, rej, undefined);

      expect(navSpy).toHaveBeenCalledWith(undefined);
    });
  });
});
