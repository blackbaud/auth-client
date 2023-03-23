import { BBOmnibar } from './omnibar';

import { BBOmnibarConfig } from './omnibar-config';

import { BBOmnibarNavigationItem } from './omnibar-navigation-item';

import { BBOmnibarSearchArgs } from './omnibar-search-args';

import { BBOmnibarSearchResults } from './omnibar-search-results';

import { BBOmnibarUserActivity } from './omnibar-user-activity';

import { BBOmnibarTheme } from './theming';

import { BBAuthInterop } from '../shared/interop';

import { BBAuthNavigator } from '../shared/navigator';

import { BBAuth } from '../auth';

import { BBOmnibarUpdateArgs } from './omnibar-update-args';

import { BBOmnibarUserActivityPrompt } from './omnibar-user-activity-prompt';

import { BBOmnibarUserActivityPromptShowArgs } from './omnibar-user-activity-prompt-show-args';

import { BBOmnibarPushNotifications } from './omnibar-push-notifications';

import { BBOmnibarPushNotificationsConnectArgs } from './omnibar-push-notifications-connect-args';

import { BBOmnibarResizeArgs } from './omnibar-resize-args';

import { BBOmnibarToastContainer } from './omnibar-toast-container';

import { BBOmnibarVertical } from './omnibar-vertical';

