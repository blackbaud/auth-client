//#region imports

import {
  BBAuth
} from '../auth/auth';

import {
  BBAuthDomUtility
} from '../shared/dom-utility';

import {
  BBAuthInterop
} from '../shared/interop';

import {
  BBOmnibarToastContainerInitArgs
} from './omnibar-toast-container-init-args';

//#endregion

const CLS_TOAST_CONTAINER = 'sky-omnibar-toast-container';
const CLS_TOAST_CONTAINER_READY = `${CLS_TOAST_CONTAINER}-ready`;
const CLS_TOAST_CONTAINER_EMPTY = `${CLS_TOAST_CONTAINER}-empty`;
const TOAST_CONTAINER_PADDING = 20;

let styleEl: HTMLStyleElement;
let iframeEl: HTMLIFrameElement;
let initPromise: Promise<void>;
let initResolve: () => void;
let initArgs: BBOmnibarToastContainerInitArgs;
let currentUrl: string;

function handleGetToken(
  tokenRequestId: any,
  disableRedirect: boolean
): void {
  BBAuth.getToken({
    disableRedirect
  })
    .then(
      (token: string) => {
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

function getContainerEl(): HTMLDivElement {
  /* istanbul ignore else */
  if (!iframeEl) {
    styleEl = BBAuthDomUtility.addCss(
`
.${CLS_TOAST_CONTAINER} {
  border: none;
  display: none;
  position: fixed;
  right: 0px;
  height: 0px;
  width: 300px;
  /* z-index is 1 less than omnibar so menus will display over top the toast container */
  z-index: 999;
}

.${CLS_TOAST_CONTAINER_READY} {
  display: block;
}

.${CLS_TOAST_CONTAINER_EMPTY} {
  visibility: hidden;
}
`
    );

    iframeEl = document.createElement('iframe');
    iframeEl.src = BBOmnibarToastContainer.CONTAINER_URL;
    iframeEl.className = `${CLS_TOAST_CONTAINER} ${CLS_TOAST_CONTAINER_EMPTY}`;
    iframeEl.title = 'Toast container';

    document.body.appendChild(iframeEl);

    window.addEventListener('message', messageHandler);
  }

  return iframeEl;
}

function getElHeight(selector: string): number {
  const el = document.querySelector(selector);

  if (el) {
    return el.getBoundingClientRect().height;
  }

  return 0;
}

function getOmnibarHeight(): number {
  return getElHeight('.sky-omnibar-iframe') + getElHeight('.sky-omnibar-environment');
}

function postLocationChangeMessage(): void {
  if (iframeEl) {
    BBAuthInterop.postOmnibarMessage(
      iframeEl,
      {
        href: currentUrl,
        messageType: 'location-change'
      }
    );
  }
}

function messageHandler(event: MessageEvent): void {
  if (!BBAuthInterop.messageIsFromToastContainer(event)) {
    return;
  }

  const message = event.data;

  switch (message.messageType) {
    case 'toast-ready':
      BBAuthInterop.postOmnibarMessage(
        iframeEl,
        {
          messageType: 'host-ready'
        }
      );

      // Even though the toast container doesn't care about omnibar navigation per se, it does need
      // the environment ID/legal entity ID/service ID values for analytics. Since the omnibar uses
      // the 'nav-ready' message type to post these values, use that same pattern here.
      BBAuthInterop.postOmnibarMessage(
        iframeEl,
        {
          envId: initArgs.envId,
          leId: initArgs.leId,
          messageType: 'nav-ready',
          svcId: initArgs.svcId
        }
      );

      postLocationChangeMessage();

      iframeEl.classList.add(CLS_TOAST_CONTAINER_READY);

      initResolve();
      break;
    case 'get-token':
      handleGetToken(
        message.tokenRequestId,
        message.disableRedirect
      );
      break;
    case 'navigate-url':
      initArgs.navigateUrlCallback(message.url);
      break;
    case 'navigate':
      initArgs.navigateCallback(message.navItem);
      break;
    case 'toast-container-change':
      if (message.height > 0) {
        iframeEl.style.height = message.height + 'px';
        iframeEl.style.top = (getOmnibarHeight() + TOAST_CONTAINER_PADDING) + 'px';

        iframeEl.classList.remove(CLS_TOAST_CONTAINER_EMPTY);
      } else {
        iframeEl.classList.add(CLS_TOAST_CONTAINER_EMPTY);
      }

      break;
    case 'push-notifications-open':
      initArgs.openMenuCallback();
      break;
  }
}

export class BBOmnibarToastContainer {

  public static readonly CONTAINER_URL = 'https://app.blackbaud.com/omnibar/toast';

  public static init(args: BBOmnibarToastContainerInitArgs): Promise<void> {
    initArgs = args;

    currentUrl = args.url;

    if (!initPromise) {
      initPromise = new Promise((resolve) => {
        initResolve = resolve;
        getContainerEl();
      });
    }

    return initPromise;
  }

  public static showNewNotifications(notifications: any): void {
    BBAuthInterop.postOmnibarMessage(
      iframeEl,
      {
        messageType: 'push-notifications-update',
        pushNotifications: notifications
      }
    );
  }

  public static updateUrl(url: string): void {
    currentUrl = url;

    postLocationChangeMessage();
  }

  public static destroy(): void {
    if (styleEl) {
      BBAuthDomUtility.removeCss(styleEl);
    }

    if (iframeEl) {
      BBAuthDomUtility.removeEl(iframeEl);
    }

    currentUrl =
      iframeEl =
      initArgs =
      initPromise =
      initResolve =
      styleEl =
      undefined;

    window.removeEventListener('message', messageHandler);
  }

}
