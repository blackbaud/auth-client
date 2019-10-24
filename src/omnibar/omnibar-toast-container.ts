//#region imports

import {
  BBAuthDomUtility
} from '../shared/dom-utility';

import {
  BBAuthInterop
} from '../shared/interop';

//#endregion

const CLS_TOAST_CONTAINER = 'sky-omnibar-toast-container';
const CLS_TOAST_CONTAINER_READY = `${CLS_TOAST_CONTAINER}-ready`;
const CLS_TOAST_CONTAINER_EMPTY = `${CLS_TOAST_CONTAINER}-empty`;

let styleEl: HTMLStyleElement;
let iframeEl: HTMLIFrameElement;
let initPromise: Promise<void>;
let initResolve: () => void;
let currentOpenMenuCallback: () => void;

function getContainerEl(): HTMLDivElement {
  /* istanbul ignore else */
  if (!iframeEl) {
    styleEl = BBAuthDomUtility.addCss(
`
.${CLS_TOAST_CONTAINER} {
  border: none;
  display: none;
  position: fixed;
  bottom: 0px;
  right: 0px;
  height: 0px;
  width: 300px;
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

function messageHandler(event: MessageEvent): void {
  if (!BBAuthInterop.messageIsFromOmnibar(event)) {
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

      iframeEl.classList.add(CLS_TOAST_CONTAINER_READY);

      initResolve();
      break;
    case 'toast-container-change':
      if (message.height > 0) {
        iframeEl.style.height = message.height + 'px';
        iframeEl.classList.remove(CLS_TOAST_CONTAINER_EMPTY);
      } else {
        iframeEl.classList.add(CLS_TOAST_CONTAINER_EMPTY);
      }

      break;
    case 'push-notifications-open':
      currentOpenMenuCallback();
      break;
  }
}

export class BBOmnibarToastContainer {

  public static readonly CONTAINER_URL = 'https://host.nxt.blackbaud.com/omnibar/toast';

  public static init(openMenuCallback: () => void): Promise<void> {
    currentOpenMenuCallback = openMenuCallback;

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

  public static destroy(): void {
    if (styleEl) {
      BBAuthDomUtility.removeCss(styleEl);
    }

    if (iframeEl) {
      BBAuthDomUtility.removeEl(iframeEl);
    }

    currentOpenMenuCallback =
      iframeEl =
      initPromise =
      initResolve =
      styleEl =
      undefined;

    window.removeEventListener('message', messageHandler);
  }

}
