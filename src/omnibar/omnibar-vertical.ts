import { BBUserSettings } from '../user-settings/user-settings';

import { BBUserConfig } from '../user-settings/user-config';

import { BBAuthDomUtility } from '../shared/dom-utility';

import { BBAuthInterop } from '../shared/interop';

import { BBAuthNavigator } from '../shared/navigator';

import { BBOmnibarConfig } from './omnibar-config';

const CLS_EXPANDED = 'sky-omnibar-vertical-expanded';
const CLS_LOADING = 'sky-omnibar-vertical-loading';
const CLS_BODY = 'sky-omnibar-vertical-body';
const CLS_BODY_MINIMIZED = 'sky-omnibar-vertical-body-minimized';
const CLS_IFRAME_WRAPPER = 'sky-omnibar-vertical-iframe-wrapper';

const OMNBAR_VERTICAL_WIDTH_MAXIMIZED = 250;
const OMINIBAR_VERTICAL_WIDTH_MINIMIZED = 60;

const settingsUpdatesToIgnore = new Set<string>();

let currentSettings: BBUserConfig;
let currentUrl: string;
let currentCategory: string | undefined;
let iframeEl: HTMLIFrameElement;
let iframeWrapperEl: HTMLDivElement;
let omnibarConfig: BBOmnibarConfig;
let promiseResolve: (value?: unknown) => void;
let styleEl: HTMLStyleElement;
let windowMediaQuery: MediaQueryList;

function updateSize(): void {
  if (omnibarConfig.onResize) {
    let size = 0;

    const iFrameEl = document.querySelector(`.${CLS_IFRAME_WRAPPER}`);

    if (iFrameEl) {
      const wrapperStyle = getComputedStyle(iFrameEl);

      if (wrapperStyle.display !== 'none') {
        size = document.body.classList.contains(CLS_BODY_MINIMIZED)
          ? OMINIBAR_VERTICAL_WIDTH_MINIMIZED
          : OMNBAR_VERTICAL_WIDTH_MAXIMIZED;
      }
    }

    omnibarConfig.onResize({
      position: 'left',
      size,
    });
  }
}

function userSettingsMinimized(): boolean {
  return currentSettings?.omnibar?.vMin;
}

function expandIframe(): void {
  iframeWrapperEl.classList.add(CLS_EXPANDED);
}

function collapseIframe(): void {
  iframeWrapperEl.classList.remove(CLS_EXPANDED);
}

function addIframeEl(afterEl: HTMLElement): void {
  if (userSettingsMinimized()) {
    minimize();
  }

  const omnibarVerticalUrl =
    omnibarConfig.verticalUrl ||
    /* istanbul ignore next */
    'https://host.nxt.blackbaud.com/omnibar/vertical';

  iframeEl = BBAuthDomUtility.createIframe(
    omnibarVerticalUrl,
    `sky-omnibar-vertical-iframe`,
    'Vertical Navigation'
  );

  iframeWrapperEl = document.createElement('div');
  iframeWrapperEl.className = `${CLS_IFRAME_WRAPPER} ${CLS_LOADING}`;
  iframeWrapperEl.appendChild(iframeEl);

  afterEl.insertAdjacentElement('afterend', iframeWrapperEl);

  document.body.classList.add(CLS_BODY);
}

function addStyleEl(): void {
  styleEl = BBAuthDomUtility.addCss(`
.${CLS_IFRAME_WRAPPER} {
  position: fixed;
  top: 50px;
  left: 0;
  bottom: 0;
  box-shadow: 0px 2px 10px 0px rgba(0, 0, 0, 0.05);
  width: ${OMNBAR_VERTICAL_WIDTH_MAXIMIZED}px;
  z-index: 999;
}

.${CLS_IFRAME_WRAPPER}.${CLS_LOADING} {
  border-right: solid 1px #e2e3e4;
}

.${CLS_BODY_MINIMIZED} .${CLS_IFRAME_WRAPPER}:not(.${CLS_EXPANDED}) {
  width: ${OMINIBAR_VERTICAL_WIDTH_MINIMIZED}px;
}

.sky-omnibar-vertical-iframe {
  border: none;
  height: 100%;
  width: 100%;
}

.${CLS_LOADING} .sky-omnibar-vertical-iframe {
  visibility: hidden;
}

.${CLS_EXPANDED} {
  width: 100%;
}

@media (min-width: 768px) {
  .${CLS_BODY} {
    margin-left: ${OMNBAR_VERTICAL_WIDTH_MAXIMIZED}px;
  }

  .${CLS_BODY_MINIMIZED} {
    margin-left: ${OMINIBAR_VERTICAL_WIDTH_MINIMIZED}px;
  }
}

@media (max-width: 767px) {
  .${CLS_IFRAME_WRAPPER} {
    display: none;
  }
}
`);
}

function windowMediaQueryChange(): void {
  updateSize();
}

function addWindowMediaListener(): void {
  if (omnibarConfig.onResize) {
    windowMediaQuery = window.matchMedia('max-width: 767px');
    windowMediaQuery.addEventListener('change', windowMediaQueryChange);
  }
}

