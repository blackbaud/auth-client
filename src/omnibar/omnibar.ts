import { BBAuth } from '../auth';
import { BBAuthInterop } from '../shared/interop';
import { BBOmnibarConfig } from './omnibar-config';
import { BBOmnibarNavigationItem } from './omnibar-navigation-item';
import { BBOmnibarNotificationItem } from './omnibar-notification-item';
import { BBOmnibarSearchArgs } from './omnibar-search-args';

import { BBOmnibarUserActivity } from './omnibar-user-activity';

import { BBAuthNavigator } from '../shared/navigator';

import { BBAuthDomUtility } from '../shared/dom-utility';

const CLS_EXPANDED = 'sky-omnibar-iframe-expanded';
const CLS_LOADING = 'sky-omnibar-loading';

let envEl: HTMLDivElement;
let placeholderEl: HTMLDivElement;
let styleEl: HTMLStyleElement;
let iframeEl: HTMLIFrameElement;
let omnibarConfig: BBOmnibarConfig;
let currentLegacyKeepAliveUrl: string;
let promiseResolve: () => void;

function addIframeEl() {
  iframeEl = BBAuthDomUtility.addIframe(
    buildOmnibarUrl(),
    `sky-omnibar-iframe ${CLS_LOADING}`,
    'Navigation'
  );
}

function addEnvironmentEl() {
  envEl = document.createElement('div');
  envEl.className = 'sky-omnibar-environment';

  BBAuthDomUtility.addElToBodyTop(envEl);
}

function collapseIframe() {
  iframeEl.classList.remove(CLS_EXPANDED);
}

function addStyleEl() {
  styleEl = BBAuthDomUtility.addCss(`
body {
  margin-top: 50px;
}

#bb-help-container {
  padding-top: 1px;
}

.sky-omnibar-iframe,
.sky-omnibar-placeholder {
  border: none;
  height: 50px;
  width: 100%;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
}

.sky-omnibar-placeholder {
  background-color: #4d5259;
  border-top: 5px solid #00b4f1;
  display: none;
}

.sky-omnibar-placeholder.sky-omnibar-loading {
  display: block;
}

.sky-omnibar-iframe.sky-omnibar-loading {
  visibility: hidden;
}

.sky-omnibar-iframe-expanded {
  height: 100%;
}

.sky-omnibar-environment {
  background-color: #e1e1e3;
  color: #282b31;
  font-family: "Blackbaud Sans", "Open Sans", "Helvetica Neue", Arial, sans-serif;
  font-size: 12px;
  font-weight: 400;
  height: 0;
  line-height: 24px;
  overflow: hidden;
  padding: 0 15px;
  text-align: right;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sky-omnibar-environment-visible .sky-omnibar-environment {
  height: 24px;
}
`
  );
}

function addPlaceholderEl() {
  placeholderEl = document.createElement('div');
  placeholderEl.className = `sky-omnibar-placeholder ${CLS_LOADING}`;

  document.body.appendChild(placeholderEl);
}

function expandIframe() {
  iframeEl.classList.add(CLS_EXPANDED);
}

function handleStateChange() {
  BBAuthInterop.postOmnibarMessage(
    iframeEl,
    {
      href: document.location.href,
      messageType: 'location-change'
    }
  );
}

function handleSearch(searchArgs: BBOmnibarSearchArgs) {
  if (omnibarConfig.onSearch) {
    omnibarConfig
      .onSearch(searchArgs)
      .then((results: any) => {
        BBAuthInterop.postOmnibarMessage(
          iframeEl,
          {
            messageType: 'search-results',
            results
          }
        );
      });
  }
}

function refreshUserCallback() {
  function refreshUser(token: string) {
    BBAuthInterop.postOmnibarMessage(
      iframeEl,
      {
        messageType: 'refresh-user',
        token
      }
    );
  }

  BBAuth.clearTokenCache();

  BBAuth.getToken({
    disableRedirect: true,
    forceNewToken: true
  })
    .then(refreshUser)
    .catch(() => refreshUser(undefined));
}

function showInactivityCallback() {
  BBAuthInterop.postOmnibarMessage(
    iframeEl,
    {
      messageType: 'inactivity-show'
    }
  );
}

function hideInactivityCallback() {
  BBAuthInterop.postOmnibarMessage(
    iframeEl,
    {
      messageType: 'inactivity-hide'
    }
  );
}

function startActivityTracking() {
  BBOmnibarUserActivity.startTracking(
    refreshUserCallback,
    showInactivityCallback,
    hideInactivityCallback,
    omnibarConfig.allowAnonymous,
    currentLegacyKeepAliveUrl
  );
}

function handleGetToken(
  tokenRequestId: any,
  disableRedirect: boolean
) {
  BBAuth.getToken({
    disableRedirect
  })
    .then(
      (token: string) => {
        startActivityTracking();

        BBAuthInterop.postOmnibarMessage(
          iframeEl,
          {
            messageType: 'token',
            token,
            tokenRequestId
          }
        );
      },
      (reason: any) => {
        startActivityTracking();

        BBAuthInterop.postOmnibarMessage(
          iframeEl,
          {
            messageType: 'token-fail',
            reason,
            tokenRequestId
          }
        );
      }
    );
}

function handleHelp() {
  const BBHELP = (window as any).BBHELP;

  if (BBHELP) {
    BBHELP.HelpWidget.open();
  }
}

