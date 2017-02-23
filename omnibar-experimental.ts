import { BBOmnibarConfig } from './omnibar-config';
import { BBOmnibarNavigationItem } from './omnibar-navigation-item';

export class BBOmnibarExperimental {
  public static load(config: BBOmnibarConfig): Promise<any> {
    const nav = config.nav;

    return new Promise<any>((resolve: any, reject: any) => {
      const CLS_EXPANDED = 'sky-omnibar-iframe-expanded';
      const CLS_LOADING = 'sky-omnibar-loading';

      const styleEl = document.createElement('style');
      styleEl.innerText = `
    body {
      margin-top: 50px;
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

      const placeholderEl = document.createElement('div');
      placeholderEl.className = `sky-omnibar-placeholder ${CLS_LOADING}`;

      document.body.appendChild(placeholderEl);

      const iframeEl = document.createElement('iframe');
      iframeEl.className = `sky-omnibar-iframe ${CLS_LOADING}`;
      iframeEl.src = 'https://sky.blackbaud-dev.com/omnibar/';

      document.body.appendChild(iframeEl);

      function expandIframe() {
        iframeEl.classList.add(CLS_EXPANDED);
      }

      function collapseIframe() {
        iframeEl.classList.remove(CLS_EXPANDED);
      }

      function myPostMessage(message: any) {
        message.source = 'auth-client';
        iframeEl.contentWindow.postMessage(message, '*');
      }

      function handleStateChange() {
        myPostMessage({
          messageType: 'location-change',
          href: document.location.href
        });
      }

      function monkeyPatchState() {
        let oldPushState = history.pushState;
        let oldReplaceState = history.replaceState;

        history.pushState = function () {
          let result = oldPushState.apply(history, arguments);

          handleStateChange();

          return result;
        };

        history.replaceState = function () {
          let result = oldReplaceState.apply(history, arguments);

          handleStateChange();

          return result;
        };
      }

      window.addEventListener('message', (event: MessageEvent) => {
        const message = event.data;

        if (message && message.source === 'skyux-spa-omnibar') {
          switch (message.messageType) {
            case 'ready':
              placeholderEl.classList.remove(CLS_LOADING);
              iframeEl.classList.remove(CLS_LOADING);

              iframeEl.contentWindow.postMessage(
                {
                  source: 'auth-client',
                  messageType: 'nav-ready',
                  localNavItems: nav && nav.localNavItems
                },
                '*'
              );

              monkeyPatchState();
              handleStateChange();

              resolve();
              break;
            case 'expand':
              expandIframe();
              break;
            case 'collapse':
              collapseIframe();
              break;
            case 'navigate-url':
              location.href = message.url;
              break;
            case 'navigate':
              const navItem: BBOmnibarNavigationItem = message.navItem;

              if (!nav.beforeNavCallback || nav.beforeNavCallback(navItem) !== false) {
                location.href = navItem.url;
              }

              break;
          }
        }
      });
    });
  }
}