function removeWindowMediaListener(): void {
  if (windowMediaQuery) {
    windowMediaQuery.removeEventListener('change', windowMediaQueryChange);
    windowMediaQuery = undefined;
  }
}

function postLocationChangeMessage(): void {
  BBAuthInterop.postLocationChangeMessage(
    iframeEl,
    currentUrl,
    currentCategory
  );
}

function minimize(): void {
  document.body.classList.add(CLS_BODY_MINIMIZED);
  updateSize();
}

function maximize(): void {
  document.body.classList.remove(CLS_BODY_MINIMIZED);
}

function updateMinimized(
  verticalNavMinimized: boolean,
  updateSettings: boolean
): void {
  if (updateSettings) {
    const correlationId = Date.now().toString();

    // Ignore the custom message from the notifications service indicating this change has
    // taken place.
    settingsUpdatesToIgnore.add(correlationId);

    BBUserSettings.updateSettings(correlationId, {
      omnibar: {
        vMin: verticalNavMinimized,
      },
    });
  }

  if (verticalNavMinimized) {
    minimize();
  } else {
    maximize();
  }

  updateSize();
}

function messageHandler(event: MessageEvent): void {
  const message = event.data;

  if (!BBAuthInterop.messageIsFromOmnibarVertical(event)) {
    return;
  }

  const nav = omnibarConfig.nav;

  switch (message.messageType) {
    case 'ready':
      // Notify the omnibar of the host page's origin.  This MUST be the first
      // message that is posted to the omnibar because all other messages will
      // be validated against the provided origin.  If the origin of the host page
      // does not match a whilelist of allowed origins maintained by the omnibar,
      // further communications between the omnibar and host will be blocked.
      BBAuthInterop.postOmnibarMessage(iframeEl, {
        messageType: 'host-ready',
      });

      BBAuthInterop.postOmnibarMessage(iframeEl, {
        envId: omnibarConfig.envId,
        leId: omnibarConfig.leId,
        messageType: 'nav-ready',
        minimized: userSettingsMinimized(),
        navVersion: omnibarConfig.navVersion,
        services: nav && nav.services,
        svcId: omnibarConfig.svcId,
        theme: omnibarConfig.theme,
        widthMinimized: OMINIBAR_VERTICAL_WIDTH_MINIMIZED,
        widthMaximized: OMNBAR_VERTICAL_WIDTH_MAXIMIZED,
      });

      postLocationChangeMessage();

      promiseResolve();
      break;
    case 'display-ready':
      iframeWrapperEl.classList.remove(CLS_LOADING);
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
      BBAuthInterop.handleNavigate(omnibarConfig.nav, message.navItem);
      break;
    case 'get-token':
      BBAuthInterop.handleGetToken(
        iframeEl,
        message.tokenRequestId,
        message.disableRedirect
      );
      break;
    case 'maximize':
      updateMinimized(false, true);
      break;
    case 'minimize':
      updateMinimized(true, true);
      break;
  }
}

export class BBOmnibarVertical {
  public static async load(
    config: BBOmnibarConfig,
    afterEl: HTMLElement
  ): Promise<void> {
    omnibarConfig = config;

    return new Promise<void>(async (resolve) => {
      promiseResolve = resolve;

      addStyleEl();

      try {
        currentSettings = await BBUserSettings.getSettings();
      } catch (err) {
        /* Let currentSettings remain undefined */
      }

      addWindowMediaListener();
      addIframeEl(afterEl);
      updateSize();

      window.addEventListener('message', messageHandler);
    });
  }

  public static updateUrl(url: string, category?: string): void {
    currentUrl = url;
    currentCategory = category;

    postLocationChangeMessage();
  }

  public static refreshUser(token: string): void {
    BBAuthInterop.postOmnibarMessage(iframeEl, {
      messageType: 'refresh-user',
      token,
    });
  }

  public static async refreshSettings(correlationId: string): Promise<void> {
    // Ensure we're not responding to our own settings update.
    if (settingsUpdatesToIgnore.has(correlationId)) {
      settingsUpdatesToIgnore.delete(correlationId);
    } else {
      currentSettings = await BBUserSettings.getSettings();

      updateMinimized(currentSettings?.omnibar?.vMin, false);

      BBAuthInterop.postOmnibarMessage(iframeEl, {
        messageType: 'update-vertical',
        updateArgs: {
          minimized: currentSettings?.omnibar?.vMin,
        },
      });
    }
  }

  public static destroy(): void {
    BBAuthDomUtility.removeEl(iframeWrapperEl);

    BBAuthDomUtility.removeCss(styleEl);

    document.body.classList.remove(CLS_BODY);
    maximize();

    window.removeEventListener('message', messageHandler);

    removeWindowMediaListener();

    settingsUpdatesToIgnore.clear();

    currentSettings =
      currentUrl =
      iframeEl =
      iframeWrapperEl =
      omnibarConfig =
      promiseResolve =
      styleEl =
        undefined;
  }
}
