import { BBAuthDomUtility } from '../shared/dom-utility';
import { BBAuthNavigator } from '../shared/navigator';
import { BBAuthCrossDomainIframe } from './auth-cross-domain-iframe';
import { BBAuthTokenError } from './auth-token-error';
import { BBAuthTokenErrorCode } from './auth-token-error-code';

const URL = 'https://s21aidntoken00blkbapp01.nxt.blackbaud.com/Iframes/CrossDomainAuthFrame.html'; // URL to get IFrame
function IFrameMock(frame: HTMLIFrameElement, error: boolean = false) {
  // This mock should match the code at the URL
  const SOURCE = 'security-token-svc';
  const HOST = 'auth-client';
  frame.contentWindow.addEventListener('message', (msg: any) => {
    if (msg.data.source !== HOST) { return; }
    if (msg.data.messageType === 'ready') {
      window.postMessage({messageType: 'ready', source: SOURCE}, '*');
    } else if (msg.data.messageType === 'getToken') {
      if (error) {
        window.postMessage({
          messageType: 'error',
          source: SOURCE,
          value: {code: 4, message: 'it broke'}
        }, '*');
      } else {
        expect(msg.data.value.disableRedirect).toBe(true);
        getTokenCalls += 1;
        window.postMessage({
          messageType: 'getToken',
          source: SOURCE,
          value: 'accessToken!'
        }, '*');
      }
    }
  });
}

let getTokenCalls: number;

describe('Auth Cross Domain Iframe', () => {
  let fakeIframe: HTMLIFrameElement;

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
      expect(getTokenFromIframeSpy).toHaveBeenCalledWith(fakeIframe, {disableRedirect: true});
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
      IFrameMock(fakeIframe);

      BBAuthCrossDomainIframe.getTokenFromIframe(fakeIframe, {disableRedirect: true})
        .then((tokenResonse) => {
          expect(tokenResonse.access_token).toEqual('accessToken!');
          expect(tokenResonse.expires_in).toEqual(0);
          done();
        });
    });

    it('handles errors', (done) => {
      fakeIframe = BBAuthDomUtility.addIframe('', 'auth-cross-domain-iframe', '');
      const errorSpy = spyOn(BBAuthCrossDomainIframe, 'handleErrorMessage');
      IFrameMock(fakeIframe, true);

      BBAuthCrossDomainIframe.getTokenFromIframe(fakeIframe, {disableRedirect: true})
        .catch((response) => {
          expect(errorSpy).toHaveBeenCalled();
          done();
        });
    });

    it('only calls the iframe once if the getToken is called', (done) => {
      fakeIframe = BBAuthDomUtility.addIframe('', 'auth-cross-domain-iframe', '');
      IFrameMock(fakeIframe);

      BBAuthCrossDomainIframe.getTokenFromIframe(fakeIframe, {disableRedirect: true})
        .then((tokenResonse) => {
          BBAuthCrossDomainIframe.getTokenFromIframe(fakeIframe, {disableRedirect: true})
            .then((tr) => {
              expect(getTokenCalls).toEqual(2);
              done();
            }); // .catch((err) => { console.log(err); });
        });
    });
  });

  describe('handleErrorMessage', () => {
    let rej: any;
    let reason: BBAuthTokenError;

    beforeEach(() => {
      rej = (() => { return; });
      reason = {
        code: BBAuthTokenErrorCode.Offline,
        message: 'it broke'
      };

    });

    it('handles the code for offline', () => {
      const obj = {rej};
      const rejSpy = spyOn(obj, 'rej');

      BBAuthCrossDomainIframe.handleErrorMessage(reason, obj.rej);

      expect(rejSpy).toHaveBeenCalledWith(reason);
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
