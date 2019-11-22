const HOST_ORIGIN = 'https://host.nxt.blackbaud.com';

function messageIsFromSource(event: {origin: string, data: any}, source: string): boolean {
  if (event.origin === HOST_ORIGIN) {
    const message = event.data;
    return !!message && message.source === source;
  }

  return false;
}

export class BBAuthInterop {
  /* istanbul ignore next */
  public static postOmnibarMessage(iframeEl: HTMLIFrameElement, message: any, origin?: string): void {
    message.source = 'auth-client';
    iframeEl.contentWindow.postMessage(message, origin || HOST_ORIGIN);
  }

  public static messageIsFromOmnibar(event: {origin: string, data: any}): boolean {
    return messageIsFromSource(event, 'skyux-spa-omnibar');
  }

  public static messageIsFromToastContainer(event: {origin: string, data: any}): boolean {
    return messageIsFromSource(event, 'skyux-spa-omnibar-toast-container');
  }
}
