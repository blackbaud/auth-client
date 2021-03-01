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
  BBUserConfig
 } from '../user-settings/user-config';

import {
  BBUserSettings
} from '../user-settings/user-settings';

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
  let navigateSpy: jasmine.Spy<typeof BBAuthNavigator.navigate>;
  let postOmnibarMessageSpy: jasmine.Spy<typeof BBAuthInterop.postOmnibarMessage>;
  let updateSettingsSpy: jasmine.Spy<typeof BBUserSettings.updateSettings>;
  let userSettingsReturnValue: Promise<BBUserConfig>;

  let getTokenFake: () => Promise<string>;

  function loadOmnibarVertical(config?: BBOmnibarConfig): Promise<void> {
    afterEl = document.createElement('div');
    document.body.appendChild(afterEl);

    config = config || {};
    config.verticalUrl = config.verticalUrl || BASE_URL;

    BBOmnibarVertical.load(
      config,
      afterEl
    );

    return new Promise((resolve) => {
      try {
        BBUserSettings.getSettings();
      } catch (err) {
        // An error loading settings should still load the omnibar.
      } finally {
        resolve();
      }
    });
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

  function validateMinimized(minimized: boolean): void {
    const wrapperEl = getIframeWrapperEl();

    expect(getComputedStyle(wrapperEl).width).toBe(minimized ? '90px' : '300px');
  }

  beforeEach(() => {
    messageIsFromOmnibarReturnValue = true;
    userSettingsReturnValue = Promise.resolve(undefined);

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

    spyOn(
      BBUserSettings,
      'getSettings'
    ).and.callFake(() => {
      return userSettingsReturnValue;
    });

    updateSettingsSpy = spyOn(
      BBUserSettings,
      'updateSettings'
    );
  });

  afterEach(() => {
    destroyOmnibar();
  });

  it('should load the vertical omnibar IFRAME', async () => {
    await loadOmnibarVertical();

    const iframeEl = getIframeEl();

    expect(iframeEl).not.toBeNull();

    expect(iframeEl.src).toBe(BASE_URL);
    expect(iframeEl.title).toBe('Vertical Navigation');
  });

  it('should only display the wrapper element until the vertical omnibar is ready for display', async () => {
    await loadOmnibarVertical();

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

  it('should be collapsible', async () => {
    await loadOmnibarVertical();

    validateMinimized(false);

    updateSettingsSpy.calls.reset();

    fireMessageEvent({
      messageType: 'minimize'
    });

    validateMinimized(true);

    expect(updateSettingsSpy).toHaveBeenCalledWith({
      omnibar: {
        vMin: true
      }
    });

    updateSettingsSpy.calls.reset();

    fireMessageEvent({
      messageType: 'maximize'
    });

    validateMinimized(false);

    expect(updateSettingsSpy).toHaveBeenCalledWith({
      omnibar: {
        vMin: false
      }
    });
  });

  it('should respect the user\'s global settings', async () => {
    userSettingsReturnValue = Promise.resolve({
      omnibar: {
        vMin: true
      }
    });

    await loadOmnibarVertical();

    validateMinimized(true);
  });

  it('should load the left nav with default settings if the user\'s global settings fail to load', async () => {
    userSettingsReturnValue = Promise.reject();

    await loadOmnibarVertical();

    validateMinimized(false);
  });

  describe('interop with omnibar', () => {

    it('should notify the omnibar when navigation is ready to be loaded', async () => {
      const envId = 'abc';
      const svcId = 'xyz';
      const leId = '123';
      const navVersion = 'test';

      await loadOmnibarVertical({
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

    it('should notify the omnibar when a requested token is available', async (done) => {
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

      await loadOmnibarVertical();

      fireMessageEvent({
        messageType: 'get-token',
        tokenRequestId: 123
      });
    });

    it('should notify the omnibar when a requested token is not available', async (done) => {
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

      await loadOmnibarVertical();

      fireMessageEvent({
        disableRedirect: false,
        messageType: 'get-token',
        tokenRequestId: 123
      });
    });

    it('should notify the omnibar when the current user data should be refreshed', async () => {
      await loadOmnibarVertical();

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
    it('should ignore messages that do not originate from omnibar', async () => {
      messageIsFromOmnibarReturnValue = false;

      await loadOmnibarVertical();

      fireMessageEvent(
        {
          messageType: 'expand'
        },
        false
      );

      validateExpanded(false);
    });

    it('should expand and collapse', async () => {
      await loadOmnibarVertical();

      fireMessageEvent({
        messageType: 'expand'
      });

      validateExpanded(true);

      fireMessageEvent({
        messageType: 'collapse'
      });

      validateExpanded(false);
    });

    it('should navigate by URL', async () => {
      await loadOmnibarVertical();

      fireMessageEvent({
        messageType: 'navigate-url',
        url: 'https://example.com/'
      });

      expect(navigateSpy).toHaveBeenCalledWith('https://example.com/');
    });

    it('should navigate by nav item', async () => {
      await loadOmnibarVertical();

      fireMessageEvent({
        messageType: 'navigate',
        navItem: {
          url: 'https://example.com/'
        }
      });

      expect(navigateSpy).toHaveBeenCalledWith('https://example.com/');
    });

    it('should notify omnibar and update minimized state when the user\'s global settings have changed', async () => {
      await loadOmnibarVertical();

      validateMinimized(false);

      userSettingsReturnValue = Promise.resolve({
        omnibar: {
          vMin: true
        }
      });

      await BBOmnibarVertical.refreshSettings();

      expect(postOmnibarMessageSpy).toHaveBeenCalledWith(
        getIframeEl(),
        {
          messageType: 'update-vertical',
          updateArgs: {
            minimized: true
          }
        }
      );

      validateMinimized(true);
    });
  });

});
