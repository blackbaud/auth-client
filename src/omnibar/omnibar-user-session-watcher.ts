import { BBOmnibarUserSessionState } from './omnibar-user-session-state';

import { BBAuthInterop } from '../shared/interop';

import { BBAuthNavigator } from '../shared/navigator';

import { BBAuthDomain } from '../auth/auth-domain';

let isWatching: boolean;
let currentLegacyKeepAliveUrl: string;
let currentRefreshUserCallback: () => void;
let currentStateChange: (state: BBOmnibarUserSessionState) => void;
let currentAllowAnonymous: boolean;
let watcherIFrame: HTMLIFrameElement;
let legacyKeepAliveIFrame: HTMLIFrameElement;
let state: BBOmnibarUserSessionState = {};
let currentLegacySigninUrl: string;

function parseOrigin(url: string) {
  if (url) {
    const urlParts = url.split('://');
    const protocol = urlParts[0];
    const hostname = urlParts[1].split('/')[0];

    return `${protocol}://${hostname}`;
  }

  return undefined;
}

function postLegacyKeepAliveMessage(message: any) {
  if (legacyKeepAliveIFrame) {
    BBAuthInterop.postOmnibarMessage(
      legacyKeepAliveIFrame,
      message,
      parseOrigin(currentLegacyKeepAliveUrl)
    );
  }
}

function createIFrame(cls: string, url: string): HTMLIFrameElement {
  const iframe = document.createElement('iframe');

  iframe.className = cls;
  iframe.frameBorder = '0';
  iframe.src = url;

  // Iframe is an inline element and won't take on height/width styles unless we make it a block.
  iframe.style.display = 'block';
  iframe.width = '0';
  iframe.height = '0';

  // Hide from assistive technologies.
  iframe.tabIndex = -1;
  iframe.setAttribute('aria-hidden', 'true');

  document.body.appendChild(iframe);

  return iframe;
}

function createWatcherIFrame() {
  const url = BBOmnibarUserSessionWatcher.IDENTITY_SECURITY_TOKEN_SERVICE_ORIGIN +
    '/SessionWatcher.html?origin=' +
    encodeURIComponent(location.origin);

  watcherIFrame = createIFrame('sky-omnibar-iframe-session-watcher', url);
}

function createLegacyKeepAliveIFrame() {
  if (currentLegacyKeepAliveUrl) {
    legacyKeepAliveIFrame = createIFrame(
      'sky-omnibar-iframe-legacy-keep-alive',
      currentLegacyKeepAliveUrl
    );
  }
}

function processSessionWatcherMessage(event: MessageEvent) {
  if (typeof event.data === 'string') {
    let data: any;

    try {
      data = JSON.parse(event.data);
    } catch (err) {
      // This is irrelevant data posted by a browser plugin or some other IFRAME, so just discard it.
      return;
    }

    if (data.messageType === 'session_change') {
      const message = data.message;

      // Session ID changes whenever the user logs in the user profile information
      // (e.g. name, email address ,etc.) changes
      const sessionId = message && message.sessionId;

      // Refresh ID changes whenever a user's session is extended due to activity.
      const refreshId = message && message.refreshId;

      if (!sessionId && !currentAllowAnonymous) {
        if (currentLegacySigninUrl) {
          BBAuthNavigator.navigate(currentLegacySigninUrl);
        } else {
          BBAuthNavigator.redirectToSignin();
        }
      }

      if (state.refreshId !== undefined && refreshId !== state.refreshId) {
        postLegacyKeepAliveMessage({
          messageType: 'session-refresh'
        });
      }

      if (state.sessionId !== undefined && sessionId !== state.sessionId) {
        currentRefreshUserCallback();
      }

      state.refreshId = refreshId;
      state.sessionId = sessionId;

      currentStateChange(state);
    }
  }
}

function processLegacyKeepAliveMessage(event: MessageEvent) {
  const data = event.data;

  switch (data.messageType) {
    case 'ready':
      state.legacyTtl = data.ttl;
      currentLegacySigninUrl = data.signinUrl;
      currentStateChange(state);
      break;
  }
}

function messageListener(event: MessageEvent) {
  switch (event.origin) {
    case BBOmnibarUserSessionWatcher.IDENTITY_SECURITY_TOKEN_SERVICE_ORIGIN:
      processSessionWatcherMessage(event);
      break;
    case parseOrigin(currentLegacyKeepAliveUrl):
      processLegacyKeepAliveMessage(event);
      break;
  }
}

export class BBOmnibarUserSessionWatcher {
  public static IDENTITY_SECURITY_TOKEN_SERVICE_ORIGIN = BBAuthDomain.getSTSDomain();

  public static start(
    allowAnonymous: boolean,
    legacyKeepAliveUrl: string,
    refreshUserCallback: () => void,
    stateChange: (state: BBOmnibarUserSessionState) => void
  ) {
    if (
      !isWatching ||
      allowAnonymous !== currentAllowAnonymous ||
      legacyKeepAliveUrl !== currentLegacyKeepAliveUrl
    ) {
      BBOmnibarUserSessionWatcher.stop();

      currentAllowAnonymous = allowAnonymous;
      currentRefreshUserCallback = refreshUserCallback;
      currentLegacyKeepAliveUrl = legacyKeepAliveUrl;
      currentStateChange = stateChange;

      createWatcherIFrame();
      createLegacyKeepAliveIFrame();

      window.addEventListener('message', messageListener, false);

      isWatching = true;
    }
  }

  public static stop() {
    window.removeEventListener('message', messageListener, false);

    if (watcherIFrame) {
      document.body.removeChild(watcherIFrame);
      watcherIFrame = undefined;
    }

    if (legacyKeepAliveIFrame) {
      document.body.removeChild(legacyKeepAliveIFrame);
      legacyKeepAliveIFrame = undefined;
    }

    state = {};

    isWatching =
      currentAllowAnonymous =
      currentRefreshUserCallback =
      currentLegacyKeepAliveUrl =
      currentLegacySigninUrl =
      currentStateChange =
      undefined;
  }
}
