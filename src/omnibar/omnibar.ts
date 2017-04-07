declare const BBAUTH: any;

import { BBOmnibarExperimental } from './omnibar-experimental';

export class BBOmnibar {
  public static load(config: any): Promise<any> {
    if (config && config.experimental) {
      return BBOmnibarExperimental.load(config);
    }

    return new Promise<any>((resolve: any, reject: any) => {
      function registerScript(url: string): Promise<any> {
        return new Promise<any>((resolveInner: any, rejectInner: any) => {
          let scriptEl = document.createElement('script');

          scriptEl.onload = resolveInner;
          scriptEl.onerror = rejectInner;

          scriptEl.src = url;

          document.body.appendChild(scriptEl);
        });
      }

      registerScript('https://cdnjs.cloudflare.com/ajax/libs/jquery/2.1.0/jquery.js')
        .then(() => {
          return registerScript(
            'https://cdnjs.cloudflare.com/ajax/libs/easyXDM/2.4.17.1/easyXDM.min.js'
          );
        })
        .then(() => {
          return registerScript(
            'https://signin.blackbaud.com/Omnibar.min.js'
          );
        })
        .then(() => {
          document.body.classList.add('bb-omnibar-height-padding');

          let omnibarEl = document.createElement('div');
          document.body.appendChild(omnibarEl);

          config = config || {};

          config['z-index'] = 1000;
          config.afterLoad = resolve;

          BBAUTH.Omnibar.load(
            omnibarEl,
            config
          );
        });

    });
  }
}
