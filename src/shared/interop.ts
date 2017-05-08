const HOST_ORIGIN = 'https://host.nxt.blackbaud.com';

export class BBAuthInterop {
  /* istanbul ignore next */
  public static postOmnibarMessage(iframeEl: HTMLIFrameElement, message: any) {
    message.source = 'auth-client';
    iframeEl.contentWindow.postMessage(message, HOST_ORIGIN);
  }

  public static messageIsFromOmnibar(event: {origin: string, data: any}): boolean {
    if (event.origin === HOST_ORIGIN) {
      const message = event.data;
      return !!message && message.source === 'skyux-spa-omnibar';
    }

    return false;
  }
}
