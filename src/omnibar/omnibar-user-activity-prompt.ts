//#region imports

import {
  BBAuthDomUtility
} from '../shared/dom-utility';

import {
  BBAuthInterop
} from '../shared/interop';

import {
  BBOmnibarUserActivityPromptShowArgs
} from './omnibar-user-activity-prompt-show-args';

//#endregion

let styleEl: HTMLStyleElement;
let iframeEl: HTMLIFrameElement;
let sessionRenewCallback: () => void;

function messageHandler(event: MessageEvent) {
  if (!BBAuthInterop.messageIsFromOmnibar(event)) {
    return;
  }

  const message = event.data;

  switch (message.messageType) {
    case 'ready':
      BBAuthInterop.postOmnibarMessage(
        iframeEl,
        {
          messageType: 'host-ready'
        }
      );

      iframeEl.classList.add('sky-omnibar-inactivity-iframe-ready');
      break;
    case 'session-renew':
      sessionRenewCallback();
      break;
  }
}

export class BBOmnibarUserActivityPrompt {

  public static url = 'https://host.nxt.blackbaud.com/omnibar/inactivity';

  public static show(args: BBOmnibarUserActivityPromptShowArgs) {
    function addStyleEl() {
      styleEl = BBAuthDomUtility.addCss(`
  .sky-omnibar-inactivity-iframe {
    background-color: transparent;
    border: none;
    position: fixed;
    top: 0;
    left: 0;
    height: 100%;
    width: 100%;
    z-index: 100000;
    visibility: hidden;
  }

  .sky-omnibar-inactivity-iframe-ready {
    visibility: visible;
  }
  `
      );
    }

    function addIframeEl() {
      const iframeUrl = BBOmnibarUserActivityPrompt.url;

      iframeEl = BBAuthDomUtility.addIframe(
        iframeUrl,
        'sky-omnibar-inactivity-iframe',
        'Inactivity Prompt'
      );
    }

    this.hide();

    sessionRenewCallback = args.sessionRenewCallback;

    addStyleEl();
    addIframeEl();

    window.addEventListener('message', messageHandler);
  }

  public static hide() {
    if (iframeEl) {
      BBAuthDomUtility.removeEl(iframeEl);

      BBAuthDomUtility.removeCss(styleEl);

      iframeEl =
        styleEl =
        sessionRenewCallback =
        undefined;

      window.removeEventListener('message', messageHandler);
    }
  }

}
