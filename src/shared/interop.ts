import { BBAuth } from '../auth';

import { BBOmnibarNavigation, BBOmnibarNavigationItem } from '../omnibar';

import { BBAuthNavigator } from './navigator';

const HOST_ORIGIN = 'https://host.nxt.blackbaud.com';

type messageData = { source: string };

function messageIsFromSource(
  event: { origin: string; data: messageData },
  source: string
): boolean {
  if (event.origin === HOST_ORIGIN) {
    const message = event.data;
    return !!message && message.source === source;
  }

  return false;
}

export class BBAuthInterop {
  /* istanbul ignore next */
  public static postOmnibarMessage(
    iframeEl: HTMLIFrameElement,
    message: unknown,
    origin?: string
  ): void {
    (message as messageData).source = 'auth-client';
    iframeEl.contentWindow.postMessage(message, origin || HOST_ORIGIN);
  }

  public static messageIsFromOmnibar(event: {
    origin: string;
    data: messageData;
  }): boolean {
    return messageIsFromSource(event, 'skyux-spa-omnibar');
  }

  public static messageIsFromOmnibarVertical(event: {
    origin: string;
    data: messageData;
  }): boolean {
    return messageIsFromSource(event, 'skyux-spa-omnibar-vertical');
  }

  public static messageIsFromToastContainer(event: {
    origin: string;
    data: messageData;
  }): boolean {
    return messageIsFromSource(event, 'skyux-spa-omnibar-toast-container');
  }

  public static handleGetToken(
    iframeEl: HTMLIFrameElement,
    tokenRequestId: string,
    disableRedirect: boolean,
    completeCb?: () => void
  ): Promise<void> {
    return BBAuth.getToken({
      disableRedirect,
    }).then(
      (token) => {
        if (completeCb) {
          completeCb();
        }

        this.postOmnibarMessage(iframeEl, {
          messageType: 'token',
          token,
          tokenRequestId,
        });
      },
      (reason) => {
        if (completeCb) {
          completeCb();
        }

        this.postOmnibarMessage(iframeEl, {
          messageType: 'token-fail',
          reason,
          tokenRequestId,
        });
      }
    );
  }

  public static postLocationChangeMessage(
    iframeEl: HTMLIFrameElement,
    url: string,
    category?: string
  ): void {
    if (iframeEl) {
      BBAuthInterop.postOmnibarMessage(iframeEl, {
        href: url,
        category,
        messageType: 'location-change',
      });
    }
  }

  public static handleNavigate(
    nav: BBOmnibarNavigation,
    navItem: BBOmnibarNavigationItem
  ): void {
    if (
      !nav ||
      !nav.beforeNavCallback ||
      nav.beforeNavCallback(navItem) !== false
    ) {
      BBAuthNavigator.navigate(navItem.url);
    }
  }

  public static getCurrentUrl(): string {
    return document.location.href;
  }

  public static getCurrentPath(): string {
    return document.location.pathname;
  }
}