describe('Omnibar', () => {
  const BASE_URL = 'about:blank';

  // tslint:disable-next-line:max-line-length
  const testToken =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCIxYmIuZW50aXRsZW1lbnRzIjoibm90aWYifQ.9geiUl3O3ZlEzZVNm28clN0SmZCfn3OSBnfZxNcymHc';

  async function loadOmnibar(config?: BBOmnibarConfig): Promise<void> {
    config = config || {};
    config.url = config.url || BASE_URL;

    await BBOmnibar.load(config);
  }

  function getIframeEl(): HTMLIFrameElement {
    return document.querySelector('.sky-omnibar-iframe') as HTMLIFrameElement;
  }

  function getPlaceholderEl(): HTMLDivElement {
    return document.querySelector('.sky-omnibar-placeholder') as HTMLDivElement;
  }

  function getPlaceholderAccentEl(): HTMLDivElement {
    return document.querySelector(
      '.sky-omnibar-placeholder .sky-omnibar-placeholder-accent'
    ) as HTMLDivElement;
  }

  function getEnvironmentEl(): HTMLDivElement {
    return document.querySelector('.sky-omnibar-environment') as HTMLDivElement;
  }

  function fireMessageEvent(
    data: Record<string, unknown>,
    includeSource = true,
    hostId = 'omnibar'
  ): void {
    data.hostId = hostId;

    if (includeSource) {
      data.source = 'skyux-spa-omnibar';
    }

    window.dispatchEvent(
      new MessageEvent('message', {
        data,
      })
    );
  }

  function validateExpanded(expanded: boolean): void {
    expect(
      getIframeEl().classList.contains('sky-omnibar-iframe-expanded')
    ).toBe(expanded);
  }

  function destroyOmnibar(): void {
    BBOmnibar.destroy();
  }

  let navigateSpy: jasmine.Spy<typeof BBAuthNavigator.navigate>;
  let postOmnibarMessageSpy: jasmine.Spy<
    typeof BBAuthInterop.postOmnibarMessage
  >;
  let getTokenSpy: jasmine.Spy<typeof BBAuth.getToken>;
  let startTrackingSpy: jasmine.Spy<typeof BBOmnibarUserActivity.startTracking>;
  let pushNotificationsConnectSpy: jasmine.Spy<
    typeof BBOmnibarPushNotifications.connect
  >;
  let pushNotificationsDisconnectSpy: jasmine.Spy<
    typeof BBOmnibarPushNotifications.disconnect
  >;
  let toastContainerShowNewSpy: jasmine.Spy<
    typeof BBOmnibarToastContainer.showNewNotifications
  >;

  let messageIsFromOmnibarReturnValue = true;
  let getTokenFake: () => Promise<string>;
  let documentTitle: string;

  beforeEach(() => {
    navigateSpy = spyOn(BBAuthNavigator, 'navigate');
    postOmnibarMessageSpy = spyOn(BBAuthInterop, 'postOmnibarMessage');

    spyOn(BBAuthInterop, 'messageIsFromOmnibar').and.callFake(() => {
      return messageIsFromOmnibarReturnValue;
    });

    getTokenSpy = spyOn(BBAuth, 'getToken').and.callFake(() => {
      return getTokenFake();
    });

    pushNotificationsConnectSpy = spyOn(BBOmnibarPushNotifications, 'connect');

    pushNotificationsDisconnectSpy = spyOn(
      BBOmnibarPushNotifications,
      'disconnect'
    ).and.returnValue(Promise.resolve());

    toastContainerShowNewSpy = spyOn(
      BBOmnibarToastContainer,
      'showNewNotifications'
    );

    // This effectively disables activity tracking.  Without this, the test page could potentially redirect to
    // the login page during the test run when it detects no activity.
    startTrackingSpy = spyOn(BBOmnibarUserActivity, 'startTracking');

    // Disable animations so computed styles can be validated without waiting for animations to complete.
    const styleEl = document.createElement('style');

    styleEl.appendChild(
      document.createTextNode('* { transition: none !important }')
    );

    document.head.appendChild(styleEl);

    getTokenFake = () => Promise.resolve(testToken);

    documentTitle = document.title;
  });

  afterEach(() => {
    delete window.BBHELP;

    messageIsFromOmnibarReturnValue = true;

    destroyOmnibar();

    document.title = documentTitle;
  });

  it('should load the omnibar IFRAME', () => {
    loadOmnibar();

    const iframeEl = getIframeEl();

    expect(iframeEl).not.toBeNull();

    // The IFRAME should be inserted at the very top of the DOM to enforce the correct
    // tab order between the omnibar and the host page's content.
    expect(document.body.firstChild).toBe(iframeEl);

    expect(iframeEl.src).toBe(BASE_URL + '?hostid=omnibar');
    expect(iframeEl.title).toBe('Navigation');
  });

  it('should load omnibar with query parameters correctly', () => {
    loadOmnibar({
      url: BASE_URL + '?test=value',
    });

    const iframeEl = getIframeEl();

    expect(iframeEl).not.toBeNull();

    // The IFRAME should be inserted at the very top of the DOM to enforce the correct
    // tab order between the omnibar and the host page's content.
    expect(document.body.firstChild).toBe(iframeEl);

    expect(iframeEl.src).toBe(BASE_URL + '?test=value&hostid=omnibar');
    expect(iframeEl.title).toBe('Navigation');
  });

  it('should display a placeholder element until the omnibar is ready for display', () => {
    loadOmnibar();

    const placeholderEl = getPlaceholderEl();
    const iframeEl = getIframeEl();

    expect(getComputedStyle(placeholderEl).display).toBe('block');
    expect(getComputedStyle(iframeEl).visibility).toBe('hidden');

    fireMessageEvent({
      messageType: 'display-ready',
    });

    expect(getComputedStyle(placeholderEl).display).toBe('none');
    expect(getComputedStyle(iframeEl).visibility).toBe('visible');
  });

  it('should style the placeholder element based on the provided theme', () => {
    loadOmnibar({
      theme: {
        backgroundColor: 'rgb(123, 0, 4)',
      },
    });

    const placeholderEl = getPlaceholderEl();
    const placeholderStyle = getComputedStyle(placeholderEl);

    const placeholderAccentEl = getPlaceholderAccentEl();
    const placeholderAccentStyle = getComputedStyle(placeholderAccentEl);

    expect(placeholderStyle.backgroundColor).toBe('rgb(123, 0, 4)');

    expect(placeholderAccentStyle.display).toBe('block');
    expect(placeholderAccentStyle.backgroundImage).toBe(
      'linear-gradient(to right, rgb(113, 191, 68) 0px, rgb(49, 185, 134) 50%, rgb(0, 178, 236) 100%)'
    );
  });

  it('should style the placeholder element accent based on the provided theme', () => {
    loadOmnibar({
      theme: {
        accent: {
          color: 'rgb(3, 5, 6)',
        },
      },
    });

    const placeholderEl = getPlaceholderEl();
    const placeholderStyle = getComputedStyle(placeholderEl);

    const placeholderAccentEl = getPlaceholderAccentEl();
    const placeholderAccentStyle = getComputedStyle(placeholderAccentEl);

    expect(placeholderStyle.backgroundColor).toBe('rgb(77, 82, 89)');

    expect(placeholderAccentStyle.display).toBe('block');
    expect(placeholderAccentStyle.backgroundColor).toBe('rgb(3, 5, 6)');
  });

  it('should not show a placeholder accent when the provided theme removes it', () => {
    loadOmnibar({
      theme: {
        accent: false,
      },
    });

    const placeholderEl = getPlaceholderEl();
    const placeholderStyle = getComputedStyle(placeholderEl);

    const placeholderAccentEl = getPlaceholderAccentEl();
    const placeholderAccentStyle = getComputedStyle(placeholderAccentEl);

    expect(placeholderStyle.backgroundColor).toBe('rgb(77, 82, 89)');

    expect(placeholderAccentStyle.display).toBe('none');
  });

  it('should apply pre-defined styles when the theme name is "modern"', () => {
    loadOmnibar({
      theme: {
        name: 'modern',
      },
    });

    const placeholderEl = getPlaceholderEl();
    const placeholderStyle = getComputedStyle(placeholderEl);

    const placeholderAccentEl = getPlaceholderAccentEl();
    const placeholderAccentStyle = getComputedStyle(placeholderAccentEl);

    expect(placeholderStyle.backgroundColor).toBe('rgb(255, 255, 255)');
    expect(placeholderStyle.borderBottomColor).toBe('rgb(226, 227, 228)');
    expect(placeholderStyle.borderBottomStyle).toBe('solid');
    expect(placeholderStyle.borderBottomWidth).toBe('1px');

    expect(placeholderAccentStyle.height).toBe('4px');
  });

  it('should disable redirect when the session ends and allow anonymous is true', (done) => {
    postOmnibarMessageSpy.and.callFake((_, data: { messageType: string }) => {
      if (data.messageType === 'token') {
        expect(startTrackingSpy).toHaveBeenCalledWith(
          jasmine.any(Function),
          jasmine.any(Function),
          jasmine.any(Function),
          true,
          undefined
        );

        done();
      }
    });

    loadOmnibar({
      allowAnonymous: true,
    });

    fireMessageEvent({
      messageType: 'get-token',
      tokenRequestId: 123,
    });
  });

  describe('interop with host page', () => {
    it('should ignore messages that do not originate from omnibar', () => {
      messageIsFromOmnibarReturnValue = false;

      loadOmnibar();

      fireMessageEvent(
        {
          messageType: 'expand',
        },
        false
      );

      validateExpanded(false);
    });

    it('should ignore messages that do not originate from this hostId', () => {
      loadOmnibar();

      fireMessageEvent(
        {
          messageType: 'get-token',
        },
        true,
        'context-provider'
      );

      expect(getTokenSpy).not.toHaveBeenCalled();
    });

    it('should expand and collapse', () => {
      loadOmnibar();

      fireMessageEvent({
        messageType: 'expand',
      });

      validateExpanded(true);

      fireMessageEvent({
        messageType: 'collapse',
      });

      validateExpanded(false);
    });

    it('should navigate by URL', () => {
      loadOmnibar();

      fireMessageEvent({
        messageType: 'navigate-url',
        url: 'https://example.com/',
      });

      expect(navigateSpy).toHaveBeenCalledWith('https://example.com/');
    });

    it('should navigate by nav item', () => {
      loadOmnibar();

      fireMessageEvent({
        messageType: 'navigate',
        navItem: {
          url: 'https://example.com/',
        },
      });

      expect(navigateSpy).toHaveBeenCalledWith('https://example.com/');
    });

    it('should allow the host page to handle navigation when navigating by nav item', () => {
      loadOmnibar({
        nav: {
          beforeNavCallback() {
            return false;
          },
        },
      });

      fireMessageEvent({
        messageType: 'navigate',
        navItem: {
          url: 'https://example.com/',
        },
      });

      expect(navigateSpy).not.toHaveBeenCalled();
    });

    it("should call the config's onSearch() callback when search is invoked", (done) => {
      const config = {
        onSearch: jasmine
          .createSpy('onSearch')
          .and.returnValue(Promise.resolve(undefined)),
      };

      postOmnibarMessageSpy.and.callFake(() => {
        expect(config.onSearch).toHaveBeenCalledWith({
          searchText: 'abc',
        });

        done();
      });

      loadOmnibar(config);

      fireMessageEvent({
        messageType: 'search',
        searchArgs: {
          searchText: 'abc',
        },
      });
    });

    it("should not attempt to call the config's onSearch() callback when it is not defined", () => {
      loadOmnibar();

      fireMessageEvent({
        messageType: 'search',
        searchArgs: {
          searchText: 'abc',
        },
      });

      // Should not throw an error.
    });

    it("should call the notification config's onReady() callback", () => {
      const config = {
        notifications: {
          onReady: jasmine.createSpy('onReady'),
        },
      };

      loadOmnibar(config);

      fireMessageEvent({
        messageType: 'ready',
      });

      expect(config.notifications.onReady).toHaveBeenCalled();
    });

    it("should call the notification config's onNotificationRead() callback", () => {
      const config = {
        notifications: {
          onNotificationRead: jasmine.createSpy('onNotificationRead'),
          onReady: jasmine.createSpy('onReady'),
        },
      };

      loadOmnibar(config);

      fireMessageEvent({
        messageType: 'notification-read',
        notification: {
          id: 1,
        },
      });

      expect(config.notifications.onNotificationRead).toHaveBeenCalledWith({
        id: 1,
      });
    });

    it("should not call the notification config's onNotificationRead() callback if not specified", () => {
      const config = {
        notifications: {
          onReady: jasmine.createSpy('onReady'),
        },
      };

      loadOmnibar(config);

      fireMessageEvent({
        messageType: 'notification-read',
        notification: {
          id: 1,
        },
      });

      // Should not throw an error.
    });

    it("should call the omnibar config's onResize() callback when rendered", () => {
      const config = {
        onResize: jasmine.createSpy('onResize'),
      } as BBOmnibarConfig;

      loadOmnibar(config);

      expect(config.onResize).toHaveBeenCalledWith({
        position: 'top',
        size: 50,
      } as BBOmnibarResizeArgs);
    });

    it("should call the omnibar config's onResize() callback when the environment bar is displayed", () => {
      const config = {
        onResize: jasmine.createSpy('onResize'),
      } as BBOmnibarConfig;

      loadOmnibar(config);

      fireMessageEvent({
        messageType: 'environment-update',
        name: 'Environment name',
      });

      expect(config.onResize).toHaveBeenCalledWith({
        position: 'top',
        size: 74,
      } as BBOmnibarResizeArgs);
    });

    it('should open the help widget if the help widget is present on the page', () => {
      loadOmnibar();

      const openSpy = jasmine.createSpy('open');

      window.BBHELP = {
        HelpWidget: {
          open: openSpy,
        },
      };

      fireMessageEvent({
        messageType: 'help-open',
      });

      expect(openSpy).toHaveBeenCalled();
    });

    it('should not attempt to open the help widget if the help widget is not present on the page', () => {
      loadOmnibar();

      fireMessageEvent({
        messageType: 'help-open',
      });

      // Should not throw an error.
    });

    it('should provide a way to renew the user session', () => {
      loadOmnibar();

      const userRenewedSessionSpy = spyOn(
        BBOmnibarUserActivity,
        'userRenewedSession'
      );

      fireMessageEvent({
        messageType: 'session-renew',
      });

      expect(userRenewedSessionSpy).toHaveBeenCalled();
    });

    it('should display the current environment when specified by the omnibar', () => {
      loadOmnibar();

      const environmentEl = document.querySelector(
        '.sky-omnibar-environment'
      ) as HTMLElement;
      const environmentNameEl = document.querySelector(
        '.sky-omnibar-environment-name'
      ) as HTMLElement;
      const environmentInfoEl = document.querySelector(
        '.sky-omnibar-environment-description'
      ) as HTMLElement;
      let environmentInfoLinkEl: HTMLAnchorElement;

      const defaultThemeClass = 'sky-omnibar-environment-theme-default';
      const defaultBackgroundColor = 'rgb(225, 225, 227)';
      const modernThemeClass = 'sky-omnibar-environment-theme-modern';
      const modernBackgroundColor = 'rgba(0, 0, 0, 0)';
      const descriptionBackgroundColor = 'rgb(255, 236, 207)';

      const validateVisible = (
        visible: boolean,
        className?: string,
        backgroundColor?: string
      ) => {
        expect(
          document.body.classList.contains('sky-omnibar-environment-visible')
        ).toBe(visible);
        expect(getComputedStyle(environmentEl).height).toBe(
          visible ? '24px' : '0px'
        );
        expect(environmentNameEl.innerText.trim()).toBe(
          visible ? 'Environment name' : ''
        );

        if (visible && className && backgroundColor) {
          expect(environmentEl.classList.contains(className)).toBe(true);
          expect(getComputedStyle(environmentEl).backgroundColor).toBe(
            backgroundColor
          );
        }
      };

      const validateDescription = (visible: boolean, url?: boolean) => {
        expect(
          environmentEl.classList.contains(
            'sky-omnibar-environment-description-present'
          )
        ).toBe(visible);

        environmentInfoLinkEl = environmentInfoEl.querySelector('a');

        if (visible && url) {
          expect(environmentInfoLinkEl.innerText.trim()).toBe(
            'Test environment'
          );
          expect(environmentInfoLinkEl.href).toBe(
            'https://app.blackbaud.com/auth-client-env-url'
          );
        } else {
          expect(environmentInfoLinkEl).toBe(null);
          expect(environmentInfoEl.innerText.trim()).toBe(
            visible ? 'Test environment' : ''
          );
        }
      };

      // Initial state.
      validateVisible(false);
      validateDescription(false);

      // Environment name present, default theme.
      fireMessageEvent({
        messageType: 'environment-update',
        name: 'Environment name',
      });

      validateVisible(true, defaultThemeClass, defaultBackgroundColor);
      validateDescription(false);

      // Update to modern theme
      BBOmnibar.update({
        theme: {
          name: 'modern',
        },
      });

      validateVisible(true, modernThemeClass, modernBackgroundColor);
      validateDescription(false);

      // Back to initial state
      fireMessageEvent({
        messageType: 'environment-update',
        name: undefined,
      });

      validateVisible(false);
      validateDescription(false);

      // Environment name with description has description background with modern theme
      fireMessageEvent({
        description: 'Test environment',
        messageType: 'environment-update',
        name: 'Environment name',
      });

      validateVisible(true, modernThemeClass, descriptionBackgroundColor);
      validateDescription(true);

      // Back to default theme keeps description background
      BBOmnibar.update({
        theme: {
          name: 'theme',
        },
      });

      validateVisible(true, defaultThemeClass, descriptionBackgroundColor);
      validateDescription(true);

      // Description with URL
      fireMessageEvent({
        description: 'Test environment',
        messageType: 'environment-update',
        name: 'Environment name',
        url: 'https://app.blackbaud.com/auth-client-env-url',
      });

      validateVisible(true, defaultThemeClass, descriptionBackgroundColor);
      validateDescription(true, true);
    });

    it('should restart activity tracking when the legacy session keep-alive URL changes', () => {
      loadOmnibar();

      startTrackingSpy.calls.reset();

      fireMessageEvent({
        messageType: 'legacy-keep-alive-url-change',
        url: 'https://example.com/track',
      });

      expect(startTrackingSpy).toHaveBeenCalledWith(
        jasmine.any(Function),
        jasmine.any(Function),
        jasmine.any(Function),
        undefined,
        'https://example.com/track'
      );
    });

    it('should set the document title with the service name if setTitle has been called with empty title parts', () => {
      loadOmnibar();

      const serviceName = 'test service';

      BBOmnibar.setTitle({
        titleParts: [],
      });

      fireMessageEvent({
        messageType: 'selected-service-update',
        serviceName,
      });

      expect(document.title).toBe(serviceName);
    });

    it('should not set the document title with the service name if setTitle has not been called', () => {
      loadOmnibar();

      const serviceName = 'test service 2';

      fireMessageEvent({
        messageType: 'selected-service-update',
        serviceName,
      });

      expect(document.title).not.toBe(serviceName);
    });

    it('should set the document title with the number of unread notifications', (done) => {
      pushNotificationsConnectSpy.and.callFake(
        async (args: BBOmnibarPushNotificationsConnectArgs) => {
          const serviceName = 'test service';

          fireMessageEvent({
            messageType: 'selected-service-update',
            serviceName,
          });

          BBOmnibar.setTitle({
            titleParts: ['with notifications'],
          });

          expect(document.title).toBe('with notifications - test service');

          args.notificationsCallback({
            notifications: [
              {
                notificationId: '1',
                shortMessage: 'Hello world',
              },
            ],
          });

          expect(document.title).toBe('(1) with notifications - test service');

          done();
        }
      );

      loadOmnibar();

      fireMessageEvent({
        messageType: 'ready',
      });
    });

    it('should show the inactivity prompt', (done) => {
      const showSpy = spyOn(BBOmnibarUserActivityPrompt, 'show');

      startTrackingSpy.and.callFake(
        async (
          refreshUserCallback: () => void,
          showInactivityCallback: () => void
        ) => {
          showInactivityCallback();

          expect(showSpy).toHaveBeenCalled();

          // Ensure the asynchronous getToken() call has completed before ending the test.
          await getTokenSpy();

          done();
        }
      );

      loadOmnibar();

      // Getting a token starts the activity tracking.
      fireMessageEvent({
        messageType: 'get-token',
      });
    });

    it('should renew the session when the user dismisses the inactivity prompt', (done) => {
      spyOn(BBOmnibarUserActivityPrompt, 'show').and.callFake(
        (args: BBOmnibarUserActivityPromptShowArgs) => {
          args.sessionRenewCallback();
        }
      );

      const userRenewedSessionSpy = spyOn(
        BBOmnibarUserActivity,
        'userRenewedSession'
      );

      startTrackingSpy.and.callFake(
        async (
          refreshUserCallback: () => void,
          showInactivityCallback: () => void
        ) => {
          showInactivityCallback();

          expect(userRenewedSessionSpy).toHaveBeenCalled();

          // Ensure the asynchronous getToken() call has completed before ending the test.
          await getTokenSpy();

          done();
        }
      );

      loadOmnibar();

      // Getting a token starts the activity tracking.
      fireMessageEvent({
        messageType: 'get-token',
      });
    });

    it('should hide the inactivity prompt', (done) => {
      const hideSpy = spyOn(BBOmnibarUserActivityPrompt, 'hide');

      startTrackingSpy.and.callFake(
        async (
          refreshUserCallback: () => void,
          showInactivityCallback: () => void,
          hideInactivityCallback: () => void
        ) => {
          hideInactivityCallback();

          expect(hideSpy).toHaveBeenCalled();

          // Ensure the asynchronous getToken() call has completed before ending the test.
          await getTokenSpy();

          done();
        }
      );

      loadOmnibar();

      // Getting a token starts the activity tracking.
      fireMessageEvent({
        messageType: 'get-token',
      });
    });

    it('should handle updates to push notifications', () => {
      const testNotifications = [
        {
          isRead: true,
          notificationId: '1',
        },
      ];

      const updateNotificationsSpy = spyOn(
        BBOmnibarPushNotifications,
        'updateNotifications'
      );

      loadOmnibar();

      fireMessageEvent({
        messageType: 'push-notifications-change',
        notifications: testNotifications,
      });

      expect(updateNotificationsSpy).toHaveBeenCalledWith(testNotifications);
    });
  });

  describe('interop with omnibar', () => {
    it('should notify the omnibar when navigation is ready to be loaded', () => {
      const envId = 'abc';
      const svcId = 'xyz';
      const leId = '123';
      const compactNavOnly = true;
      const navVersion = 'test';
      const hideResourceLinks = true;

      const localNavItems: BBOmnibarNavigationItem[] = [
        {
          title: 'Test',
          url: 'https://example.com/',
        },
      ];

      const theme: BBOmnibarTheme = {
        backgroundColor: 'green',
      };

      loadOmnibar({
        compactNavOnly,
        envId,
        hideResourceLinks,
        leId,
        nav: {
          localNavItems,
          services: [
            {
              items: [
                {
                  title: 'Some item',
                  url: 'https://example.com/',
                },
              ],
              title: 'Some service',
            },
          ],
        },
        navVersion,
        onSearch: jasmine.createSpy('onSearch'),
        svcId,
        theme,
      });

      fireMessageEvent({
        messageType: 'ready',
      });

      expect(postOmnibarMessageSpy.calls.argsFor(0)).toEqual([
        getIframeEl(),
        {
          messageType: 'host-ready',
        },
      ]);

      expect(postOmnibarMessageSpy.calls.argsFor(1)).toEqual([
        getIframeEl(),
        {
          compactNavOnly,
          enableHelp: undefined,
          envId,
          hideResourceLinks,
          leId,
          localNavItems,
          localNotifications: false,
          localSearch: true,
          messageType: 'nav-ready',
          navVersion,
          services: [
            {
              items: [
                {
                  title: 'Some item',
                  url: 'https://example.com/',
                },
              ],
              title: 'Some service',
            },
          ],
          svcId,
          theme,
        },
      ]);
    });

    it("should notify the omnibar when the host page's URL changes", () => {
      function validateHistoryMonkeyPatch(historyFn: keyof History) {
        postOmnibarMessageSpy.calls.reset();

        history[historyFn]({}, '', '/test');

        expect(postOmnibarMessageSpy).toHaveBeenCalledWith(iframeEl, {
          href: location.href,
          category: 'test',
          messageType: 'location-change',
        });
      }

      loadOmnibar({
        getRouteInfo: () => {
          return { category: 'test' };
        },
      });

      const iframeEl = getIframeEl();

      spyOn(history, 'pushState');
      spyOn(history, 'replaceState');

      // Do this after the pushState/replaceState spies are established since the omnibar
      // monkey-patches it once the host page is ready.
      fireMessageEvent({
        messageType: 'ready',
      });

      validateHistoryMonkeyPatch('pushState');
      validateHistoryMonkeyPatch('replaceState');
    });

    it('should notify the omnibar when search results are available', (done) => {
      postOmnibarMessageSpy.and.callFake(() => {
        expect(postOmnibarMessageSpy).toHaveBeenCalledWith(getIframeEl(), {
          messageType: 'search-results',
          results: {
            items: [
              {
                title: 'test',
                url: 'https://example.com/',
              },
            ],
            searchArgs: {
              searchText: 'abc',
            },
          } as BBOmnibarSearchResults,
        });

        done();
      });

      const config = {
        onSearch: (searchArgs: BBOmnibarSearchArgs) => {
          return Promise.resolve({
            items: [
              {
                title: 'test',
                url: 'https://example.com/',
              },
            ],
            searchArgs,
          });
        },
      };

      loadOmnibar(config);

      fireMessageEvent({
        messageType: 'search',
        searchArgs: {
          searchText: 'abc',
        },
      });
    });

    it('should notify the omnibar when a requested token is available', (done) => {
      postOmnibarMessageSpy.and.callFake(() => {
        expect(postOmnibarMessageSpy).toHaveBeenCalledWith(getIframeEl(), {
          messageType: 'token',
          token: testToken,
          tokenRequestId: 123,
        });

        done();
      });

      loadOmnibar();

      fireMessageEvent({
        messageType: 'get-token',
        tokenRequestId: 123,
      });
    });

    it('should notify the omnibar when a requested token is not available', (done) => {
      postOmnibarMessageSpy.and.callFake(() => {
        expect(postOmnibarMessageSpy).toHaveBeenCalledWith(getIframeEl(), {
          messageType: 'token-fail',
          reason: 'The user is not logged in.',
          tokenRequestId: 123,
        });

        done();
      });

      getTokenFake = () => {
        return Promise.reject('The user is not logged in.');
      };

      loadOmnibar();

      fireMessageEvent({
        disableRedirect: false,
        messageType: 'get-token',
        tokenRequestId: 123,
      });
    });

    it('should notify the omnibar when the current user data should be refreshed', (done) => {
      startTrackingSpy.and.callFake(
        async (refreshUserCallback: () => Promise<void>) => {
          await refreshUserCallback();

          expect(postOmnibarMessageSpy).toHaveBeenCalledWith(getIframeEl(), {
            messageType: 'refresh-user',
            token: testToken,
          });

          done();
        }
      );

      loadOmnibar();

      fireMessageEvent({
        messageType: 'get-token',
        tokenRequestId: 123,
      });
    });

    it('should notify the omnibar when the current user has logged out', (done) => {
      startTrackingSpy.and.callFake(
        async (refreshUserCallback: () => Promise<void>) => {
          await refreshUserCallback();

          expect(postOmnibarMessageSpy).toHaveBeenCalledWith(getIframeEl(), {
            messageType: 'refresh-user',
            token: undefined,
          });

          done();
        }
      );

      getTokenFake = () => {
        return Promise.reject('The user is not logged in.');
      };

      loadOmnibar();

      fireMessageEvent({
        messageType: 'get-token',
        tokenRequestId: 123,
      });
    });

    it('should notify the omnibar when notifications are updated', () => {
      const notifications = {
        items: [
          {
            id: 1,
            title: 'Hi',
          },
        ],
      };

      const config: BBOmnibarConfig = {
        notifications: {
          onReady: (readyArgs) => {
            readyArgs.updateNotifications(notifications);
          },
        },
      };

      loadOmnibar(config);

      fireMessageEvent({
        messageType: 'ready',
      });

      expect(postOmnibarMessageSpy.calls.argsFor(2)).toEqual([
        getIframeEl(),
        {
          messageType: 'notifications-update',
          notifications,
        },
      ]);
    });

    it('should notify the omnibar when update() is called', (done) => {
      const updateArgs: BBOmnibarUpdateArgs = {
        compactNavOnly: true,
        nav: {
          services: [
            {
              title: 'Test Service',
            },
          ],
        },
        theme: {
          backgroundColor: '#abc',
        },
      };

      postOmnibarMessageSpy.and.callFake(() => {
        expect(postOmnibarMessageSpy).toHaveBeenCalledWith(getIframeEl(), {
          messageType: 'update',
          updateArgs,
        });

        done();
      });

      loadOmnibar();

      BBOmnibar.update(updateArgs);
    });

    it('should update the document title when setTitle() is called', () => {
      const serviceName = 'Test Service';

      loadOmnibar();

      fireMessageEvent({
        messageType: 'selected-service-update',
        serviceName,
      });

      BBOmnibar.setTitle({ titleParts: ['Dropdown', 'Components'] });

      expect(document.title).toBe('Dropdown - Components - Test Service');
    });

    it('should notify the omnibar and the toast container when new push notifications arrive', (done) => {
      let notificationsUpdatePosted: boolean;

      const testNotifications = {
        notifications: [
          {
            notificationId: '1',
            shortMessage: 'Hello world',
          },
        ],
      };

      postOmnibarMessageSpy.and.callFake(
        (iframeEl, data: { messageType: string }) => {
          if (data.messageType === 'push-notifications-update') {
            expect(postOmnibarMessageSpy).toHaveBeenCalledWith(getIframeEl(), {
              messageType: 'push-notifications-update',
              pushNotifications: testNotifications,
            });

            notificationsUpdatePosted = true;
          }
        }
      );

      toastContainerShowNewSpy.and.callFake(() => {
        expect(notificationsUpdatePosted).toBe(true);
        expect(toastContainerShowNewSpy).toHaveBeenCalledWith(
          testNotifications
        );

        done();
      });

      pushNotificationsConnectSpy.and.callFake(
        async (args: BBOmnibarPushNotificationsConnectArgs) => {
          args.notificationsCallback(testNotifications);
        }
      );

      loadOmnibar();

      fireMessageEvent({
        messageType: 'ready',
      });
    });

    it('should not connect to push notifications if the user is not logged in', async () => {
      getTokenFake = () => {
        return Promise.reject('The user is not logged in.');
      };

      const loadPromise = loadOmnibar();

      fireMessageEvent({
        messageType: 'ready',
      });

      await loadPromise;

      expect(pushNotificationsConnectSpy).not.toHaveBeenCalled();
    });

    it('should disconnect push notifications when the user logs out', (done) => {
      pushNotificationsConnectSpy.and.callFake(async () => {
        pushNotificationsDisconnectSpy.and.callFake(async () => {
          pushNotificationsDisconnectSpy.and.stub();
          done();
        });

        getTokenFake = () => Promise.reject('The user is not logged in');

        fireMessageEvent({
          messageType: 'get-token',
          tokenRequestId: 124,
        });
      });

      startTrackingSpy.and.callFake((refreshUserCallback: () => void) => {
        refreshUserCallback();
      });

      loadOmnibar();

      fireMessageEvent({
        messageType: 'get-token',
        tokenRequestId: 123,
      });
    });

    it('should notify the omnibar to open the push notifications menu', (done) => {
      startTrackingSpy.and.callFake((refreshUserCallback: () => void) => {
        refreshUserCallback();
      });

      pushNotificationsConnectSpy.and.callFake(
        async (args: BBOmnibarPushNotificationsConnectArgs) => {
          args.openPushNotificationsMenu();

          expect(postOmnibarMessageSpy).toHaveBeenCalledWith(getIframeEl(), {
            messageType: 'push-notifications-open',
          });

          done();
        }
      );

      loadOmnibar();

      fireMessageEvent({
        messageType: 'get-token',
        tokenRequestId: 123,
      });
    });

    describe('branding', () => {
      interface LinkInfo {
        el: HTMLLinkElement;
        removeSpy: jasmine.Spy;
      }

      const head = document.head;
      const bbLogo = 'https://www.blackbaud.com/blackbaudlogo.png';
      const customLogo = 'https://www.blackbaud.com/customlogo.png';

      let linkInfos: LinkInfo[];
      let iconLink: LinkInfo;
      let appleIconLink: LinkInfo;
      let maskIconLink: LinkInfo;
      let manifestLink: LinkInfo;

      function createLinkElement(rel: string): LinkInfo {
        const el = document.createElement('link');
        el.rel = rel;
        el.href = bbLogo;
        head.appendChild(el);

        const linkInfo: LinkInfo = {
          el,
          removeSpy: spyOn(el, 'remove'),
        };

        linkInfos.push(linkInfo);
        return linkInfo;
      }

      function validateLinkInfo(
        linkInfo: LinkInfo,
        icon: string | undefined,
        removeCalled: boolean
      ) {
        if (icon !== undefined) {
          expect(linkInfo.el.href).toEqual(icon);
        }
        expect(linkInfo.removeSpy).toHaveBeenCalledTimes(removeCalled ? 1 : 0);
      }

      beforeEach(() => {
        linkInfos = [];
        iconLink = createLinkElement('icon');
        appleIconLink = createLinkElement('apple-touch-icon');
        maskIconLink = createLinkElement('mask-icon');
        manifestLink = createLinkElement('manifest');
      });

      afterEach(() => {
        for (const linkInfo of linkInfos) {
          linkInfo.el.remove();
        }
      });

      it('should update favicon', () => {
        loadOmnibar();

        fireMessageEvent({
          branding: {
            images: {
              favIcon: {
                url: customLogo,
              },
            },
          },
          messageType: 'branding-update',
        });

        validateLinkInfo(iconLink, customLogo, false);
        validateLinkInfo(appleIconLink, customLogo, false);
        validateLinkInfo(maskIconLink, undefined, true);
        validateLinkInfo(manifestLink, undefined, true);
      });

      it('should not update favicon', () => {
        loadOmnibar();

        fireMessageEvent({
          branding: {
            images: {},
          },
          messageType: 'branding-update',
        });

        validateLinkInfo(iconLink, bbLogo, false);
        validateLinkInfo(appleIconLink, bbLogo, false);
        validateLinkInfo(maskIconLink, bbLogo, false);
        validateLinkInfo(manifestLink, bbLogo, false);
      });
    });
  });

  describe('pushNotificationsEnabled() method', () => {
    let pushNotificationsEnabledSpy: jasmine.Spy<
      typeof BBOmnibarPushNotifications.pushNotificationsEnabled
    >;

    beforeEach(() => {
      pushNotificationsEnabledSpy = spyOn(
        BBOmnibarPushNotifications,
        'pushNotificationsEnabled'
      );
    });

    it('should call BBOmnibarPushNotifications.pushNotificationsEnabled() with no parameters', () => {
      loadOmnibar({
        envId: '123',
        leId: 'xyz',
        svcId: 'abc',
      });

      BBOmnibar.pushNotificationsEnabled();

      expect(pushNotificationsEnabledSpy).toHaveBeenCalledWith();
    });

    it('should return false if the omnibar has not been loaded', async () => {
      const enabled = await BBOmnibar.pushNotificationsEnabled();

      expect(enabled).toBe(false);
    });
  });

  describe('vertical navigation', () => {
    it('should be loaded when the theme is modern and the URL contains a flag', async () => {
      spyOn(BBAuthInterop, 'getCurrentUrl').and.returnValue(
        'https://example.com?leftnav=1'
      );
      spyOn(BBOmnibarVertical, 'load');

      const config = {
        theme: {
          name: 'modern',
        },
      };

      const loadPromise = loadOmnibar(config);

      expect(BBOmnibarVertical.load).toHaveBeenCalledWith(
        config,
        getIframeEl()
      );

      fireMessageEvent({
        messageType: 'ready',
      });

      await loadPromise;

      expect(postOmnibarMessageSpy.calls.argsFor(1)).toEqual([
        getIframeEl(),
        jasmine.objectContaining({
          compactNavOnly: true,
        }),
      ]);

      expect(pushNotificationsConnectSpy).toHaveBeenCalledWith(
        jasmine.objectContaining({
          showVerticalNav: true,
        })
      );
    });

    it("should be loaded when the theme is modern and the svcid is 'tcs'", async () => {
      spyOn(BBOmnibarVertical, 'load');

      const config = {
        svcId: 'tcs',
        theme: {
          name: 'modern',
        },
      };

      const loadPromise = loadOmnibar(config);

      expect(BBOmnibarVertical.load).toHaveBeenCalledWith(
        config,
        getIframeEl()
      );

      fireMessageEvent({
        messageType: 'ready',
      });

      await loadPromise;

      expect(postOmnibarMessageSpy.calls.argsFor(1)).toEqual([
        getIframeEl(),
        jasmine.objectContaining({
          compactNavOnly: true,
        }),
      ]);

      expect(pushNotificationsConnectSpy).toHaveBeenCalledWith(
        jasmine.objectContaining({
          showVerticalNav: true,
        })
      );
    });

    it('should ignore the anchor portion of the URL if present', () => {
      spyOn(BBAuthInterop, 'getCurrentUrl').and.returnValue(
        'https://example.com?foo=bar#leftnav=1'
      );
      spyOn(BBOmnibarVertical, 'load');

      const config = {
        theme: {
          name: 'modern',
        },
      };

      loadOmnibar(config);

      expect(BBOmnibarVertical.load).not.toHaveBeenCalled();
    });

    it('should notify the vertical omnibar when the current user data should be refreshed', (done) => {
      const refreshUserSpy = spyOn(BBOmnibarVertical, 'refreshUser');

      spyOn(BBAuthInterop, 'getCurrentUrl').and.returnValue(
        'https://example.com?leftnav=1'
      );
      spyOn(BBOmnibarVertical, 'load');

      startTrackingSpy.and.callFake(
        async (refreshUserCallback: () => Promise<void>) => {
          await refreshUserCallback();

          expect(refreshUserSpy).toHaveBeenCalledWith(testToken);

          done();
        }
      );

      loadOmnibar({
        theme: {
          name: 'modern',
        },
      });

      fireMessageEvent({
        messageType: 'get-token',
        tokenRequestId: 123,
      });
    });

    it('should update its minimized state when global settings change', (done) => {
      const refreshSettingsSpy = spyOn(BBOmnibarVertical, 'refreshSettings');

      pushNotificationsConnectSpy.and.callFake(async (args) => {
        args.customMessageCallback({
          value: 'custom message',
        });

        expect(refreshSettingsSpy).toHaveBeenCalled();

        done();
      });

      spyOn(BBAuthInterop, 'getCurrentUrl').and.returnValue(
        'https://example.com?leftnav=1'
      );
      spyOn(BBOmnibarVertical, 'load');

      const config = {
        theme: {
          name: 'modern',
        },
      };

      loadOmnibar(config);

      fireMessageEvent({
        messageType: 'ready',
      });
    });
  });

  describe('modern theme', () => {
    it('should be loaded when the theme is default and the URL contains a flag to force modern', async () => {
      spyOn(BBAuthInterop, 'getCurrentUrl').and.returnValue(
        'https://example.com?modernnav=1'
      );
      spyOn(BBOmnibarVertical, 'load');

      const config = {
        theme: {
          name: 'default',
        },
      };

      const loadPromise = loadOmnibar(config);

      fireMessageEvent({
        messageType: 'ready',
      });

      await loadPromise;

      expect(getEnvironmentEl()).toHaveClass(
        'sky-omnibar-environment-theme-modern'
      );
    });
  });
});
