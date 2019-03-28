//#region imports

import {
  BBAuthDomUtility
} from '../shared/dom-utility';

import {
  BBAuthNavigator
} from '../shared/navigator';

import {
  BBAuthCrossDomainIframe
} from './auth-cross-domain-iframe';

import {
  BBAuthTokenError
} from './auth-token-error';

import {
  BBAuthTokenErrorCode
} from './auth-token-error-code';

//#endregion

describe('Auth Cross Domain Iframe', () => {
  // URL to get IFrame
  const URL = 'https://s21aidntoken00blkbapp01.nxt.blackbaud.com/Iframes/CrossDomainAuthFrame.html';

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
        case 'ready':
          window.postMessage(
            {
              messageType: 'ready',
              source: SOURCE
            },
            '*'
          );

          break;
        case 'getToken':
          if (error) {
            window.postMessage(
              {
                messageType: 'error',
                source: SOURCE,
                value: {
                  code: 4,
                  message: 'it broke'
                }
              },
              '*'
            );
          } else {
            expect(message.value.disableRedirect).toBe(true);

            getTokenCalls += 1;

            window.postMessage(
              {
                messageType: 'getToken',
                source: SOURCE,
                value: 'accessToken!'
              },
              '*'
            );
          }

          break;
      }
    });
  }

  beforeEach(() => {
    fakeIframe = document.createElement('iframe');
    getTokenCalls = 0;
  });

  describe('getToken', () => {
    it('gets or creates an iframe then returns the token promise', () => {
      const getOrMakeFrameSpy = spyOn(BBAuthCrossDomainIframe, 'getOrMakeIframe').and.returnValue(fakeIframe);
      const getTokenFromIframeSpy = spyOn(BBAuthCrossDomainIframe, 'getTokenFromIframe');

      BBAuthCrossDomainIframe.getToken({disableRedirect: true});

      expect(getOrMakeFrameSpy).toHaveBeenCalled();

      expect(getTokenFromIframeSpy).toHaveBeenCalledWith(
        fakeIframe,
        {
          disableRedirect: true
        }
      );
    });
  });

  describe('getOrMakeIframe', () => {
    it('creates a new frame if none exist', () => {
      const getElementSpy = spyOn(document, 'getElementById').and.callThrough();
      const requestSpy = spyOn(BBAuthDomUtility, 'addIframe').and.returnValue(fakeIframe);

      BBAuthCrossDomainIframe.getOrMakeIframe();

      expect(getElementSpy).toHaveBeenCalledWith('auth-cross-domain-iframe');
      expect(requestSpy).toHaveBeenCalledWith(URL, 'auth-cross-domain-iframe', '');
      expect(fakeIframe.id).toBe('auth-cross-domain-iframe');
      expect(fakeIframe.hidden).toBe(true);
    });

    it('uses an existing frame if one exists', () => {
      const getElementSpy = spyOn(document, 'getElementById').and.returnValue(fakeIframe);
      const requestSpy = spyOn(BBAuthDomUtility, 'addIframe');

      BBAuthCrossDomainIframe.getOrMakeIframe();

      expect(getElementSpy).toHaveBeenCalledWith('auth-cross-domain-iframe');
      expect(requestSpy).not.toHaveBeenCalled();
    });
  });

  describe('getTokenFromIframe', () => {
    it('communicates with the iframe via "ready" and "getToken" and kicks off "ready"', (done) => {
      fakeIframe = BBAuthDomUtility.addIframe('', 'auth-cross-domain-iframe', '');

      iframeMock(fakeIframe);

      BBAuthCrossDomainIframe.getTokenFromIframe(
        fakeIframe,
        {
          disableRedirect: true
        }
      )
        .then((tokenResonse) => {
          expect(tokenResonse.access_token).toEqual('accessToken!');
          expect(tokenResonse.expires_in).toEqual(0);
          done();
        });
    });

    it('handles errors', (done) => {
      fakeIframe = BBAuthDomUtility.addIframe('', 'auth-cross-domain-iframe', '');
      const errorSpy = spyOn(BBAuthCrossDomainIframe, 'handleErrorMessage').and.callThrough();

      iframeMock(fakeIframe, true);

      BBAuthCrossDomainIframe.getTokenFromIframe(
        fakeIframe,
        {
          disableRedirect: true
        }
      )
        .catch(() => {
          expect(errorSpy).toHaveBeenCalled();
          done();
        });
    });

    it('only calls the iframe once if the getToken is called', (done) => {
      fakeIframe = BBAuthDomUtility.addIframe('', 'auth-cross-domain-iframe', '');

      iframeMock(fakeIframe);

      BBAuthCrossDomainIframe.getTokenFromIframe(
        fakeIframe,
        {
          disableRedirect: true
        }
      )
        .then(() => {
          BBAuthCrossDomainIframe.getTokenFromIframe(
            fakeIframe,
            {
              disableRedirect: true
            }
          )
            .then(() => {
              expect(getTokenCalls).toEqual(2);
              done();
            });
        });
    });
  });

  describe('handleErrorMessage', () => {
    let rej: any;
    let reason: BBAuthTokenError;

    beforeEach(() => {
      rej = jasmine.createSpy('rej');

      reason = {
        code: BBAuthTokenErrorCode.Offline,
        message: 'it broke'
      };

    });

    it('handles the code for offline', () => {
      const obj = {
        rej
      };

      BBAuthCrossDomainIframe.handleErrorMessage(reason, obj.rej);

      expect(rej).toHaveBeenCalledWith(reason);
    });

    it('handles not logged in', () => {
      const navSpy = spyOn(BBAuthNavigator, 'redirectToSignin');
      reason.code = BBAuthTokenErrorCode.NotLoggedIn;

      BBAuthCrossDomainIframe.handleErrorMessage(reason, rej);

      expect(navSpy).toHaveBeenCalledWith(undefined);
    });

    it('handles other codes', () => {
      const navSpy = spyOn(BBAuthNavigator, 'redirectToError');
      reason.code = BBAuthTokenErrorCode.InvalidEnvironment;

      BBAuthCrossDomainIframe.handleErrorMessage(reason, rej);

      expect(navSpy).toHaveBeenCalledWith(reason.code);
    });
  });

});
