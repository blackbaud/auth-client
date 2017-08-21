import { BBAuthNavigator } from '../shared/navigator';

let isWatching: boolean;
let currentLegacyKeepAliveUrl: string;
let currentRefreshUserCallback: () => void;
let currentStateChange: (state: {
  legacyTtl?: number,
  refreshId?: string,
  sessionId?: string
}) => void;
let currentAllowAnonymous: boolean;
let watcherIFrame: HTMLIFrameElement;
let legacyKeepAliveIFrame: HTMLIFrameElement;
let state: {
  legacyTtl?: number,
  refreshId?: string,
  sessionId?: string
} = {};

function createIFrame(cls: string, url: string): HTMLIFrameElement {
  const iframe = document.createElement('iframe');

  iframe.className = cls;
  iframe.width = '0';
  iframe.height = '0';
  iframe.frameBorder = '0';
  iframe.src = url;
  iframe.tabIndex = -1;

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
        BBAuthNavigator.redirectToSignin();
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

function parseOrigin(url: string) {
  if (url) {
    const urlParts = url.split('://');
    const protocol = urlParts[0];
    const hostname = urlParts[1].split('/')[0];

    return `${protocol}://${hostname}`;
  }

  return undefined;
}

function processLegacyKeepAliveMessage(event: MessageEvent) {
  const data = event.data;

  switch (data.messageType) {
    case 'ready':
      state.legacyTtl = data.ttl;
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
  public static IDENTITY_SECURITY_TOKEN_SERVICE_ORIGIN = 'https://s21aidntoken00blkbapp01.nxt.blackbaud.com';

  public static start(
    allowAnonymous: boolean,
    legacyKeepAliveUrl: string,
    refreshUserCallback: () => void,
    stateChange: (state: {
      legacyTtl?: number,
      refreshId?: string,
      sessionId?: string
    }) => void
  ) {
    if (!isWatching || allowAnonymous !== currentAllowAnonymous) {
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
      currentStateChange =
      undefined;
  }
}
