export class BBOmnibar {
  public static load(userToken: string): Promise<any> {
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

      window.addEventListener('message', function (event) {
        const message = event.data;

        if (message && message.source === 'skyux-spa-omnibar') {
          switch (message.messageType) {
            case 'ready':
              placeholderEl.classList.remove(CLS_LOADING);
              iframeEl.classList.remove(CLS_LOADING);

              resolve();
              break;
            case 'expand':
              expandIframe();
              break;
            case 'collapse':
              collapseIframe();
              break;
            case 'navigate':
              location.href = message.url;
              break;
          }
        }
      });
    });
  }
}
