import * as jwtDecode from 'jwt-decode';

import {
  BBAuth
} from '../auth';

import {
  BBAuthInterop
} from '../shared/interop';

import {
  BBAuthNavigator
} from '../shared/navigator';

import {
  BBAuthDomUtility
} from '../shared/dom-utility';

import {
  BBOmnibarConfig
} from './omnibar-config';

import {
  BBOmnibarNavigationItem
} from './omnibar-navigation-item';

import {
  BBOmnibarNotificationItem
} from './omnibar-notification-item';

import {
  BBOmnibarSearchArgs
} from './omnibar-search-args';

import {
  BBOmnibarSetTitleArgs
} from './omnibar-set-title-args';

import {
  BBOmnibarUserActivity
} from './omnibar-user-activity';

import {
  BBOmnibarUserActivityPrompt
} from './omnibar-user-activity-prompt';

import {
  BBOmnibarUpdateArgs
} from './omnibar-update-args';

import {
  BBOmnibarPushNotifications
} from './omnibar-push-notifications';

import {
  BBOmnibarToastContainer
} from './omnibar-toast-container';

import {
  BBOmnibarThemeAccent
} from './theming';

const CLS_EXPANDED = 'sky-omnibar-iframe-expanded';
const CLS_LOADING = 'sky-omnibar-loading';

const notificationSvcIds: {
  [key: string]: {
    requiresNotif: boolean
  }
} = {
  fenxt: {
    requiresNotif: true
  },
  renxt: {
    requiresNotif: true
  },
  skydev: {
    requiresNotif: false
  },
  skydevhome: {
    requiresNotif: false
  },
  skyux: {
    requiresNotif: false
  }
};

let envEl: HTMLDivElement;
let envNameEl: HTMLDivElement;
let envInfoEl: HTMLDivElement;
let placeholderEl: HTMLDivElement;
let styleEl: HTMLStyleElement;
let iframeEl: HTMLIFrameElement;
let omnibarConfig: BBOmnibarConfig;
let currentLegacyKeepAliveUrl: string;
let promiseResolve: () => void;
let pushNotificationsConnected: boolean;
let unreadNotificationCount: number;
let serviceName: string;
let currentTitleParts: string[];

function addIframeEl(): void {
  iframeEl = BBAuthDomUtility.addIframe(
    buildOmnibarUrl(),
    `sky-omnibar-iframe ${CLS_LOADING}`,
    'Navigation'
  );
}

function addEnvironmentEl(): void {
  envEl = document.createElement('div');
  envEl.className = 'sky-omnibar-environment';

  envInfoEl = document.createElement('div');
  envInfoEl.className = 'sky-omnibar-environment-info';
  envEl.appendChild(envInfoEl);

  envNameEl = document.createElement('div');
  envNameEl.className = 'sky-omnibar-environment-name';
  envEl.appendChild(envNameEl);

  BBAuthDomUtility.addElToBodyTop(envEl);
}

function collapseIframe(): void {
  iframeEl.classList.remove(CLS_EXPANDED);
}

function addStyleEl(): void {
  let accentCss = 'background: linear-gradient(to right, #71bf44 0, #31b986 50%, #00b2ec 100%);';
  let backgroundColor = '#4d5259';

  const theme = omnibarConfig.theme;

  if (theme) {
    const accent = theme.accent;

    backgroundColor = theme.backgroundColor || backgroundColor;

    // Explicitly check for false here since undefined represents the default
    // behavior of showing the accent with the default color.
    if (accent === false) {
      accentCss = 'display: none;';
    } else if (accent && (accent as BBOmnibarThemeAccent).color) {
      accentCss = `background-color: ${(accent as BBOmnibarThemeAccent).color};`;
    }
  }

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
  background-color: ${backgroundColor};
  display: none;
}

.sky-omnibar-placeholder-accent {
  height: 5px;
  ${accentCss}
}

.sky-omnibar-placeholder.${CLS_LOADING} {
  display: block;
}

.sky-omnibar-iframe.${CLS_LOADING} {
  visibility: hidden;
}

