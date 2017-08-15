import { BBCsrfXhr } from '../shared/csrf-xhr';

import { BBAuthNavigator } from '../shared/navigator';

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
let lastSessionId: string;
let lastRefreshId = '';
let ttlCache: {
  promise: Promise<number>,
  refreshId: string
};
let watcherIFrame: HTMLIFrameElement;
let currentAllowAnonymous: boolean;

function getTimestamp() {
  return new Date().getTime();
}

function trackUserActivity() {
  lastActivity = getTimestamp();
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

function getSessionTtl(refreshId: any): Promise<number> {
  if (ttlCache && ttlCache.refreshId === refreshId) {
    return ttlCache.promise;
  }

  const promise = new Promise<number>((resolve, reject) => {
    BBCsrfXhr.request(
      'https://s21aidntoken00blkbapp01.nxt.blackbaud.com/session/ttl',
      undefined,
      currentAllowAnonymous
    )
      .then((ttl: number) => {
        const expirationDate = (ttl === null) ? null : getTimestamp() + ttl * 1000;

        resolve(expirationDate);
      })
      .catch(() => {
        resolve(null);
      });
  });

  ttlCache = {
    promise,
    refreshId
  };

  return promise;
}

function renewSession() {
  const now = getTimestamp();

  if (!lastRenewal || now - lastRenewal > BBOmnibarUserActivity.MIN_RENEWAL_RETRY) {
    lastRenewal = now;

    BBCsrfXhr.request(
      'https://s21aidntoken00blkbapp01.nxt.blackbaud.com/session/renew',
      {
        inactivity: 1
      }
    );
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

function startActivityTimer() {
  // It's possible the user was active on another web page and just navigated to this
  // one.  Since the activity tracking does not carry over from the previous page,
  // play it safe and renew the session immediately.
  if (!currentAllowAnonymous) {
    renewSession();
  }

  intervalId = setInterval(() => {
    getSessionTtl(lastRefreshId).then((expirationDate) => {
      const now = getTimestamp();

      // This is for the edge case where the user has signed out in another window but session
      // watcher hasn't  yet redirected this window to the sign in page.  Just return and let
      // session watcher trigger the redirect.
      if (expirationDate === null) {
        return;
      }

      if (now > expirationDate) {
        BBAuthNavigator.redirectToSignoutForInactivity();
      }

      const promptDate = expirationDate - BBOmnibarUserActivity.ABOUT_TO_EXPIRE_PROMPT_TIMEFRAME;
      const renewDate = expirationDate - BBOmnibarUserActivity.MAX_SESSION_AGE + BBOmnibarUserActivity.MIN_RENEWAL_AGE;

      // If we're showing the prompt, then don't process renewals based on activity.  They will need to
      // physically click on the prompt now.
      if (isShowingInactivityPrompt) {
        // The inactivity prompt was dismissed in another window.  Hide this one.
        if (now < promptDate) {
          closeInactivityPrompt();
        }
      } else {
        if (lastActivity > renewDate) {
          renewSession();
        } else if (now > promptDate && !currentAllowAnonymous) {
          showInactivityPrompt();
        }
      }
    });
  }, BBOmnibarUserActivity.ACTIVITY_TIMER_INTERVAL);
}

function createWatcherIFrame() {
  const url = BBOmnibarUserActivity.IDENTITY_SECURITY_TOKEN_SERVICE_ORIGIN +
    '/SessionWatcher.html?origin=' +
    encodeURIComponent(location.origin);

  watcherIFrame = document.createElement('iframe');

  watcherIFrame.className = 'sky-omnibar-iframe-session-watcher';
  watcherIFrame.width = '0';
  watcherIFrame.height = '0';
  watcherIFrame.frameBorder = '0';
  watcherIFrame.src = url;
  watcherIFrame.tabIndex = -1;

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
      const refreshId = message && message.refreshId;

      if (!sessionId && !currentAllowAnonymous) {
        BBAuthNavigator.redirectToSignin();
      }

      if (lastSessionId !== undefined && sessionId !== lastSessionId) {
        currentRefreshUserCallback();
      }

      lastRefreshId = refreshId;
      lastSessionId = sessionId;
    }
  }
}

function redirectIfUserLogsOutLater() {
  window.addEventListener('message', messageListener, false);
  createWatcherIFrame();
}

export class BBOmnibarUserActivity {
  public static ACTIVITY_TIMER_INTERVAL = 1000;

  // The amount of millseconds that the expiration prompt will show before the session actually expires.
  public static ABOUT_TO_EXPIRE_PROMPT_TIMEFRAME = 2 * 60 * 1000;

  // The amount of millseconds that a session is allowed without activity.
  public static MAX_SESSION_AGE = 15 * 60 * 1000;

  // The minimum age in milliseconds of the session before it will be renewed in response to user activity.
  public static MIN_RENEWAL_AGE = 5 * 60 * 1000;

  // The minimum amount of milliseconds that must elapse before this omnibar instance will issue a session renewal
  // after the previous time one is
  public static MIN_RENEWAL_RETRY = 60 * 1000;

  public static IDENTITY_SECURITY_TOKEN_SERVICE_ORIGIN = 'https://s21aidntoken00blkbapp01.nxt.blackbaud.com';

  public static startTracking(
    refreshUserCallback: () => void,
    showInactivityCallback: () => void,
    hideInactivityCallback: () => void,
    allowAnonymous: boolean
  ) {
    if (!isTracking || allowAnonymous !== currentAllowAnonymous) {
      BBOmnibarUserActivity.stopTracking();

      currentRefreshUserCallback = refreshUserCallback;
      currentShowInactivityCallback = showInactivityCallback;
      currentHideInactivityCallback = hideInactivityCallback;
      currentAllowAnonymous = allowAnonymous;

      addActivityListeners();
      startActivityTimer();
      redirectIfUserLogsOutLater();

      isTracking = true;
    }
  }

  public static userRenewedSession() {
    closeInactivityPrompt();
    renewSession();
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
    lastSessionId = undefined;
    ttlCache = undefined;
    isShowingInactivityPrompt = undefined;
    currentRefreshUserCallback = undefined;
    currentShowInactivityCallback = undefined;
    currentHideInactivityCallback = undefined;
    currentAllowAnonymous = undefined;
  }
}
