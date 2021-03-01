import {
  BBAuthDomain
} from '../auth/auth-domain';

import {
  BBCsrfXhr
} from '../shared/csrf-xhr';

import {
  BBAuthNavigator
} from '../shared/navigator';

import {
  BBOmnibarUserActivityProcessor
} from './omnibar-user-activity-processor';

import {
  BBOmnibarUserSessionExpiration
} from './omnibar-user-session-expiration';

import {
  BBOmnibarUserSessionWatcher
} from './omnibar-user-session-watcher';

let isTracking: boolean;
let clientX: number;
let clientY: number;
let currentHideInactivityCallback: () => void;
let currentRefreshUserCallback: () => void;
let currentShowInactivityCallback: () => void;
let isShowingInactivityPrompt: boolean;
let lastActivity: number;
let lastRenewal: number;
let intervalId: any;
let lastRefreshId = '';
let currentAllowAnonymous: boolean;
let currentLegacyKeepAliveUrl: string;
let legacyTtl: number;
let legacySigninUrl: string;

function trackUserActivity() {
  lastActivity = Date.now();
}

function trackMouseMove(e: MouseEvent) {
  // We have seen issues where the browser sometimes raises the mousemove event even when it isn't moving.
  // Since that might prevent the user from ever timing out, adding this check to ensure the location
  // actually changed.
  if (e.clientX !== clientX || e.clientY !== clientY) {
    clientX = e.clientX;
    clientY = e.clientY;
    trackUserActivity();
  }
}

function renewSession() {
  const now = Date.now();

  if (!lastRenewal || now - lastRenewal > BBOmnibarUserActivity.MIN_RENEWAL_RETRY) {
    lastRenewal = now;

    BBCsrfXhr.request(
      BBAuthDomain.getSTSDomain() + '/session/renew',
      {
        inactivity: 1
      }
    ).catch(/* istanbul ignore next */ () => undefined);
  }
}

function addActivityListeners() {
  document.addEventListener('keypress', trackUserActivity);
  document.addEventListener('mousemove', trackMouseMove);
}

function showInactivityPrompt() {
  isShowingInactivityPrompt = true;
  currentShowInactivityCallback();
}

function closeInactivityPrompt() {
  isShowingInactivityPrompt = false;
  trackUserActivity();
  currentHideInactivityCallback();
}

function redirectForInactivity() {
  if (legacySigninUrl) {
    BBAuthNavigator.navigate(legacySigninUrl);
  } else {
    BBAuthNavigator.redirectToSignoutForInactivity();
  }
}

function startActivityTimer() {
  // It's possible the user was active on another web page and just navigated to this
  // one.  Since the activity tracking does not carry over from the previous page,
  // play it safe and renew the session immediately.
  if (!currentAllowAnonymous) {
    renewSession();
  }

  intervalId = setInterval(async () => {
    const expirationDate = await BBOmnibarUserSessionExpiration.getSessionExpiration(
      lastRefreshId,
      legacyTtl,
      currentAllowAnonymous
    );

    // Verify activity tracking didn't stop since session expiration retrieval began.
    if (isTracking) {
      BBOmnibarUserActivityProcessor.process({
        allowAnonymous: currentAllowAnonymous,
        closeInactivityPrompt,
        expirationDate,
        inactivityPromptDuration: BBOmnibarUserActivity.INACTIVITY_PROMPT_DURATION,
        isShowingInactivityPrompt,
        lastActivity,
        maxSessionAge: BBOmnibarUserActivity.MAX_SESSION_AGE,
        minRenewalAge: BBOmnibarUserActivity.MIN_RENEWAL_AGE,
        redirectForInactivity,
        renewSession,
        showInactivityPrompt
      });
    }
  }, BBOmnibarUserActivity.ACTIVITY_TIMER_INTERVAL);
}

export class BBOmnibarUserActivity {
  // The interval in milliseconds that the last activity is evaluated against the session timeout period.
  public static ACTIVITY_TIMER_INTERVAL = 1000;

  // The minimum time in milliseconds that must elapse before this omnibar instance will issue a session renewal
  // after the previous session renewal.
  public static MIN_RENEWAL_RETRY = 1 * 60 * 1000;

  // The time in millseconds that the expiration prompt will show before the session actually expires.
  public static INACTIVITY_PROMPT_DURATION = 2 * 60 * 1000;

  // The minimum age in milliseconds of the session before it will be renewed in response to user activity.
  public static MIN_RENEWAL_AGE = 5 * 60 * 1000;

  // The time in millseconds that a session is allowed without activity.  While the actual length of the current
  // session is determined by calls to auth's TTL endpoint, this value is used to determine when to start renewing
  // the session by calculating the difference between the max session age and the min renewal age.
  public static MAX_SESSION_AGE = 90 * 60 * 1000;

  public static startTracking(
    refreshUserCallback: () => Promise<void>,
    showInactivityCallback: () => void,
    hideInactivityCallback: () => void,
    allowAnonymous: boolean,
    legacyKeepAliveUrl: string
  ) {
    if (
      !isTracking ||
      allowAnonymous !== currentAllowAnonymous ||
      legacyKeepAliveUrl !== currentLegacyKeepAliveUrl
    ) {
      BBOmnibarUserActivity.stopTracking();

      currentRefreshUserCallback = refreshUserCallback;
      currentShowInactivityCallback = showInactivityCallback;
      currentHideInactivityCallback = hideInactivityCallback;
      currentAllowAnonymous = allowAnonymous;
      currentLegacyKeepAliveUrl = legacyKeepAliveUrl;

      addActivityListeners();
      startActivityTimer();

      BBOmnibarUserSessionWatcher.start(
        allowAnonymous,
        legacyKeepAliveUrl,
        currentRefreshUserCallback,
        (state) => {
          legacyTtl = state.legacyTtl;
          lastRefreshId = state.refreshId;
          legacySigninUrl = state.legacySigninUrl;
        }
      );

      isTracking = true;
    }
  }

  public static userRenewedSession() {
    closeInactivityPrompt();
    renewSession();
  }

  public static stopTracking() {
    BBOmnibarUserSessionWatcher.stop();
    BBOmnibarUserSessionExpiration.reset();

    document.removeEventListener('keypress', trackUserActivity);
    document.removeEventListener('mousemove', trackMouseMove);

    /* istanbul ignore else */
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = undefined;
    }

    isTracking =
      clientX =
      clientY =
      lastActivity =
      lastRenewal =
      isShowingInactivityPrompt =
      currentRefreshUserCallback =
      currentShowInactivityCallback =
      currentHideInactivityCallback =
      currentAllowAnonymous =
      currentLegacyKeepAliveUrl =
      undefined;
  }
}
