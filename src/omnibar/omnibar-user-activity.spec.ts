import { BBAuthDomain } from '../auth/auth-domain';
import { BBCsrfXhr } from '../shared/csrf-xhr';
import { BBAuthNavigator } from '../shared/navigator';
import { BBOmnibarUserActivity } from './omnibar-user-activity';
import { BBOmnibarUserActivityProcessArgs } from './omnibar-user-activity-process-args';
import { BBOmnibarUserActivityProcessor } from './omnibar-user-activity-processor';
import { BBOmnibarUserSessionExpiration } from './omnibar-user-session-expiration';
import { BBOmnibarUserSessionState } from './omnibar-user-session-state';
import { BBOmnibarUserSessionWatcher } from './omnibar-user-session-watcher';

const TEST_TIMEOUT = 50;

describe('Omnibar user activity', () => {
  let redirectForInactivitySpy: jasmine.Spy;
  let refreshUserCallbackSpy: jasmine.Spy;
  let showInactivityCallbackSpy: jasmine.Spy;
  let hideInactivityCallbackSpy: jasmine.Spy;
  let getSessionExpirationSpy: jasmine.Spy;
  let myDomain: jasmine.Spy;
  let renewWasCalled: boolean;
  let expirationDate: number;

  function moveMouse(clientX: number, clientY: number) {
    document.dispatchEvent(
      new MouseEvent('mousemove', {
        clientX,
        clientY,
      })
    );
  }

  function pressKey() {
    document.dispatchEvent(new KeyboardEvent('keypress'));
  }

  function validateRenewCall(renewCalled = true, stsDomainCalled = true) {
    expect(renewWasCalled).toBe(renewCalled);

    if (stsDomainCalled) {
      expect(myDomain).toHaveBeenCalled();
    } else {
      expect(myDomain).not.toHaveBeenCalled();
    }
  }

  function startTracking(allowAnonymous = false, legacyKeepAliveUrl?: string) {
    BBOmnibarUserActivity.startTracking(
      refreshUserCallbackSpy,
      showInactivityCallbackSpy,
      hideInactivityCallbackSpy,
      allowAnonymous,
      legacyKeepAliveUrl
    );
  }

  function validateActivityTracking(
    doActivity1: () => void,
    doActivity2: () => void,
    shouldTrack: boolean,
    done: DoneFn
  ) {
    const activityLog: number[] = [];

    spyOn(BBOmnibarUserActivityProcessor, 'process').and.callFake(
      (args: BBOmnibarUserActivityProcessArgs) => {
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

  function validateNullExpirationBehavior(done: DoneFn) {
    BBOmnibarUserActivity.INACTIVITY_PROMPT_DURATION = 0.005;

    setTimeout(() => {
      expect(showInactivityCallbackSpy).not.toHaveBeenCalled();
      expect(hideInactivityCallbackSpy).not.toHaveBeenCalled();
      expect(redirectForInactivitySpy).not.toHaveBeenCalled();
      done();
    }, TEST_TIMEOUT);
  }

  beforeEach(() => {
    getSessionExpirationSpy = spyOn(
      BBOmnibarUserSessionExpiration,
      'getSessionExpiration'
    ).and.callFake(() => {
      return Promise.resolve(expirationDate);
    });

    myDomain = spyOn(BBAuthDomain, 'getSTSDomain').and.returnValue(
      'https://sts.sky.blackbaud.com'
    );

    spyOn(BBCsrfXhr, 'request').and.callFake((url: string) => {
      switch (url.substr('https://sts.sky.blackbaud.com/session/'.length)) {
        case 'renew':
          renewWasCalled = true;
          break;
      }

      return Promise.resolve();
    });

    redirectForInactivitySpy = spyOn(
      BBAuthNavigator,
      'redirectToSignoutForInactivity'
    );
    refreshUserCallbackSpy = jasmine.createSpy('refreshUserCallback');
    showInactivityCallbackSpy = jasmine.createSpy('showInactivityCallback');
    hideInactivityCallbackSpy = jasmine.createSpy('refreshUserCallback');

    expirationDate = Date.now() + 15;

    BBOmnibarUserActivity.ACTIVITY_TIMER_INTERVAL = TEST_TIMEOUT / 2;
    BBOmnibarUserActivity.MIN_RENEWAL_RETRY = TEST_TIMEOUT - 20;
    BBOmnibarUserActivity.MIN_RENEWAL_AGE = 0;
    BBOmnibarUserActivity.INACTIVITY_PROMPT_DURATION = 0.015 * 1000 - 5;
    BBOmnibarUserActivity.MAX_SESSION_AGE = TEST_TIMEOUT * 2;

    renewWasCalled = false;
  });

  afterEach(() => {
    BBOmnibarUserActivity.stopTracking();
  });

  it("should renew the user's session as soon as activity starts to be tracked", () => {
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
    validateActivityTracking(pressKey, pressKey, true, done);
  });

  it('should track activity when the mouse move event has fired but the mouse did not actually move', (done) => {
    validateActivityTracking(
      () => moveMouse(1, 1),
      () => moveMouse(1, 1),
      false,
      done
    );
  });

  it('should not start tracking again if tracking has already started', () => {
    const startWatchingSpy = spyOn(BBOmnibarUserSessionWatcher, 'start');

    startTracking();

    startTracking();

    expect(startWatchingSpy).toHaveBeenCalledTimes(1);
  });

  it('should start tracking again if tracking has already started and the allow anonymous flag changes', () => {
    const startWatchingSpy = spyOn(BBOmnibarUserSessionWatcher, 'start');

    startTracking();

    startTracking(true, 'https://example.com/test');

    // When tracking is restarted, the IFRAMEs should be removed from the DOM and
    // new ones created and added to the DOM.
    expect(startWatchingSpy).toHaveBeenCalledTimes(2);
  });

  it('should allow the user to close the inactivity prompt and renew the session', () => {
    startTracking();

    renewWasCalled = false;

    BBOmnibarUserActivity.MIN_RENEWAL_RETRY = 0;

    BBOmnibarUserActivity.userRenewedSession();

    validateRenewCall();
  });

  it("should not renew the user's session if the min renewal retry time has not been reached", (done) => {
    startTracking();

    renewWasCalled = false;

    BBOmnibarUserActivity.MIN_RENEWAL_RETRY = TEST_TIMEOUT + 500000;

    setTimeout(() => {
      BBOmnibarUserActivity.userRenewedSession();

      validateRenewCall(false);

      done();
    }, TEST_TIMEOUT);
  });

  it("should not renew the user's session on startup if allow anonymous is true", () => {
    startTracking(true);

    validateRenewCall(false, false);
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

  it('should show an inactivity prompt', (done) => {
    startTracking();

    expirationDate = Date.now() + 10;

    BBOmnibarUserActivity.INACTIVITY_PROMPT_DURATION =
      BBOmnibarUserActivity.MAX_SESSION_AGE;

    setTimeout(() => {
      expect(showInactivityCallbackSpy).toHaveBeenCalled();
      done();
    }, TEST_TIMEOUT);
  });

  it('should ignore a null expiration date and let session watcher redirect', (done) => {
    startTracking();

    expirationDate = null;

    validateNullExpirationBehavior(done);
  });

  it('should pick up state changes from session watcher', (done) => {
    let currentStateChange: (state: BBOmnibarUserSessionState) => void;

    spyOn(BBOmnibarUserSessionWatcher, 'start').and.callFake(
      (
        _allowAnonymous,
        _legacyKeepAliveUrl,
        _refreshUserCallback,
        stateChange
      ) => {
        currentStateChange = stateChange;
      }
    );

    getSessionExpirationSpy.and.callFake(
      (refreshId: string, legacyTtl: number) => {
        expect(refreshId).toBe('123');
        expect(legacyTtl).toBe(456);
        done();
        return Promise.resolve(123);
      }
    );

    startTracking();

    currentStateChange({
      legacyTtl: 456,
      refreshId: '123',
    });
  });

  it('should navigate to the legacy signin URL on session expiration when specified', (done) => {
    let currentStateChange: (state: BBOmnibarUserSessionState) => void;

    const navigateSpy = spyOn(BBAuthNavigator, 'navigate');

    spyOn(BBOmnibarUserSessionWatcher, 'start').and.callFake(
      (
        _allowAnonymous,
        _legacyKeepAliveUrl,
        _refreshUserCallback,
        stateChange
      ) => {
        currentStateChange = stateChange;
      }
    );

    BBOmnibarUserActivity.MAX_SESSION_AGE = TEST_TIMEOUT / 2;

    startTracking();

    currentStateChange({
      legacySigninUrl: 'https://example.com/legacy',
      legacyTtl: 456,
      refreshId: '123',
    });

    setTimeout(() => {
      expect(navigateSpy).toHaveBeenCalledWith('https://example.com/legacy');
      done();
    }, TEST_TIMEOUT);
  });

  it('should restart activity tracking when the legacy keep alive URL changes', () => {
    const sessionWatcherStartSpy = spyOn(BBOmnibarUserSessionWatcher, 'start');

    startTracking(false, undefined);
    expect(sessionWatcherStartSpy.calls.count()).toBe(1);

    startTracking(false, undefined);
    expect(sessionWatcherStartSpy.calls.count()).toBe(1);

    startTracking(false, 'https://example.com/keep-alive');
    expect(sessionWatcherStartSpy.calls.count()).toBe(2);
  });
});
