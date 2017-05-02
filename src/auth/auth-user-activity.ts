import { BBCsrfXhr } from '../shared/csrf-xhr';

let isTracking: boolean;
let clientX: number;
let clientY: number;
let lastActivity: number;
let lastRenewal: number;
let renewOnNextActivity: boolean;
let intervalId: any;

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
  BBCsrfXhr.request('https://s21aidntoken00blkbapp01.nxt.blackbaud.com/session/renew');

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
    if (getTimestamp() - lastRenewal > BBAuthUserActivity.MIN_RENEWAL_AGE) {
      renewOnNextActivity = true;
    }
  }, BBAuthUserActivity.ACTIVITY_TIMER_INTERVAL);
}

export class BBAuthUserActivity {
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

  public static startTracking() {
    if (!isTracking) {
      addActivityListeners();
      startActivityTimer();

      isTracking = true;
    }
  }

  public static stopTracking() {
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
  }
}
