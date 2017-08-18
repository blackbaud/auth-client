import { BBOmnibarUserActivity } from './omnibar-user-activity';
import { BBOmnibarUserActivityProcessArgs } from './omnibar-user-activity-process-args';
import { BBOmnibarUserActivityProcessor } from './omnibar-user-activity-processor';

import { BBCsrfXhr } from '../shared/csrf-xhr';
import { BBAuthNavigator } from '../shared/navigator';

const SIGNIN_URL = 'https://signin.blackbaud.com/signin/';
const TEST_TIMEOUT = 50;

describe('User activity', () => {
  let navigateSpy: jasmine.Spy;
  let requestSpy: jasmine.Spy;
  let redirectForInactivitySpy: jasmine.Spy;
  let refreshUserCallbackSpy: jasmine.Spy;
  let showInactivityCallbackSpy: jasmine.Spy;
  let hideInactivityCallbackSpy: jasmine.Spy;
  let ttl: number;
  let ttlPromiseOverride: Promise<number>;
  let renewWasCalled: boolean;

  function moveMouse(clientX: number, clientY: number) {
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

  function validateRenewCall(called = true) {
    expect(renewWasCalled).toBe(called);
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

  function validateActivityTracking(
    doActivity1: () => void,
    doActivity2: () => void,
    shouldTrack: boolean,
    done: DoneFn
  ) {
    const activityLog: any[] = [];

    spyOn(BBOmnibarUserActivityProcessor, 'process')
      .and
      .callFake((args: BBOmnibarUserActivityProcessArgs) => {
        if (args.lastActivity !== activityLog[activityLog.length - 1]) {
          activityLog.push(args.lastActivity);
        }
      }
    );

    startTracking();

    expect(activityLog.length).toBe(0);

    doActivity1();

    setTimeout(() => {
      expect(activityLog.length).toBe(1);

      doActivity2();

      setTimeout(() => {
        if (shouldTrack) {
          expect(activityLog.length).toBe(2);
          expect(activityLog[1]).toBeGreaterThan(activityLog[0]);
        } else {
          expect(activityLog.length).toBe(1);
        }

        done();
      }, TEST_TIMEOUT);
    }, TEST_TIMEOUT);
  }

  beforeAll(() => {
    requestSpy = spyOn(BBCsrfXhr, 'request').and.callFake((url: string) => {
      switch (url.substr('https://s21aidntoken00blkbapp01.nxt.blackbaud.com/session/'.length)) {
        case 'ttl':
          return ttlPromiseOverride || Promise.resolve(ttl);
        case 'renew':
          renewWasCalled = true;
          break;
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

    ttl = .015;

    BBOmnibarUserActivity.ACTIVITY_TIMER_INTERVAL = TEST_TIMEOUT / 2;
    BBOmnibarUserActivity.MIN_RENEWAL_RETRY = TEST_TIMEOUT - 20;
    BBOmnibarUserActivity.MIN_RENEWAL_AGE = 0;
    BBOmnibarUserActivity.INACTIVITY_PROMPT_DURATION = (ttl * 1000) - 5;
    BBOmnibarUserActivity.MAX_SESSION_AGE = TEST_TIMEOUT * 2;

    ttlPromiseOverride = undefined;
    renewWasCalled = false;
  });

  afterEach(() => {
    BBOmnibarUserActivity.stopTracking();
  });

  it('should renew the user\'s session as soon as activity starts to be tracked', () => {
    startTracking();

    validateRenewCall();
  });

  it('should track activity when the user moves the mouse', (done) => {
    validateActivityTracking(
      () => moveMouse(1, 1),
      () => moveMouse(1, 2),
      true,
      done
    );
  });

  it('should track activity when the user presses a key', (done) => {
    validateActivityTracking(
      pressKey,
      pressKey,
      true,
      done
    );
  });

  it(
    'should track activity when the mouse move event has fired but the mouse did not actually move',
    (done) => {
      validateActivityTracking(
        () => moveMouse(1, 1),
        () => moveMouse(1, 1),
        false,
        done
      );
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

  it('should allow the user to close the inactivity prompt and renew the session', () => {
    startTracking();

    renewWasCalled = false;

    BBOmnibarUserActivity.MIN_RENEWAL_RETRY = 0;

    BBOmnibarUserActivity.userRenewedSession();

    validateRenewCall();
  });

  it(
    'should not renew the user\'s session if the min renewal retry time has not been reached',
    (done) => {
      startTracking();

      renewWasCalled = false;

      BBOmnibarUserActivity.MIN_RENEWAL_RETRY = TEST_TIMEOUT + 500000;

      setTimeout(() => {
        BBOmnibarUserActivity.userRenewedSession();

        validateRenewCall(false);

        done();
      }, TEST_TIMEOUT);
    }
  );

  it('should not renew the user\'s session on startup if allow anonymous is true', () => {
    startTracking(true);

    validateRenewCall(false);
  });

  it('should stop tracking activity', (done) => {
    startTracking();

    validateActivityTracking(
      () => moveMouse(1, 2),
      () => {
        BBOmnibarUserActivity.stopTracking();
        pressKey();
      },
      false,
      done
    );
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

  it('should show an inactivity prompt', (done) => {
    startTracking();

    ttl = .01;

    BBOmnibarUserActivity.INACTIVITY_PROMPT_DURATION = BBOmnibarUserActivity.MAX_SESSION_AGE;

    setTimeout(() => {
      expect(showInactivityCallbackSpy).toHaveBeenCalled();
      done();
    }, TEST_TIMEOUT);
  });

  function validateNullTllBehavior(done: DoneFn) {
    BBOmnibarUserActivity.INACTIVITY_PROMPT_DURATION = .005;

    setTimeout(() => {
      expect(showInactivityCallbackSpy).not.toHaveBeenCalled();
      expect(hideInactivityCallbackSpy).not.toHaveBeenCalled();
      expect(redirectForInactivitySpy).not.toHaveBeenCalled();
      done();
    }, TEST_TIMEOUT);
  }

  it('should ignore a null TTL and let session watcher redirect', (done) => {
    startTracking();

    ttl = null;

    validateNullTllBehavior(done);
  });

  it('should treat a non-200 TTL response as null', (done) => {
    startTracking();

    ttlPromiseOverride = Promise
      .reject(new Error('Not logged in'));

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
