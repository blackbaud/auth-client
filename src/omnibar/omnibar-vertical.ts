import {
  BBAuthDomUtility
} from '../shared/dom-utility';

import {
  BBAuthInterop
} from '../shared/interop';

import {
  BBAuthNavigator
} from '../shared/navigator';

import {
  BBOmnibarConfig
} from './omnibar-config';

const CLS_EXPANDED = 'sky-omnibar-vertical-expanded';
const CLS_LOADING = 'sky-omnibar-vertical-loading';
const CLS_BODY = 'sky-omnibar-vertical-body';
const CLS_BODY_MINIMIZED = 'sky-omnibar-vertical-body-minimized';

const WIDTH_MAX = 300;
const WIDTH_MIN = 100;

let currentUrl: string;
let iframeEl: HTMLIFrameElement;
let iframeWrapperEl: HTMLDivElement;
let omnibarConfig: BBOmnibarConfig;
let promiseResolve: (value?: any) => void;
let styleEl: HTMLStyleElement;
let minimized: boolean;

function expandIframe(): void {
  iframeWrapperEl.classList.add(CLS_EXPANDED);
}

function collapseIframe(): void {
  iframeWrapperEl.classList.remove(CLS_EXPANDED);
}

function addIframeEl(afterEl: HTMLElement): void {
  const omnibarVerticalUrl = omnibarConfig.verticalUrl ||
    /* istanbul ignore next */
    'https://host.nxt.blackbaud.com/omnibar/vertical';

  iframeEl = BBAuthDomUtility.createIframe(
    omnibarVerticalUrl,
    `sky-omnibar-vertical-iframe`,
    'Vertical Navigation'
  );

  iframeWrapperEl = document.createElement('div');
  iframeWrapperEl.className = `sky-omnibar-vertical-iframe-wrapper ${CLS_LOADING}`;
  iframeWrapperEl.appendChild(iframeEl);

  afterEl.insertAdjacentElement('afterend', iframeWrapperEl);

  document.body.classList.add(CLS_BODY);
}

function addStyleEl(): void {
  styleEl = BBAuthDomUtility.addCss(`
.sky-omnibar-vertical-iframe-wrapper {
  position: fixed;
  top: 50px;
  left: 0;
  bottom: 0;
  box-shadow: 0px 2px 10px 0px rgba(0, 0, 0, 0.05);
  width: ${WIDTH_MAX}px;
  z-index: 999;
}

.sky-omnibar-vertical-iframe-wrapper.${CLS_LOADING} {
  border-right: solid 1px #e2e3e4;
}

.${CLS_BODY_MINIMIZED} .sky-omnibar-vertical-iframe-wrapper:not(.${CLS_EXPANDED}) {
  width: ${WIDTH_MIN}px;
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
    margin-left: ${WIDTH_MAX}px;
  }

  .${CLS_BODY_MINIMIZED} {
    margin-left: ${WIDTH_MIN}px;
  }
}

@media (max-width: 767px) {
  .sky-omnibar-vertical-iframe-wrapper {
    display: none;
  }
}
`
  );
}

function postLocationChangeMessage(): void {
  BBAuthInterop.postLocationChangeMessage(iframeEl, currentUrl);
}

function minimize(): void {
  minimized = true;
  document.body.classList.add(CLS_BODY_MINIMIZED);
}

function maximize(): void {
  minimized = false;
  document.body.classList.remove(CLS_BODY_MINIMIZED);
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
      BBAuthInterop.postOmnibarMessage(
        iframeEl,
        {
          messageType: 'host-ready'
        }
      );

      BBAuthInterop.postOmnibarMessage(
        iframeEl,
        {
          envId: omnibarConfig.envId,
          leId: omnibarConfig.leId,
          messageType: 'nav-ready',
          minimized,
          navVersion: omnibarConfig.navVersion,
          services: nav && nav.services,
          svcId: omnibarConfig.svcId,
          theme: omnibarConfig.theme
        }
      );

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
      BBAuthInterop.handleNavigate(
        omnibarConfig.nav,
        message.navItem
      );
      break;
    case 'get-token':
      BBAuthInterop.handleGetToken(
        iframeEl,
        message.tokenRequestId,
        message.disableRedirect
      );
      break;
    case 'maximize':
      maximize();
      break;
    case 'minimize':
      minimize();
      break;
  }
}

export class BBOmnibarVertical {

  public static async load(
    config: BBOmnibarConfig,
    afterEl: HTMLElement
  ): Promise<void> {
    omnibarConfig = config;

    return new Promise<any>((resolve) => {
      promiseResolve = resolve;

      addStyleEl();
      addIframeEl(afterEl);

      window.addEventListener('message', messageHandler);
    });
  }

  public static updateUrl(url: string): void {
    currentUrl = url;

    postLocationChangeMessage();
  }

  public static refreshUser(token: string): void {
    BBAuthInterop.postOmnibarMessage(
      iframeEl,
      {
        messageType: 'refresh-user',
        token
      }
    );
  }

  public static destroy(): void {
    BBAuthDomUtility.removeEl(iframeWrapperEl);

    BBAuthDomUtility.removeCss(styleEl);

    document.body.classList.remove(CLS_BODY);
    maximize();

    window.removeEventListener('message', messageHandler);

    currentUrl =
      iframeEl =
      iframeWrapperEl =
      minimized =
      omnibarConfig =
      promiseResolve =
      styleEl = undefined;
  }

}