function handleNotificationRead(notification: BBOmnibarNotificationItem) {
  const notificationsConfig = omnibarConfig.notifications;

  if (notificationsConfig && notificationsConfig.onNotificationRead) {
    notificationsConfig.onNotificationRead(notification);
  }
}

function handleEnvironmentUpdate(name: string) {
  const bodyCls = 'sky-omnibar-environment-visible';
  const bodyClassList = document.body.classList;

  name = name || '';

  envEl.innerText = name;

  if (name) {
    bodyClassList.add(bodyCls);
  } else {
    bodyClassList.remove(bodyCls);
  }
}

function monkeyPatchState() {
  const oldPushState = history.pushState;
  const oldReplaceState = history.replaceState;

  function newPushState() {
    const result = oldPushState.apply(history, arguments);

    handleStateChange();

    return result;
  }

  function newReplaceState() {
    const result = oldReplaceState.apply(history, arguments);

    handleStateChange();

    return result;
  }

  history.pushState = newPushState;
  history.replaceState = newReplaceState;
}

function setupNotifications() {
  const notificationsConfig = omnibarConfig.notifications;

  if (notificationsConfig) {
    notificationsConfig.onReady({
      updateNotifications: (notifications) => {
        BBAuthInterop.postOmnibarMessage(
          iframeEl,
          {
            messageType: 'notifications-update',
            notifications
          }
        );
      }
    });
  }
}

function messageHandler(event: MessageEvent) {
  if (!BBAuthInterop.messageIsFromOmnibar(event)) {
    return;
  }

  const message = event.data;
  const nav = omnibarConfig.nav;

  switch (message.messageType) {
    case 'ready':
      // Notify the omnibar of the host page's origin.  This MUST be the first
      // message that is posted to the omnibar because all other messages will
      // be validated against the provided origin.  If the origin of the host page
      // does not match a whilelist of allowed origins maintained by the omnibar,
      // further communications between the omnibar and host will be blocked.
      BBAuthInterop.postOmnibarMessage(
        iframeEl,
        {
          messageType: 'host-ready'
        }
      );

      monkeyPatchState();

      BBAuthInterop.postOmnibarMessage(
        iframeEl,
        {
          enableHelp: omnibarConfig.enableHelp,
          envId: omnibarConfig.envId,
          leId: omnibarConfig.leId,
          localNavItems: nav && nav.localNavItems,
          localNotifications: !!omnibarConfig.notifications,
          localSearch: !!omnibarConfig.onSearch,
          messageType: 'nav-ready',
          services: nav && nav.services,
          svcId: omnibarConfig.svcId
        }
      );

      setupNotifications();

      handleStateChange();

      promiseResolve();
      break;
    case 'display-ready':
      placeholderEl.classList.remove(CLS_LOADING);
      iframeEl.classList.remove(CLS_LOADING);
      break;
    case 'expand':
      expandIframe();
      break;
    case 'collapse':
      collapseIframe();
      break;
    case 'navigate-url':
      BBAuthNavigator.navigate(message.url);
      break;
    case 'navigate':
      const navItem: BBOmnibarNavigationItem = message.navItem;

      if (!nav || !nav.beforeNavCallback || nav.beforeNavCallback(navItem) !== false) {
        BBAuthNavigator.navigate(navItem.url);
      }

      break;
    case 'search':
      handleSearch(message.searchArgs);
      break;
    case 'get-token':
      handleGetToken(
        message.tokenRequestId,
        message.disableRedirect
      );
      break;
    case 'help-open':
      handleHelp();
      break;
    case 'notification-read':
      handleNotificationRead(
        message.notification
      );
      break;
    case 'session-renew':
      BBOmnibarUserActivity.userRenewedSession();
      break;
    case 'environment-update':
      handleEnvironmentUpdate(message.name);
      break;
    case 'legacy-keep-alive-url-change':
      currentLegacyKeepAliveUrl = message.url;
      startActivityTracking();
      break;
  }
}

function buildOmnibarUrl() {
  const omnibarUrl = omnibarConfig.url ||
    /* istanbul ignore next */
    'https://host.nxt.blackbaud.com/omnibar/';

  return omnibarUrl;
}

export class BBOmnibar {
  public static load(config: BBOmnibarConfig): Promise<any> {
    omnibarConfig = omnibarConfig = config;

    // TODO: Deprecate this and only allow it to come from the legacy-keep-alive-url-change message
    // from the omnibar.
    currentLegacyKeepAliveUrl = omnibarConfig.legacyKeepAliveUrl;

    return new Promise<any>((resolve: any) => {
      promiseResolve = resolve;

      addStyleEl();
      addPlaceholderEl();

      // Add these in reverse order since each will be inserted at the top of the
      // document; this will ensure the proper order in the DOM.
      addEnvironmentEl();
      addIframeEl();

      window.addEventListener('message', messageHandler);
    });
  }

  public static destroy() {
    BBAuthDomUtility.removeCss(styleEl);

    BBAuthDomUtility.removeEl(placeholderEl);
    BBAuthDomUtility.removeEl(iframeEl);
    BBAuthDomUtility.removeEl(envEl);

    window.removeEventListener('message', messageHandler);

    omnibarConfig =
      styleEl =
      placeholderEl =
      iframeEl =
      envEl =
      promiseResolve =
      undefined;
  }
}
