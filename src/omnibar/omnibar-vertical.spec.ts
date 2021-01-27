import {
  BBAuth
} from '../auth';

import {
  BBAuthInterop
} from '../shared/interop';

import {
  BBAuthNavigator
} from '../shared/navigator';

import {
  BBOmnibarConfig
} from './omnibar-config';

import {
  BBOmnibarVertical
} from './omnibar-vertical';

describe('Omnibar vertical', () => {
  const BASE_URL = 'about:blank';

  // tslint:disable-next-line:max-line-length
  const testToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCIxYmIuZW50aXRsZW1lbnRzIjoibm90aWYifQ.9geiUl3O3ZlEzZVNm28clN0SmZCfn3OSBnfZxNcymHc';

  let afterEl: HTMLElement;
  let messageIsFromOmnibarReturnValue: boolean;
  let navigateSpy: jasmine.Spy;
  let postOmnibarMessageSpy: jasmine.Spy;

  let getTokenFake: () => Promise<string>;

  function loadOmnibar(config?: BBOmnibarConfig): void {
    afterEl = document.createElement('div');
    document.body.appendChild(afterEl);

    config = config || {};
    config.verticalUrl = config.verticalUrl || BASE_URL;

    BBOmnibarVertical.load(
      config,
      afterEl
    );
  }

  function getIframeEl(): HTMLIFrameElement {
    return document.querySelector('.sky-omnibar-vertical-iframe') as HTMLIFrameElement;
  }

  function getIframeWrapperEl(): HTMLDivElement {
    return document.querySelector('.sky-omnibar-vertical-iframe-wrapper') as HTMLDivElement;
  }

  function fireMessageEvent(data: any, includeSource = true): void {
    if (includeSource) {
      data.source = 'skyux-spa-omnibar-vertical';
    }

    window.dispatchEvent(
      new MessageEvent('message', {
        data
      })
    );
  }

  function validateExpanded(expanded: boolean): void {
    expect(getIframeWrapperEl().classList.contains('sky-omnibar-vertical-expanded')).toBe(expanded);
  }

  function destroyOmnibar(): void {
    if (afterEl) {
      document.body.removeChild(afterEl);
    }

    BBOmnibarVertical.destroy();
  }

  beforeEach(() => {
    messageIsFromOmnibarReturnValue = true;

    navigateSpy = spyOn(BBAuthNavigator, 'navigate');
    postOmnibarMessageSpy = spyOn(BBAuthInterop, 'postOmnibarMessage');

    getTokenFake = () => Promise.resolve(testToken);

    spyOn(
      BBAuth,
      'getToken'
    ).and.callFake(() => {
      return getTokenFake();
    });

    spyOn(
      BBAuthInterop,
      'messageIsFromOmnibarVertical'
    ).and.callFake(() => {
      return messageIsFromOmnibarReturnValue;
    });
  });

  afterEach(() => {
    destroyOmnibar();
  });

  it('should load the vertical vomnibar IFRAME', () => {
    loadOmnibar();

    const iframeEl = getIframeEl();

    expect(iframeEl).not.toBeNull();

    expect(iframeEl.src).toBe(BASE_URL);
    expect(iframeEl.title).toBe('Vertical Navigation');
  });

  it('should only display the wrapper element until the vertical omnibar is ready for display', () => {
    loadOmnibar();

    const wrapperEl = getIframeWrapperEl();
    const iframeEl = getIframeEl();

    expect(getComputedStyle(wrapperEl).display).toBe('block');
    expect(getComputedStyle(iframeEl).visibility).toBe('hidden');

    fireMessageEvent({
      messageType: 'display-ready'
    });

    expect(getComputedStyle(wrapperEl).display).toBe('block');
    expect(getComputedStyle(iframeEl).visibility).toBe('visible');
  });

  it('should be collapsible', () => {
    loadOmnibar();

    const wrapperEl = getIframeWrapperEl();

    expect(getComputedStyle(wrapperEl).width).toBe('300px');

    fireMessageEvent({
      messageType: 'minimize'
    });

    expect(getComputedStyle(wrapperEl).width).toBe('100px');

    fireMessageEvent({
      messageType: 'maximize'
    });

    expect(getComputedStyle(wrapperEl).width).toBe('300px');
  });

  describe('interop with omnibar', () => {

    it('should notify the omnibar when navigation is ready to be loaded', () => {
      const envId = 'abc';
      const svcId = 'xyz';
      const leId = '123';
      const navVersion = 'test';

      loadOmnibar({
        envId,
        leId,
        nav: {
          services: [
            {
              items: [
                {
                  title: 'Some item',
                  url: 'https://example.com/'
                }
              ],
              title: 'Some service'
            }
          ]
        },
        navVersion,
        svcId
      });

      fireMessageEvent({
        messageType: 'ready'
      });

      expect(postOmnibarMessageSpy.calls.argsFor(0)).toEqual([
        getIframeEl(),
        {
          messageType: 'host-ready'
        }
      ]);

      expect(postOmnibarMessageSpy.calls.argsFor(1)).toEqual([
        getIframeEl(),
        {
          envId,
          leId,
          messageType: 'nav-ready',
          minimized: undefined,
          navVersion,
          services: [
            {
              items: [
                {
                  title: 'Some item',
                  url: 'https://example.com/'
                }
              ],
              title: 'Some service'
            }
          ],
          svcId,
          theme: undefined
        }
      ]);
    });

    it('should notify the omnibar when a requested token is available', (done) => {
      postOmnibarMessageSpy.and.callFake(() => {
        expect(postOmnibarMessageSpy).toHaveBeenCalledWith(
          getIframeEl(),
          {
            messageType: 'token',
            token: testToken,
            tokenRequestId: 123
          }
        );

        done();
      });

      loadOmnibar();

      fireMessageEvent({
        messageType: 'get-token',
        tokenRequestId: 123
      });
    });

    it('should notify the omnibar when a requested token is not available', (done) => {
      postOmnibarMessageSpy.and.callFake(() => {
        expect(postOmnibarMessageSpy).toHaveBeenCalledWith(
          getIframeEl(),
          {
            messageType: 'token-fail',
            reason: 'The user is not logged in.',
            tokenRequestId: 123
          }
        );

        done();
      });

      getTokenFake = () => {
        return Promise.reject('The user is not logged in.');
      };

      loadOmnibar();

      fireMessageEvent({
        disableRedirect: false,
        messageType: 'get-token',
        tokenRequestId: 123
      });
    });

    it('should notify the omnibar when the current user data should be refreshed', () => {
      loadOmnibar();

      BBOmnibarVertical.refreshUser(testToken);

      expect(postOmnibarMessageSpy).toHaveBeenCalledWith(
        getIframeEl(),
        {
          messageType: 'refresh-user',
          token: testToken
        }
      );
    });
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

      validateExpanded(false);
    });

    it('should expand and collapse', () => {
      loadOmnibar();

      fireMessageEvent({
        messageType: 'expand'
      });

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
  });

});
