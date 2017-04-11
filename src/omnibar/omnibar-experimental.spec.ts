import { BBOmnibarConfig } from './omnibar-config';
import { BBOmnibarExperimental } from './omnibar-experimental';
import { BBOmnibarNavigationItem } from './omnibar-navigation-item';

import { BBAuthInterop } from '../shared/interop';

describe('Omnibar (experimental)', () => {
  const BASE_URL = 'about:blank';

  function loadOmnibar(config?: BBOmnibarConfig) {
    config = config || {};
    config.url = BASE_URL;

    BBOmnibarExperimental.load(config);
  }

  function getIframeEl(): HTMLIFrameElement {
    return document.querySelector('.sky-omnibar-iframe') as HTMLIFrameElement;
  }

  function getStyleEl(): HTMLStyleElement {
    return document.querySelector('head style') as HTMLStyleElement;
  }

  function getPlaceholderEl(): HTMLDivElement {
    return document.querySelector('.sky-omnibar-placeholder') as HTMLDivElement;
  }

  function fireMessageEvent(data: any, includeSource = true) {
    if (includeSource) {
      data.source = 'skyux-spa-omnibar';
    }

    window.dispatchEvent(
      new MessageEvent('message', {
        data
      })
    );
  }

  function validateExpanded(expanded: boolean) {
    expect(getIframeEl().classList.contains('sky-omnibar-iframe-expanded')).toBe(expanded);
  }

  function destroyOmnibar() {
    BBOmnibarExperimental.destroy();
  }

  let navigateSpy: jasmine.Spy;
  let postOmnibarMessageSpy: jasmine.Spy;
  let messageIsFromOmnibarSpy: jasmine.Spy;

  let messageIsFromOmnibarReturnValue = true;

  beforeAll(() => {
    navigateSpy = spyOn(BBAuthInterop, 'navigate');
    postOmnibarMessageSpy = spyOn(BBAuthInterop, 'postOmnibarMessage');

    messageIsFromOmnibarSpy = spyOn(
      BBAuthInterop,
      'messageIsFromOmnibar'
    ).and.callFake(() => {
      return messageIsFromOmnibarReturnValue;
    });
  });

  beforeEach(() => {
    navigateSpy.calls.reset();
    postOmnibarMessageSpy.calls.reset();
    messageIsFromOmnibarSpy.calls.reset();
  });

  afterEach(() => {
    messageIsFromOmnibarReturnValue = true;

    navigateSpy.calls.reset();
    postOmnibarMessageSpy.calls.reset();
    messageIsFromOmnibarSpy.calls.reset();

    destroyOmnibar();
  });

  it('should load the omnibar IFRAME', () => {
    loadOmnibar();

    const iframeEl = getIframeEl();

    expect(iframeEl).not.toBeNull();

    expect(iframeEl.src).toBe(BASE_URL);
  });

  it('should display a placeholder element until the host page is ready', () => {
    loadOmnibar();

    const placeholderEl = getPlaceholderEl();
    const iframeEl = getIframeEl();

    expect(getComputedStyle(placeholderEl).display).toBe('block');
    expect(getComputedStyle(iframeEl).visibility).toBe('hidden');

    fireMessageEvent({
      messageType: 'ready'
    });

    expect(getComputedStyle(placeholderEl).display).toBe('none');
    expect(getComputedStyle(iframeEl).visibility).toBe('visible');
  });

  describe('interop with host page', () => {
    it('should ignore messages that do not originate from omnibar', () => {
      messageIsFromOmnibarReturnValue = false;

      loadOmnibar();

      fireMessageEvent(
        {
          messageType: 'expand'
        },
        false
      );

      const iframeEl = getIframeEl();

      validateExpanded(false);
    });

    it('should expand and collapse', () => {
      loadOmnibar();

      fireMessageEvent({
        messageType: 'expand'
      });

      const iframeEl = getIframeEl();

      validateExpanded(true);

      fireMessageEvent({
        messageType: 'collapse'
      });

      validateExpanded(false);
    });

    it('should navigate by URL', () => {
      loadOmnibar();

      fireMessageEvent({
        messageType: 'navigate-url',
        url: 'https://example.com/'
      });

      expect(navigateSpy).toHaveBeenCalledWith('https://example.com/');
    });

    it('should navigate by nav item', () => {
      loadOmnibar();

      fireMessageEvent({
        messageType: 'navigate',
        navItem: {
          url: 'https://example.com/'
        }
      });

      expect(navigateSpy).toHaveBeenCalledWith('https://example.com/');
    });

    it('should allow the host page to handle navigation when navigating by nav item', () => {
      loadOmnibar({
        nav: {
          beforeNavCallback(item: BBOmnibarNavigationItem) {
            return false;
          }
        }
      });

      fireMessageEvent({
        messageType: 'navigate',
        navItem: {
          url: 'https://example.com/'
        }
      });

      expect(navigateSpy).not.toHaveBeenCalled();
    });

  });

  describe('interop with omnibar', () => {

    it('should notify the omnibar when navigation is ready to be loaded', () => {
      const envId = 'abc';
      const svcId = 'xyz';
      const localNavItems: BBOmnibarNavigationItem[] = [
        {
          title: 'Test',
          url: 'https://example.com/'
        }
      ];

      loadOmnibar({
        envId,
        nav: {
          localNavItems
        },
        svcId
      });

      fireMessageEvent({
        messageType: 'ready'
      });

      expect(postOmnibarMessageSpy).toHaveBeenCalledWith(
        getIframeEl(),
        {
          localNavItems,
          envId,
          messageType: 'nav-ready',
          svcId
        }
      );
    });

    it('should notify the omnibar when the host page\'s URL changes', () => {
      function validateHistoryMonkeyPatch(historyFn: string) {
        postOmnibarMessageSpy.calls.reset();

        (history as any)[historyFn]({}, '', '/test');

        expect(postOmnibarMessageSpy).toHaveBeenCalledWith(
          iframeEl,
          {
            href: location.href,
            messageType: 'location-change'
          }
        );
      }

      loadOmnibar();

      const iframeEl = getIframeEl();

      spyOn(history, 'pushState');
      spyOn(history, 'replaceState');

      // Do this after the pushState/replaceState spies are established since the omnibar
      // monkey-patches it once the host page is ready.
      fireMessageEvent({
        messageType: 'ready'
      });

      validateHistoryMonkeyPatch('pushState');
      validateHistoryMonkeyPatch('replaceState');
    });

  });

});
