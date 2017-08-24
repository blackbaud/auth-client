declare const BBAUTH: any;

import { BBOmnibarExperimental } from './omnibar-experimental';
import { BBOmnibarScriptLoader } from './omnibar-script-loader';

function getJQuery() {
  return (window as any).jQuery;
}

export class BBOmnibar {
  public static load(config: any): Promise<any> {
    if (config && config.experimental) {
      return BBOmnibarExperimental.load(config);
    }

    return new Promise<any>((resolve: any) => {
      const jquery = getJQuery();
      const jqueryVersion = jquery && jquery.fn && jquery.fn.jquery;

      BBOmnibarScriptLoader.smartRegisterScript(
        'https://cdnjs.cloudflare.com/ajax/libs/jquery/2.1.0/jquery.js',
        '2.1.0',
        jqueryVersion
      )
        .then(() => {
          return BBOmnibarScriptLoader.registerScript(
            'https://cdnjs.cloudflare.com/ajax/libs/easyXDM/2.4.17.1/easyXDM.min.js'
          );
        })
        .then(() => {
          return BBOmnibarScriptLoader.registerScript(
            'https://signin.blackbaud.com/Omnibar.min.js'
          );
        })
        .then(() => {
          document.body.classList.add('bb-omnibar-height-padding');

          const omnibarEl = document.createElement('div');
          omnibarEl.setAttribute('data-omnibar-el', '');
          document.body.appendChild(omnibarEl);

          config = config || {};

          config['z-index'] = 1000;
          config.afterLoad = resolve;

          if (config.menuEl) {
            // BBAUTH.Omnibar assumes the host page has access to jQuery before load() is called
            // and can pass in menuEl as a jQuery object, but not every host page will be using
            // jQuery.  As a courtesy, just ensure menuEl is a jQuery object before passing it
            // to load().
            config.menuEl = getJQuery()(config.menuEl);
          }

          BBAUTH.Omnibar.load(
            omnibarEl,
            config
          );
        });
    });
  }
}
