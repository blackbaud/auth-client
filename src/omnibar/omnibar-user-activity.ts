import { BBCsrfXhr } from '../shared/csrf-xhr';

import { BBAuthNavigator } from '../shared/navigator';

let isTracking: boolean;
let clientX: number;
let clientY: number;
let lastActivity: number;
let lastRenewal: number;
let renewOnNextActivity: boolean;
let intervalId: any;
let lastSessionId: string;
let watcherIFrame: HTMLIFrameElement;
let currentRefreshUserCallback: () => void;

function getTimestamp() {
  return new Date().getTime();
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
  BBCsrfXhr.request(
    'https://s21aidntoken00blkbapp01.nxt.blackbaud.com/session/renew',
    {
      inactivity: 1
    }
  );

  lastRenewal = getTimestamp();

  renewOnNextActivity = false;
}

function trackUserActivity() {
  lastActivity = getTimestamp();

  if (renewOnNextActivity) {
    renewSession();
  }
}

function addActivityListeners() {
  document.addEventListener('keypress', trackUserActivity);
  document.addEventListener('mousemove', trackMouseMove);
}

function startActivityTimer() {
  // It's possible the user was active on another web page and just navigated to this
  // one.  Since the activity tracking does not carry over from the previous page,
  // play it safe and renew the session immediately.
  renewSession();

  intervalId = setInterval(() => {
    if (getTimestamp() - lastRenewal > BBOmnibarUserActivity.MIN_RENEWAL_AGE) {
      renewOnNextActivity = true;
    }
  }, BBOmnibarUserActivity.ACTIVITY_TIMER_INTERVAL);
}

function createWatcherIFrame(url: string) {
  watcherIFrame = document.createElement('iframe');

  watcherIFrame.width = '0';
  watcherIFrame.height = '0';
  watcherIFrame.frameBorder = '0';
  watcherIFrame.src = url;

  document.body.appendChild(watcherIFrame);
}

function messageListener(event: MessageEvent) {
  if (
    event.origin === BBOmnibarUserActivity.IDENTITY_SECURITY_TOKEN_SERVICE_ORIGIN &&
    typeof event.data === 'string'
  ) {
    let data: any;

    try {
      data = JSON.parse(event.data);
    } catch (err) {
      // This is irrelevant data posted by a browser plugin or some other IFRAME, so just discard it.
      return;
    }

    if (data.messageType === 'session_change') {
      const message = data.message;
      const sessionId = message && message.sessionId;

      if (sessionId) {
        if (lastSessionId && sessionId !== lastSessionId) {
          currentRefreshUserCallback();
        }

        lastSessionId = sessionId;
      } else {
        BBAuthNavigator.redirectToSignin();
      }
    }
  }
}

function redirectIfUserLogsOutLater() {
  window.addEventListener('message', messageListener, false);

  createWatcherIFrame(
    BBOmnibarUserActivity.IDENTITY_SECURITY_TOKEN_SERVICE_ORIGIN +
    '/SessionWatcher.html?origin=' +
    encodeURIComponent(location.origin)
  );
}

export class BBOmnibarUserActivity {
  public static ACTIVITY_TIMER_INTERVAL = 1000;

  // The amount of millseconds that the expiration prompt will show before the session actually expires.
  public static ABOUT_TO_EXPIRE_PROMPT_TIMEFRAME = 2 * 60 * 1000;

  // The amount of millseconds that a session is allowed without activity.
  public static MAX_SESSION_AGE = 30 * 60 * 1000;

  // The minimum age in milliseconds of the session before it will be renewed in response to user activity.
  public static MIN_RENEWAL_AGE = 5 * 60 * 1000;

  // The minimum amount of milliseconds that must ellapse before this omnibar instance will issue a session renewal
  // after the previos time one is
  public static MIN_RENEWAL_RETRY = 60 * 1000;

  public static IDENTITY_SECURITY_TOKEN_SERVICE_ORIGIN = 'https://s21aidntoken00blkbapp01.nxt.blackbaud.com';

  public static startTracking(refreshUserCallback: () => void) {
    if (!isTracking) {
      addActivityListeners();
      startActivityTimer();
      redirectIfUserLogsOutLater();

      currentRefreshUserCallback = refreshUserCallback;

      isTracking = true;
    }
  }

  public static stopTracking() {
    if (watcherIFrame) {
      document.body.removeChild(watcherIFrame);
      watcherIFrame = undefined;
    }

    window.removeEventListener('message', messageListener, false);

    document.removeEventListener('keypress', trackUserActivity);
    document.removeEventListener('mousemove', trackMouseMove);

    /* istanbul ignore else */
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = undefined;
    }

    isTracking = undefined;
    clientX = undefined;
    clientY = undefined;
    lastActivity = undefined;
    lastRenewal = undefined;
    renewOnNextActivity = undefined;
    lastSessionId = undefined;
    currentRefreshUserCallback = undefined;
  }
}
