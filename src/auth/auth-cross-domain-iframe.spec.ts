import { BBAuthDomUtility } from '../shared/dom-utility';
import { BBAuthCrossDomainIframe } from './auth-cross-domain-iframe';

function IFrameMock(frame: HTMLIFrameElement) {
  const SOURCE = 'security-token-svc';
  const HOST = 'auth-client';
  frame.contentWindow.addEventListener('message', (msg: any) => {
    if (msg.data.source !== HOST) { return; }
    if (msg.data.messageType === 'ready') {
      window.postMessage({messageType: 'ready', source: SOURCE}, '*');
    } else if (msg.data.messageType === 'getToken') {
      getTokenCalls += 1;
      window.postMessage({
        messageType: 'getToken',
        source: SOURCE,
        value: 'accessToken!'
      }, '*');
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

      BBAuthCrossDomainIframe.getToken();

      expect(getOrMakeFrameSpy).toHaveBeenCalled();
      expect(getTokenFromIframeSpy).toHaveBeenCalledWith(fakeIframe);
    });
  });

  describe('getOrMakeIframe', () => {
    it('creates a new frame if none exist', () => {
      const getElementSpy = spyOn(document, 'getElementById').and.callThrough();
      const requestSpy = spyOn(BBAuthDomUtility, 'addIframe');

      BBAuthCrossDomainIframe.getOrMakeIframe();

      expect(getElementSpy).toHaveBeenCalledWith('auth-cross-domain-iframe');
      expect(requestSpy).toHaveBeenCalledWith('', 'auth-cross-domain-iframe', '');
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

      BBAuthCrossDomainIframe.getTokenFromIframe(fakeIframe)
        .then((tokenResonse) => {
          expect(tokenResonse.access_token).toEqual('accessToken!');
          expect(tokenResonse.expires_in).toEqual(0);
          done();
        });
    });

    it('only calls the iframe once if the getToken is called', (done) => {
      fakeIframe = BBAuthDomUtility.addIframe('', 'auth-cross-domain-iframe', '');
      IFrameMock(fakeIframe);

      BBAuthCrossDomainIframe.getTokenFromIframe(fakeIframe)
        .then((tokenResonse) => {
          BBAuthCrossDomainIframe.getTokenFromIframe(fakeIframe)
            .then((tr) => {
              expect(getTokenCalls).toEqual(2);
              done();
            });

        });
    });
  });

});