.${CLS_EXPANDED} {
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
  position: relative;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sky-omnibar-environment-info {
  float: right;
  padding-left: 15px;
  font-weight: bold;
}

.sky-omnibar-environment-name {
  float: right;
}

.sky-omnibar-environment-additional-info {
  background-color: #ffeccf;
  border-bottom: 2px solid #fbb034
}

.sky-omnibar-environment-visible .sky-omnibar-environment {
  height: 24px;
}
`
  );
}

function addPlaceholderEl(): void {
  placeholderEl = document.createElement('div');
  placeholderEl.className = `sky-omnibar-placeholder ${CLS_LOADING}`;
  placeholderEl.innerHTML = `<div class="sky-omnibar-placeholder-accent"></div>`;

  document.body.appendChild(placeholderEl);
}

function expandIframe(): void {
  iframeEl.classList.add(CLS_EXPANDED);
}

function handleStateChange(): void {
  const url = document.location.href;

  BBAuthInterop.postOmnibarMessage(
    iframeEl,
    {
      href: url,
      messageType: 'location-change'
    }
  );

  BBOmnibarToastContainer.updateUrl(url);
}

function handleSearch(searchArgs: BBOmnibarSearchArgs): void {
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

function openPushNotificationsMenu(): void {
  BBAuthInterop.postOmnibarMessage(
    iframeEl,
    {
      messageType: 'push-notifications-open'
    }
  );
}

function connectPushNotifications(): void {
  if (!pushNotificationsConnected) {
    pushNotificationsConnected = true;

    BBOmnibar.pushNotificationsEnabled()
      .then((enabled) => {
        if (enabled) {
          BBOmnibarToastContainer.init({
            envId: omnibarConfig.envId,
            leId: omnibarConfig.leId,
            navigateCallback: handleNavigate,
            navigateUrlCallback: handleNavigateUrl,
            openMenuCallback: openPushNotificationsMenu,
            svcId: omnibarConfig.svcId,
            url: document.location.href
          })
            .then(() => {
              BBOmnibarPushNotifications.connect(
                omnibarConfig.leId,
                omnibarConfig.envId,
                (notifications) => {
                  BBAuthInterop.postOmnibarMessage(
                    iframeEl,
                    {
                      messageType: 'push-notifications-update',
                      pushNotifications: notifications
                    }
                  );

                  BBOmnibarToastContainer.showNewNotifications(notifications);

                  unreadNotificationCount = notifications &&
                    notifications.notifications &&
                    notifications.notifications.filter((notification: any) => !notification.isRead).length;

                  updateTitle();
                });
              });
        } else {
          pushNotificationsConnected = false;
        }
      });
  }
}

function disconnectPushNotifications(): void {
  if (pushNotificationsConnected) {
    BBOmnibarToastContainer.destroy();
    BBOmnibarPushNotifications.disconnect();

    pushNotificationsConnected = false;
  }
}

function refreshUserCallback(): void {
  function refreshUser(token: string) {
    BBAuthInterop.postOmnibarMessage(
      iframeEl,
      {
        messageType: 'refresh-user',
        token
      }
    );

    if (token) {
      connectPushNotifications();
    } else {
      disconnectPushNotifications();
    }
  }

  BBAuth.clearTokenCache();

  BBAuth.getToken({
    disableRedirect: true,
    forceNewToken: true
  })
    .then(refreshUser)
    .catch(() => refreshUser(undefined));
}

function showInactivityCallback(): void {
  BBOmnibarUserActivityPrompt.show({
    sessionRenewCallback: () => {
      BBOmnibarUserActivity.userRenewedSession();
    }
  });
}

function hideInactivityCallback(): void {
  BBOmnibarUserActivityPrompt.hide();
}

function startActivityTracking(): void {
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
): void {
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

function handleHelp(): void {
  const BBHELP = (window as any).BBHELP;

  if (BBHELP) {
    BBHELP.HelpWidget.open();
  }
}

function handleNotificationRead(notification: BBOmnibarNotificationItem): void {
  const notificationsConfig = omnibarConfig.notifications;

  if (notificationsConfig && notificationsConfig.onNotificationRead) {
    notificationsConfig.onNotificationRead(notification);
  }
}

function handlePushNotificationsChange(notifications: any[]): void {
  BBOmnibarPushNotifications.updateNotifications(notifications);
}

function handleEnvironmentUpdate(
  name: string,
  additionalInfo: string,
  url: string,
): void {
  const bodyCls = 'sky-omnibar-environment-visible';
  const addInfoCls = 'sky-omnibar-environment-additional-info';
  const bodyClassList = document.body.classList;

  name = name || '';

  envNameEl.innerText = name;

  if (name) {
    bodyClassList.add(bodyCls);

    if (additionalInfo) {
      envEl.classList.add(addInfoCls);

      if (url) {
        const a = document.createElement('a');
        a.href = url;
        a.innerText = additionalInfo;
        envInfoEl.appendChild(a);
      } else {
        envInfoEl.innerText = additionalInfo;
      }      
    } else {
      envEl.classList.remove(addInfoCls);
    }
  } else {
    bodyClassList.remove(bodyCls);
  }
}

function handleNavigate(navItem: BBOmnibarNavigationItem): void {
  const nav = omnibarConfig.nav;

  if (!nav || !nav.beforeNavCallback || nav.beforeNavCallback(navItem) !== false) {
    BBAuthNavigator.navigate(navItem.url);
  }
}

function handleNavigateUrl(url: string): void {
  BBAuthNavigator.navigate(url);
}

function monkeyPatchState(): void {
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

function initLocalNotifications(): void {
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

function messageHandler(event: MessageEvent): void {
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
          compactNavOnly: omnibarConfig.compactNavOnly,
          enableHelp: omnibarConfig.enableHelp,
          envId: omnibarConfig.envId,
          hideResourceLinks: omnibarConfig.hideResourceLinks,
          leId: omnibarConfig.leId,
          localNavItems: nav && nav.localNavItems,
          localNotifications: !!omnibarConfig.notifications,
          localSearch: !!omnibarConfig.onSearch,
          messageType: 'nav-ready',
          navVersion: omnibarConfig.navVersion,
          services: nav && nav.services,
          svcId: omnibarConfig.svcId,
          theme: omnibarConfig.theme
        }
      );

      initLocalNotifications();
      connectPushNotifications();

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
      handleNavigateUrl(message.url);
      break;
    case 'navigate':
      handleNavigate(message.navItem);
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
    case 'push-notifications-change':
      handlePushNotificationsChange(message.notifications);
      break;
    case 'session-renew':
      BBOmnibarUserActivity.userRenewedSession();
      break;
    case 'environment-update':
      handleEnvironmentUpdate(message.name, message.additionalInfo, message.url);
      break;
    case 'legacy-keep-alive-url-change':
      currentLegacyKeepAliveUrl = message.url;
      startActivityTracking();
      break;

    case 'selected-service-update':
      serviceName = message.serviceName;
      updateTitle();
  }
}

function buildOmnibarUrl(): string {
  const omnibarUrl = omnibarConfig.url ||
    /* istanbul ignore next */
    'https://host.nxt.blackbaud.com/omnibar/';

  return omnibarUrl;
}

function updateTitle(): void {
  if (currentTitleParts) {
    const titleParts = currentTitleParts.slice();

    if (serviceName) {
      titleParts.push(serviceName);
    }

    let title = titleParts.join(' - ');

    if (unreadNotificationCount) {
      title = `(${unreadNotificationCount}) ${title}`;
    }

    document.title = title;
  }
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

  public static update(args: BBOmnibarUpdateArgs): void {
    BBAuthInterop.postOmnibarMessage(
      iframeEl,
      {
        messageType: 'update',
        updateArgs: args
      }
    );
  }

  public static setTitle(args: BBOmnibarSetTitleArgs): void {
    currentTitleParts = args && args.titleParts;
    updateTitle();
  }

  public static async pushNotificationsEnabled(): Promise<boolean> {
    if (!omnibarConfig) {
      return Promise.resolve(false);
    }

    if (notificationSvcIds[omnibarConfig.svcId]) {
      if (notificationSvcIds[omnibarConfig.svcId].requiresNotif) {
        return BBAuth.getToken({
          disableRedirect: true,
          envId: omnibarConfig.envId,
          leId: omnibarConfig.leId,
          permissionScope: 'Notifications'
        }).then(
          (token) => {
            const decodedToken: any = jwtDecode(token);
            let entitlements: string | string[] = decodedToken['1bb.entitlements'];

            if (entitlements) {
              entitlements = Array.isArray(entitlements) ? entitlements : [entitlements];
              return (entitlements as string[]).indexOf('notif') > -1;
            }

            return false;
          }
        ).catch(() => {
          return false;
        });
      } else {
        return Promise.resolve(true);
      }
    }

    return Promise.resolve(false);
  }

  public static destroy(): void {
    BBOmnibarToastContainer.destroy();
    BBOmnibarPushNotifications.disconnect();

    BBAuthDomUtility.removeEl(placeholderEl);
    BBAuthDomUtility.removeEl(iframeEl);
    BBAuthDomUtility.removeEl(envEl);

    BBAuthDomUtility.removeCss(styleEl);

    window.removeEventListener('message', messageHandler);

    omnibarConfig =
      styleEl =
      placeholderEl =
      iframeEl =
      envEl =
      envInfoEl =
      envNameEl =
      promiseResolve =
      pushNotificationsConnected =
      unreadNotificationCount =
      currentTitleParts =
      serviceName =
      undefined;
  }
}
