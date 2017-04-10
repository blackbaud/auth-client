import { BBAuthInterop } from '../shared/interop';
import { BBOmnibarConfig } from './omnibar-config';
import { BBOmnibarNavigationItem } from './omnibar-navigation-item';

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
  styleEl.innerText = require('raw-loader!./omnibar-styles.css');

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
  const message = event.data;
  const nav = omnibarConfig.nav;

  if (message && message.source === 'skyux-spa-omnibar') {
    switch (message.messageType) {
      case 'ready':
        monkeyPatchState();

        placeholderEl.classList.remove(CLS_LOADING);
        iframeEl.classList.remove(CLS_LOADING);

        BBAuthInterop.postOmnibarMessage(
          iframeEl,
          {
            localNavItems: nav && nav.localNavItems,
            messageType: 'nav-ready'
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
        BBAuthInterop.navigate(message.url);
        break;
      case 'navigate':
        const navItem: BBOmnibarNavigationItem = message.navItem;

        if (!nav || !nav.beforeNavCallback || nav.beforeNavCallback(navItem) !== false) {
          BBAuthInterop.navigate(navItem.url);
        }

        break;
    }
  }
}

function buildOmnibarUrl() {
  const qs: string[] = [];

  let omnibarUrl = omnibarConfig.url ||
    /* istanbul ignore next */
    'https://host.nxt.blackbaud.com/omnibar/';

  if (omnibarConfig.svcId) {
    qs.push('svcid=' + encodeURIComponent(omnibarConfig.svcId));
  }

  if (omnibarConfig.envId) {
    qs.push('envid=' + encodeURIComponent(omnibarConfig.envId));
  }

  if (qs.length) {
    omnibarUrl += '?' + qs.join('&');
  }

  return omnibarUrl;
}

export class BBOmnibarExperimental {
  public static load(config: BBOmnibarConfig): Promise<any> {
    omnibarConfig = omnibarConfig = config;

    return new Promise<any>((resolve: any, reject: any) => {
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
