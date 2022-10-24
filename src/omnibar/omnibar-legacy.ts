import { BBOmnibarScriptLoader } from './omnibar-script-loader';

function getJQuery() {
  return window.jQuery;
}

export class BBOmnibarLegacy {
  public static load(config: Record<string, unknown>): Promise<void> {
    return new Promise<void>((resolve) => {
      const jquery = getJQuery();
      const jqueryVersion = (jquery as { fn: { jquery: string } } | undefined)
        ?.fn?.jquery;

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
            config.menuEl = (getJQuery() as (_: unknown) => unknown)(
              config.menuEl
            );
          }

          window.BBAUTH.Omnibar.load(omnibarEl, config);
        });
    });
  }
}
