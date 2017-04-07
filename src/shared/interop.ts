/* istanbul ignore next */
export class BBAuthInterop {

  public static navigate(url: string) {
    location.href = url;
  }

  public static postOmnibarMessage(iframeEl: HTMLIFrameElement, message: any) {
    message.source = 'auth-client';
    iframeEl.contentWindow.postMessage(message, '*');
  }

}
