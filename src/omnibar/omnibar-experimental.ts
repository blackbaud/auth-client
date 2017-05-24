import { BBAuth } from '../auth';
import { BBAuthInterop } from '../shared/interop';
import { BBOmnibarConfig } from './omnibar-config';
import { BBOmnibarNavigationItem } from './omnibar-navigation-item';
import { BBOmnibarSearchArgs } from './omnibar-search-args';

import { BBOmnibarUserActivity } from './omnibar-user-activity';

import { BBAuthNavigator } from '../shared/navigator';

const CLS_EXPANDED = 'sky-omnibar-iframe-expanded';
const CLS_LOADING = 'sky-omnibar-loading';

let placeholderEl: HTMLDivElement;
let styleEl: HTMLStyleElement;
let iframeEl: HTMLIFrameElement;
let omnibarConfig: BBOmnibarConfig;
let promiseResolve: () => void;

function addIframeEl() {
  iframeEl = document.createElement('iframe');
  iframeEl.className = `sky-omnibar-iframe ${CLS_LOADING}`;
  iframeEl.src = buildOmnibarUrl();

  document.body.appendChild(iframeEl);
}

function collapseIframe() {
  iframeEl.classList.remove(CLS_EXPANDED);
}

function addStyleEl() {
  styleEl = document.createElement('style');
  styleEl.innerText = `
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
  `;

  document.head.appendChild(styleEl);
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
  BBAuth.getToken(true).then((token: string) => {
    BBAuthInterop.postOmnibarMessage(
      iframeEl,
      {
        messageType: 'refresh-user',
        token
      }
    );
  });
}

function handleGetToken(tokenRequestId: any, disableRedirect: boolean) {
  BBAuth.getToken(false, disableRedirect)
    .then((token: string) => {
      BBOmnibarUserActivity.startTracking(refreshUserCallback);

      BBAuthInterop.postOmnibarMessage(
        iframeEl,
        {
          messageType: 'token',
          token,
          tokenRequestId
        }
      );
    })
    .catch((reason: any) => {
      BBAuthInterop.postOmnibarMessage(
        iframeEl,
        {
          messageType: 'token-fail',
          reason,
          tokenRequestId
        }
      );
    });
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

      placeholderEl.classList.remove(CLS_LOADING);
      iframeEl.classList.remove(CLS_LOADING);

      BBAuthInterop.postOmnibarMessage(
        iframeEl,
        {
          enableHelp: omnibarConfig.enableHelp,
          envId: omnibarConfig.envId,
          localNavItems: nav && nav.localNavItems,
          messageType: 'nav-ready',
          services: nav && nav.services,
          svcId: omnibarConfig.svcId
        }
      );

      handleStateChange();

      promiseResolve();
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
  }
}

function buildOmnibarUrl() {
  const omnibarUrl = omnibarConfig.url ||
    /* istanbul ignore next */
    'https://host.nxt.blackbaud.com/omnibar/';

  return omnibarUrl;
}

export class BBOmnibarExperimental {
  public static load(config: BBOmnibarConfig): Promise<any> {
    omnibarConfig = omnibarConfig = config;

    return new Promise<any>((resolve: any) => {
      promiseResolve = resolve;

      addStyleEl();
      addPlaceholderEl();
      addIframeEl();

      window.addEventListener('message', messageHandler);
    });
  }

  public static destroy() {
    document.head.removeChild(styleEl);

    document.body.removeChild(placeholderEl);
    document.body.removeChild(iframeEl);

    window.removeEventListener('message', messageHandler);

    omnibarConfig = undefined;

    styleEl = undefined;
    placeholderEl = undefined;
    iframeEl = undefined;
    promiseResolve = undefined;
  }
}
