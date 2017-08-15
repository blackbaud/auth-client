import { BBOmnibarUserActivity } from './omnibar-user-activity';

import { BBCsrfXhr } from '../shared/csrf-xhr';
import { BBAuthNavigator } from '../shared/navigator';

const RENEW_URL = 'https://s21aidntoken00blkbapp01.nxt.blackbaud.com/session/renew';
const SIGNIN_URL = 'https://signin.blackbaud.com/signin/';

describe('User activity', () => {
  let navigateSpy: jasmine.Spy;
  let requestSpy: jasmine.Spy;
  let redirectForInactivitySpy: jasmine.Spy;
  let refreshUserCallbackSpy: jasmine.Spy;
  let showInactivityCallbackSpy: jasmine.Spy;
  let hideInactivityCallbackSpy: jasmine.Spy;
  let ttl: number;
  let ttlPromiseOverride: Promise<number>;

  function moveMouse(clientX = 1, clientY = 1) {
    document.dispatchEvent(
      new MouseEvent(
        'mousemove',
        {
          clientX,
          clientY
        }
      )
    );
  }

  function pressKey() {
    document.dispatchEvent(new KeyboardEvent('keypress'));
  }

  function validateRenewCall() {
    expect(requestSpy).toHaveBeenCalledWith(
      RENEW_URL,
      {
        inactivity: 1
      }
    );
  }

  function startTracking(allowAnonymous = false) {
    BBOmnibarUserActivity.startTracking(
      refreshUserCallbackSpy,
      showInactivityCallbackSpy,
      hideInactivityCallbackSpy,
      allowAnonymous
    );
  }

  function postSessionChange(refreshId: string, sessionId: string) {
    window.dispatchEvent(
      new MessageEvent('message', {
        data: JSON.stringify({
          message: {
            refreshId,
            sessionId
          },
          messageType: 'session_change'
        }),
        origin: BBOmnibarUserActivity.IDENTITY_SECURITY_TOKEN_SERVICE_ORIGIN
      })
    );
  }

  function getWatcherIFrame() {
    return document.querySelectorAll('.sky-omnibar-iframe-session-watcher');
  }

  beforeAll(() => {
    requestSpy = spyOn(BBCsrfXhr, 'request').and.callFake((url: string) => {
      if (url === 'https://s21aidntoken00blkbapp01.nxt.blackbaud.com/session/ttl') {
        return ttlPromiseOverride || Promise.resolve(ttl);
      }

      return Promise.resolve();
    });

    navigateSpy = spyOn(BBAuthNavigator, 'navigate');
    redirectForInactivitySpy = spyOn(BBAuthNavigator, 'redirectToSignoutForInactivity');
    refreshUserCallbackSpy = jasmine.createSpy('refreshUserCallback');
    showInactivityCallbackSpy = jasmine.createSpy('showInactivityCallback');
    hideInactivityCallbackSpy = jasmine.createSpy('refreshUserCallback');
  });

  beforeEach(() => {
    requestSpy.calls.reset();
    navigateSpy.calls.reset();
    redirectForInactivitySpy.calls.reset();
    refreshUserCallbackSpy.calls.reset();
    showInactivityCallbackSpy.calls.reset();
    hideInactivityCallbackSpy.calls.reset();
    BBOmnibarUserActivity.MIN_RENEWAL_AGE = 20;
    BBOmnibarUserActivity.ACTIVITY_TIMER_INTERVAL = 10;
    BBOmnibarUserActivity.MIN_RENEWAL_RETRY = 10;
    ttl = 15;
    ttlPromiseOverride = undefined;
  });

  afterEach(() => {
    BBOmnibarUserActivity.stopTracking();
  });

  it('should renew the user\'s session as soon as activity starts to be tracked', () => {
    startTracking();

    validateRenewCall();
  });

  it('should renew the user\'s session when the user moves the mouse', (done) => {
    startTracking();

    requestSpy.calls.reset();

    moveMouse();

    setTimeout(() => {
      validateRenewCall();

      done();
    }, 30);
  });

  it('should renew the user\'s session when the user presses a key', (done) => {
    startTracking();

    requestSpy.calls.reset();

    pressKey();

    setTimeout(() => {
      validateRenewCall();

      done();
    }, 30);
  });

  it('should close the inactivity prompt when the session', (done) => {
    startTracking();

    requestSpy.calls.reset();

    pressKey();

    setTimeout(() => {
      validateRenewCall();

      done();
    }, 30);
  });

  it(
    'should not renew the user\'s session when the mouse move event has fired but the mouse did not actually move',
    (done) => {
      startTracking();

      setTimeout(() => {
        moveMouse();

        requestSpy.calls.reset();

        moveMouse();

        setTimeout(() => {
          expect(requestSpy).not.toHaveBeenCalled();
          done();
        }, 30);
      }, 30);
    }
  );

  it('should not start tracking again if tracking has already started', () => {
    startTracking();

    let watcherIFrameEl = getWatcherIFrame();

    startTracking();

    expect(getWatcherIFrame().length).toBe(1);
    expect(getWatcherIFrame()[0]).toBe(watcherIFrameEl[0]);

    watcherIFrameEl = undefined;
  });

  it('should start tracking again if tracking has already started and the allow anonymous flag changes', () => {
    startTracking();

    let watcherIFrameEl = getWatcherIFrame();

    startTracking(true);

    // When tracking is restarted, the session watcher IFRAME should be removed from the DOM and
    // a new one created and added to the DOM.
    expect(getWatcherIFrame().length).toBe(1);
    expect(getWatcherIFrame()[0]).not.toBe(watcherIFrameEl[0]);

    watcherIFrameEl = undefined;
  });

  it(
    'should allow the user to close the inactivity prompt and renew the session',
    (done) => {
      startTracking();

      requestSpy.calls.reset();

      setTimeout(() => {
        BBOmnibarUserActivity.userRenewedSession();

        expect(requestSpy).toHaveBeenCalledWith(
          'https://s21aidntoken00blkbapp01.nxt.blackbaud.com/session/renew',
          {
            inactivity: 1
          }
        );

        done();
      }, 30);
    }
  );

  it(
    'should not renew the user\'s session if the min renewal retry time has not been reached',
    (done) => {
      startTracking();

      requestSpy.calls.reset();

      BBOmnibarUserActivity.MIN_RENEWAL_RETRY = 100;

      setTimeout(() => {
        BBOmnibarUserActivity.userRenewedSession();

        expect(requestSpy).not.toHaveBeenCalledWith(
          'https://s21aidntoken00blkbapp01.nxt.blackbaud.com/session/renew',
          {
            inactivity: 1
          }
        );

        done();
      }, 30);
    }
  );

  it('should not renew the user\'s session on startup if allow anonymous is true', () => {
    startTracking(true);

    expect(requestSpy).not.toHaveBeenCalledWith(
      'https://s21aidntoken00blkbapp01.nxt.blackbaud.com/session/renew',
      {
        inactivity: 1
      }
    );
  });

  it('should stop tracking activity', (done) => {
    startTracking();
    BBOmnibarUserActivity.stopTracking();

    requestSpy.calls.reset();

    setTimeout(() => {
      moveMouse();
      pressKey();

      expect(requestSpy).not.toHaveBeenCalled();

      done();
    }, 30);
  });

  it('should redirect the user to the login page if the user logs out in another browser tab', () => {
    startTracking();

    window.dispatchEvent(
      new MessageEvent('message', {
        data: JSON.stringify({
          message: {
            sessionId: undefined
          },
          messageType: 'session_change'
        }),
        origin: BBOmnibarUserActivity.IDENTITY_SECURITY_TOKEN_SERVICE_ORIGIN
      })
    );

    expect(navigateSpy).toHaveBeenCalledWith(
      SIGNIN_URL +
      '?redirectUrl=' +
      encodeURIComponent(location.href)
    );
  });

  it('should redirect the user to the login page due to inactivity', (done) => {
    startTracking();

    ttl = .01;

    setTimeout(() => {
      expect(redirectForInactivitySpy).toHaveBeenCalled();

      done();
    }, 30);
  });

  it('should show an inactivity prompt', (done) => {
    startTracking();

    ttl = .01;

    BBOmnibarUserActivity.INACTIVITY_PROMPT_DURATION = .005;

    setTimeout(() => {
      expect(showInactivityCallbackSpy).toHaveBeenCalled();
      done();
    }, 30);
  });

  it('should hide the inactivity prompt when closed in another window', (done) => {
    startTracking();

    ttl = .01;

    BBOmnibarUserActivity.INACTIVITY_PROMPT_DURATION = .005;

    setTimeout(() => {
      expect(showInactivityCallbackSpy).toHaveBeenCalled();

      postSessionChange('def', '456');

      setTimeout(() => {
        expect(hideInactivityCallbackSpy).toHaveBeenCalled();
        done();
      }, 30);
    }, 30);
  });

  function validateNullTllBehavior(done: DoneFn) {
    BBOmnibarUserActivity.INACTIVITY_PROMPT_DURATION = .005;

    setTimeout(() => {
      expect(showInactivityCallbackSpy).not.toHaveBeenCalled();
      expect(hideInactivityCallbackSpy).not.toHaveBeenCalled();
      expect(redirectForInactivitySpy).not.toHaveBeenCalled();
      done();
    }, 30);
  }

  it('should ignore a null TTL and let session watcher redirect', (done) => {
    startTracking();

    ttl = null;

    validateNullTllBehavior(done);
  });

  it('should treat a non-200 TTL response as null', (done) => {
    startTracking();

    ttlPromiseOverride = Promise
      .reject(new Error('Not logged in'))
      .catch(() => undefined);

    validateNullTllBehavior(done);
  });

  it('should ignore unexpected event data without throwing an error', () => {
    startTracking();

    window.dispatchEvent(
      new MessageEvent('message', {
        data: {
          foo: 'bar'
        },
        origin: BBOmnibarUserActivity.IDENTITY_SECURITY_TOKEN_SERVICE_ORIGIN
      })
    );

    window.dispatchEvent(
      new MessageEvent('message', {
        data: 'asdf',
        origin: BBOmnibarUserActivity.IDENTITY_SECURITY_TOKEN_SERVICE_ORIGIN
      })
    );

    window.dispatchEvent(
      new MessageEvent('message', {
        data: JSON.stringify({
          messageType: 'foo'
        }),
        origin: BBOmnibarUserActivity.IDENTITY_SECURITY_TOKEN_SERVICE_ORIGIN
      })
    );
  });

  it('should call the specified callback when the current user\'s info changes' , () => {
    startTracking();

    postSessionChange('abc', '123');

    expect(refreshUserCallbackSpy).not.toHaveBeenCalled();

    postSessionChange('abc', '456');

    expect(refreshUserCallbackSpy).toHaveBeenCalled();
  });

  it('should hide the session watcher IFRAME from assistive technology', () => {
    startTracking();

    const iframeEl = document.querySelector('.sky-omnibar-iframe-session-watcher');

    expect(iframeEl.getAttribute('tabindex')).toBe('-1');
  });

});
