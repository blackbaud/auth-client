import { BBAuthDomUtility } from '../shared/dom-utility';
import { BBAuthCrossDomainIframe } from './auth-cross-domain-iframe';

function bindEvent(element: any, eventName: string, eventHandler: any) {
  if (element.addEventListener) {
      element.addEventListener(eventName, eventHandler, false);
  } else if (element.attachEvent) {
      element.attachEvent('on' + eventName, eventHandler);
  }
}

function IFrameMock(frame: HTMLIFrameElement) {
  bindEvent(frame.contentWindow, 'message', (msg: any) => {
    if (msg.data['methodName'] === 'ready') {
      window.postMessage({methodName: 'ready'}, '*');
    } else if (msg.data['methodName'] === 'getToken') {
      getTokenCalls += 1;
      window.postMessage({
        methodName: 'getToken',
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

  it('communicates with the iframe via "ready" and "getToken" and kicks off "ready"', (done) => {
    fakeIframe = BBAuthDomUtility.addIframe('', 'auth-cross-domain-iframe', '');
    IFrameMock(fakeIframe);

    BBAuthCrossDomainIframe.getTokenFromIFrame(fakeIframe)
      .then((tokenResonse) => {
        expect(tokenResonse.access_token).toEqual('accessToken!');
        expect(tokenResonse.expires_in).toEqual(0);
        done();
      });
  });

  it('only calls the iframe once if the getToken is called', (done) => {
    fakeIframe = BBAuthDomUtility.addIframe('', 'auth-cross-domain-iframe', '');
    IFrameMock(fakeIframe);

    BBAuthCrossDomainIframe.getTokenFromIFrame(fakeIframe)
      .then((tokenResonse) => {
        BBAuthCrossDomainIframe.getTokenFromIFrame(fakeIframe)
          .then((tr) => {
            expect(getTokenCalls).toEqual(2);
            done();
          });

      });
  });

});
