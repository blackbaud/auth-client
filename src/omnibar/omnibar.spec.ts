import {
  BBOmnibar
} from './omnibar';

import {
  BBOmnibarConfig
} from './omnibar-config';

import {
  BBOmnibarNavigationItem
} from './omnibar-navigation-item';

import {
  BBOmnibarSearchArgs
} from './omnibar-search-args';

import {
  BBOmnibarSearchResults
} from './omnibar-search-results';

import {
  BBOmnibarUserActivity
} from './omnibar-user-activity';

import {
  BBOmnibarTheme
} from './theming';

import {
  BBAuthInterop
} from '../shared/interop';

import {
  BBAuthNavigator
} from '../shared/navigator';

import {
  BBAuth
} from '../auth';

import {
  BBOmnibarUpdateArgs
} from './omnibar-update-args';

import {
  BBOmnibarUserActivityPrompt
} from './omnibar-user-activity-prompt';

import {
  BBOmnibarUserActivityPromptShowArgs
} from './omnibar-user-activity-prompt-show-args';

import {
  BBOmnibarPushNotifications
} from './omnibar-push-notifications';

import {
  BBOmnibarToastContainer
} from './omnibar-toast-container';

import {
  BBOmnibarToastContainerInitArgs
} from './omnibar-toast-container-init-args';

import {
  BBOmnibarVertical
} from './omnibar-vertical';

describe('Omnibar', () => {
  const BASE_URL = 'about:blank';

  // tslint:disable-next-line:max-line-length
  const testToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCIxYmIuZW50aXRsZW1lbnRzIjoibm90aWYifQ.9geiUl3O3ZlEzZVNm28clN0SmZCfn3OSBnfZxNcymHc';

  // tslint:disable-next-line:max-line-length
  const testTokenWithNotificationEntitlement = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCIxYmIuZW50aXRsZW1lbnRzIjpbIm5vdGlmIiwiZm9vIl19.XskU9eHmCxzkRq0GIgmZd3MtFHZ9xaWJUWeuUkDjPb0';

  // tslint:disable-next-line:max-line-length
  const testTokenWithoutNotificationEntitlement = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';

  function loadOmnibar(config?: BBOmnibarConfig): void {
    config = config || {};
    config.url = config.url || BASE_URL;

    BBOmnibar.load(config);
  }

  function loadOmnibarWithNotifications(): void {
    loadOmnibar({
      svcId: 'renxt'
    });
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

  function fireMessageEvent(data: any, includeSource = true, hostId = 'omnibar'): void {
    data.hostId = hostId;

    if (includeSource) {
      data.source = 'skyux-spa-omnibar';
    }

    window.dispatchEvent(
      new MessageEvent('message', {
        data
      })
    );
  }

  function validateExpanded(expanded: boolean): void {
    expect(getIframeEl().classList.contains('sky-omnibar-iframe-expanded')).toBe(expanded);
  }

  function destroyOmnibar(): void {
    BBOmnibar.destroy();
  }

  let navigateSpy: jasmine.Spy;
  let postOmnibarMessageSpy: jasmine.Spy;
  let messageIsFromOmnibarSpy: jasmine.Spy;
  let getTokenSpy: jasmine.Spy;
  let startTrackingSpy: jasmine.Spy;
  let pushNotificationsConnectSpy: jasmine.Spy;
  let pushNotificationsDisconnectSpy: jasmine.Spy;
  let toastContainerInitSpy: jasmine.Spy;
  let toastContainerUpdateUrlSpy: jasmine.Spy;
  let toastContainerShowNewSpy: jasmine.Spy;
  let toastContainerDestroySpy: jasmine.Spy;

  let messageIsFromOmnibarReturnValue = true;
  let getTokenFake: () => Promise<string>;

  beforeAll(() => {
    navigateSpy = spyOn(BBAuthNavigator, 'navigate');
    postOmnibarMessageSpy = spyOn(BBAuthInterop, 'postOmnibarMessage');

    messageIsFromOmnibarSpy = spyOn(
      BBAuthInterop,
      'messageIsFromOmnibar'
    ).and.callFake(() => {
      return messageIsFromOmnibarReturnValue;
    });

    getTokenSpy = spyOn(
      BBAuth,
      'getToken'
    ).and.callFake(() => {
      return getTokenFake();
    });

    pushNotificationsConnectSpy = spyOn(
      BBOmnibarPushNotifications,
      'connect'
    ).and.returnValue(Promise.resolve());

    pushNotificationsDisconnectSpy = spyOn(
      BBOmnibarPushNotifications,
      'disconnect'
    ).and.returnValue(Promise.resolve());

    toastContainerInitSpy = spyOn(
      BBOmnibarToastContainer,
      'init'
    ).and.returnValue(Promise.resolve());

    toastContainerUpdateUrlSpy = spyOn(
      BBOmnibarToastContainer,
      'updateUrl'
    );

    toastContainerShowNewSpy = spyOn(
      BBOmnibarToastContainer,
      'showNewNotifications'
    );

    toastContainerDestroySpy = spyOn(
      BBOmnibarToastContainer,
      'destroy'
    );

    // This effectively disables activity tracking.  Without this, the test page could potentially redirect to
    // the login page during the test run when it detects no activity.
    startTrackingSpy = spyOn(BBOmnibarUserActivity, 'startTracking');

    // Disable animations so computed styles can be validated without waiting for animations to complete.
    const styleEl = document.createElement('style');

    styleEl.appendChild(document.createTextNode('* { transition: none !important }'));

    document.head.appendChild(styleEl);
  });

  beforeEach(() => {
    delete (window as any).BBHELP;

    getTokenFake = () => Promise.resolve(testToken);

    navigateSpy.calls.reset();
    postOmnibarMessageSpy.calls.reset();
    messageIsFromOmnibarSpy.calls.reset();
    getTokenSpy.calls.reset();
    startTrackingSpy.calls.reset();
    pushNotificationsConnectSpy.calls.reset();
    toastContainerInitSpy.calls.reset();
    toastContainerShowNewSpy.calls.reset();
    toastContainerDestroySpy.calls.reset();

    postOmnibarMessageSpy.and.stub();
    startTrackingSpy.and.stub();
  });

  afterEach(() => {
    messageIsFromOmnibarReturnValue = true;

    navigateSpy.calls.reset();
    postOmnibarMessageSpy.calls.reset();
    messageIsFromOmnibarSpy.calls.reset();
    getTokenSpy.calls.reset();

    postOmnibarMessageSpy.and.stub();

    destroyOmnibar();
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
      url: BASE_URL + '?test=value'
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
      messageType: 'display-ready'
    });

    expect(getComputedStyle(placeholderEl).display).toBe('none');
    expect(getComputedStyle(iframeEl).visibility).toBe('visible');
  });

  it('should style the placeholder element based on the provided theme', () => {
    loadOmnibar({
      theme: {
        backgroundColor: 'rgb(123, 0, 4)'
      }
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
          color: 'rgb(3, 5, 6)'
        }
      }
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
        accent: false
      }
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
        name: 'modern'
      }
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
    postOmnibarMessageSpy.and.callFake(
      (iframeEl: HTMLIFrameElement, data: any) => {
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
      allowAnonymous: true
    });

    fireMessageEvent({
      messageType: 'get-token',
      tokenRequestId: 123
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

    it('should ignore messages that do not originate from this hostId', () => {
      loadOmnibar();

      fireMessageEvent(
        {
          messageType: 'get-token'
        },
        true,
        'context-provider'
      );

      expect(getTokenSpy).not.toHaveBeenCalled();
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

    it('should call the config\'s onSearch() callback when search is invoked', () => {
      const config = {
        onSearch: (searchArgs: BBOmnibarSearchArgs) => {
          return Promise.resolve(undefined);
        }
      };

      const onSearchSpy = spyOn(config, 'onSearch').and.callThrough();

      loadOmnibar(config);

      fireMessageEvent({
        messageType: 'search',
        searchArgs: {
          searchText: 'abc'
        }
      });

      expect(onSearchSpy).toHaveBeenCalledWith({
        searchText: 'abc'
      });
    });

    it('should not attempt to call the config\'s onSearch() callback when it is not defined', () => {
      loadOmnibar();

      fireMessageEvent({
        messageType: 'search',
        searchArgs: {
          searchText: 'abc'
        }
      });

      // Should not throw an error.
    });

    it('should call the notification config\'s onReady() callback', () => {
      const config = {
        notifications: {
          onReady: jasmine.createSpy('onReady')
        }
      };

      loadOmnibar(config);

      fireMessageEvent({
        messageType: 'ready'
      });

      expect(config.notifications.onReady).toHaveBeenCalled();
    });

    it('should call the notification config\'s onNotificationRead() callback', () => {
      const config = {
        notifications: {
          onNotificationRead: jasmine.createSpy('onNotificationRead'),
          onReady: jasmine.createSpy('onReady')
        }
      };

      loadOmnibar(config);

      fireMessageEvent({
        messageType: 'notification-read',
        notification: {
          id: 1
        }
      });

      expect(config.notifications.onNotificationRead).toHaveBeenCalledWith({
        id: 1
      });
    });

    it('should not call the notification config\'s onNotificationRead() callback if not specified', () => {
      const config = {
        notifications: {
          onReady: jasmine.createSpy('onReady')
        }
      };

      loadOmnibar(config);

      fireMessageEvent({
        messageType: 'notification-read',
        notification: {
          id: 1
        }
      });

      // Should not throw an error.
    });

    it('should open the help widget if the help widget is present on the page', () => {
      loadOmnibar();

      const openSpy = jasmine.createSpy('open');

      (window as any).BBHELP = {
        HelpWidget: {
          open: openSpy
        }
      };

      fireMessageEvent({
        messageType: 'help-open'
      });

      expect(openSpy).toHaveBeenCalled();
    });

    it('should not attempt to open the help widget if the help widget is not present on the page', () => {
      loadOmnibar();

      fireMessageEvent({
        messageType: 'help-open'
      });

      // Should not throw an error.
    });

    it('should provide a way to renew the user session', () => {
      loadOmnibar();

      const userRenewedSessionSpy = spyOn(BBOmnibarUserActivity, 'userRenewedSession');

      fireMessageEvent({
        messageType: 'session-renew'
      });

      expect(userRenewedSessionSpy).toHaveBeenCalled();
    });

    it('should display the current environment when specified by the omnibar', () => {
      loadOmnibar();

      const environmentEl = document.querySelector('.sky-omnibar-environment') as any;
      const environmentNameEl = document.querySelector('.sky-omnibar-environment-name') as any;
      const environmentInfoEl = document.querySelector('.sky-omnibar-environment-description') as any;
      let environmentInfoLinkEl: any;

      const validateVisible = (visible: boolean) => {
        expect(document.body.classList.contains('sky-omnibar-environment-visible')).toBe(visible);
        expect(getComputedStyle(environmentEl).height).toBe(visible ? '24px' : '0px');
        expect(environmentNameEl.innerText.trim()).toBe(visible ? 'Environment name' : '');
      };

      const validateDescription = (visible: boolean, url?: boolean) => {
        expect(environmentEl.classList.contains('sky-omnibar-environment-description-present')).toBe(visible);

        environmentInfoLinkEl = environmentInfoEl.querySelector('a');

        if (visible && url) {
          expect(environmentInfoLinkEl.innerText.trim()).toBe('Test environment');
          expect(environmentInfoLinkEl.href).toBe('https://app.blackbaud.com/auth-client-env-url');
        } else {
          expect(environmentInfoLinkEl).toBe(null);
          expect(environmentInfoEl.innerText.trim()).toBe(visible ? 'Test environment' : '');
        }
      };

      validateVisible(false);
      validateDescription(false);

      fireMessageEvent({
        messageType: 'environment-update',
        name: 'Environment name'
      });

      validateVisible(true);
      validateDescription(false);

      fireMessageEvent({
        messageType: 'environment-update',
        name: undefined
      });

      validateVisible(false);
      validateDescription(false);

      fireMessageEvent({
        description: 'Test environment',
        messageType: 'environment-update',
        name: 'Environment name'
      });

      validateVisible(true);
      validateDescription(true);

      fireMessageEvent({
        description: 'Test environment',
        messageType: 'environment-update',
        name: 'Environment name',
        url: 'https://app.blackbaud.com/auth-client-env-url'
      });

      validateVisible(true);
      validateDescription(true, true);
    });

    it('should restart activity tracking when the legacy session keep-alive URL changes', () => {
      loadOmnibar();

      startTrackingSpy.calls.reset();

      fireMessageEvent({
        messageType: 'legacy-keep-alive-url-change',
        url: 'https://example.com/track'
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
        titleParts: []
      });

      fireMessageEvent({
        messageType: 'selected-service-update',
        serviceName
      });

      expect(document.title).toBe(serviceName);
    });

    it('should not set the document title with the service name if setTitle has not been called', () => {
      loadOmnibar();

      const serviceName = 'test service 2';

      fireMessageEvent({
        messageType: 'selected-service-update',
        serviceName
      });

      expect(document.title).not.toBe(serviceName);
    });

    it('should set the document title with the number of unread notifications', (done) => {
      pushNotificationsConnectSpy.and.callFake((envId, leId, cb) => {
        expect(document.title).toBe('with notifications - test service');

        cb(
          {
            notifications: [
              {
                notificationId: '1',
                shortMessage: 'Hello world'
              }
            ]
          }
        );

        expect(document.title).toBe('(1) with notifications - test service');

        done();
      });

      getTokenFake = () => Promise.resolve(testTokenWithNotificationEntitlement);

      loadOmnibarWithNotifications();

      fireMessageEvent({
        messageType: 'ready'
      });

      const serviceName = 'test service';

      BBOmnibar.setTitle({
        titleParts: [
          'with notifications'
        ]
      });

      fireMessageEvent({
        messageType: 'selected-service-update',
        serviceName
      });
    });

    it('should show the inactivity prompt', (done) => {
      const showSpy = spyOn(BBOmnibarUserActivityPrompt, 'show');

      startTrackingSpy.and.callFake((
        refreshUserCallback: () => void,
        showInactivityCallback: () => void
      ) => {
        showInactivityCallback();

        expect(showSpy).toHaveBeenCalled();

        done();
      });

      loadOmnibar();

      // Getting a token starts the activity tracking.
      fireMessageEvent({
        messageType: 'get-token'
      });
    });

    it('should renew the session when the user dismisses the inactivity prompt', (done) => {
      spyOn(BBOmnibarUserActivityPrompt, 'show').and.callFake((args: BBOmnibarUserActivityPromptShowArgs) => {
        args.sessionRenewCallback();
      });

      const userRenewedSessionSpy = spyOn(BBOmnibarUserActivity, 'userRenewedSession');

      startTrackingSpy.and.callFake((
        refreshUserCallback: () => void,
        showInactivityCallback: () => void
      ) => {
        showInactivityCallback();

        expect(userRenewedSessionSpy).toHaveBeenCalled();

        done();
      });

      loadOmnibar();

      // Getting a token starts the activity tracking.
      fireMessageEvent({
        messageType: 'get-token'
      });
    });

    it('should hide the inactivity prompt', (done) => {
      const hideSpy = spyOn(BBOmnibarUserActivityPrompt, 'hide');

      startTrackingSpy.and.callFake((
        refreshUserCallback: () => void,
        showInactivityCallback: () => void,
        hideInactivityCallback: () => void
      ) => {
        hideInactivityCallback();

        expect(hideSpy).toHaveBeenCalled();

        done();
      });

      loadOmnibar();

      // Getting a token starts the activity tracking.
      fireMessageEvent({
        messageType: 'get-token'
      });
    });

    it('should handle updates to push notifications', () => {
      const testNotifications = [
        {
          isRead: true,
          notificationId: '1'
        }
      ];

      const updateNotificationsSpy = spyOn(BBOmnibarPushNotifications, 'updateNotifications');

      loadOmnibar();

      fireMessageEvent({
        messageType: 'push-notifications-change',
        notifications: testNotifications
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
          url: 'https://example.com/'
        }
      ];

      const theme: BBOmnibarTheme = {
        backgroundColor: 'green'
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
                  url: 'https://example.com/'
                }
              ],
              title: 'Some service'
            }
          ]
        },
        navVersion,
        onSearch: (searchArgs) => {
          return undefined;
        },
        svcId,
        theme
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
                  url: 'https://example.com/'
                }
              ],
              title: 'Some service'
            }
          ],
          svcId,
          theme
        }
      ]);
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

    it('should notify the omnibar when search results are available', (done) => {
      postOmnibarMessageSpy.and.callFake(() => {
        expect(postOmnibarMessageSpy).toHaveBeenCalledWith(
          getIframeEl(),
          {
            messageType: 'search-results',
            results: {
              items: [
                {
                  title: 'test',
                  url: 'https://example.com/'
                }
              ],
              searchArgs: {
                searchText: 'abc'
              }
            } as BBOmnibarSearchResults
          }
        );

        done();
      });

      const config = {
        onSearch: (searchArgs: BBOmnibarSearchArgs) => {
          return Promise.resolve({
            items: [
              {
                title: 'test',
                url: 'https://example.com/'
              }
            ],
            searchArgs
          });
        }
      };

      loadOmnibar(config);

      fireMessageEvent({
        messageType: 'search',
        searchArgs: {
          searchText: 'abc'
        }
      });
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

    it('should notify the omnibar when the current user data should be refreshed', (done) => {
      postOmnibarMessageSpy.and.callFake(
        (iframeEl: HTMLIFrameElement, data: any) => {
          // The first call to this spy will be to return the requested token, so ignore that
          // one and look for the refresh-user call.
          if (data.messageType === 'refresh-user') {
            expect(postOmnibarMessageSpy).toHaveBeenCalledWith(
              getIframeEl(),
              {
                messageType: 'refresh-user',
                token: testToken
              }
            );

            done();
          }
        }
      );

      startTrackingSpy.and.callFake((refreshUserCallback: () => void) => {
        refreshUserCallback();
      });

      loadOmnibar();

      fireMessageEvent({
        messageType: 'get-token',
        tokenRequestId: 123
      });
    });

    it('should notify the omnibar when the current user has logged out', (done) => {
      postOmnibarMessageSpy.and.callFake(
        (iframeEl: HTMLIFrameElement, data: any) => {
          // The first call to this spy will be to return the requested token, so ignore that
          // one and look for the refresh-user call.
          if (data.messageType === 'refresh-user') {
            expect(postOmnibarMessageSpy).toHaveBeenCalledWith(
              getIframeEl(),
              {
                messageType: 'refresh-user',
                token: undefined
              }
            );

            done();
          }
        }
      );

      startTrackingSpy.and.callFake((refreshUserCallback: () => void) => {
        refreshUserCallback();
      });

      getTokenFake = () => {
        return Promise.reject('The user is not logged in.');
      };

      loadOmnibar();

      fireMessageEvent({
        messageType: 'get-token',
        tokenRequestId: 123
      });
    });

    it('should notify the omnibar when notifications are updated', () => {
      const notifications = {
        items: [
          {
            id: 1,
            title: 'Hi'
          }
        ]
      };

      const config: BBOmnibarConfig = {
        notifications: {
          onReady: (readyArgs) => {
            readyArgs.updateNotifications(notifications);
          }
        }
      };

      loadOmnibar(config);

      fireMessageEvent({
        messageType: 'ready'
      });

      expect(postOmnibarMessageSpy.calls.argsFor(2)).toEqual([
        getIframeEl(),
        {
          messageType: 'notifications-update',
          notifications
        }
      ]);
    });

    it('should notify the omnibar when update() is called', (done) => {
      const updateArgs: BBOmnibarUpdateArgs = {
        compactNavOnly: true,
        nav: {
          services: [
            {
              title: 'Test Service'
            }
          ]
        },
        theme: {
          backgroundColor: '#abc'
        }
      };

      postOmnibarMessageSpy.and.callFake(() => {
        expect(postOmnibarMessageSpy).toHaveBeenCalledWith(
          getIframeEl(),
          {
            messageType: 'update',
            updateArgs
          }
        );

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
        serviceName
      });

      BBOmnibar.setTitle({titleParts: ['Dropdown', 'Components']});

      expect(document.title).toBe('Dropdown - Components - Test Service');
    });

    it('should notify the omnibar and the toast container when new push notifications arrive', (done) => {
      let notificationsUpdatePosted: boolean;

      const testNotifications = {
        notifications: [
          {
            notificationId: '1',
            shortMessage: 'Hello world'
          }
        ]
      };

      postOmnibarMessageSpy.and.callFake(
        (iframeEl: HTMLIFrameElement, data: any) => {
          if (data.messageType === 'push-notifications-update') {
            expect(postOmnibarMessageSpy).toHaveBeenCalledWith(
              getIframeEl(),
              {
                messageType: 'push-notifications-update',
                pushNotifications: testNotifications
              }
            );

            notificationsUpdatePosted = true;
          }
        }
      );

      toastContainerShowNewSpy.and.callFake(() => {
        expect(notificationsUpdatePosted).toBe(true);
        expect(toastContainerShowNewSpy).toHaveBeenCalledWith(testNotifications);

        done();
      });

      pushNotificationsConnectSpy.and.callFake((envId, leId, cb) => {
        cb(testNotifications);
      });

      loadOmnibarWithNotifications();

      fireMessageEvent({
        messageType: 'ready'
      });
    });

    it('should disconnect push notifications when the user logs out', (done) => {
      startTrackingSpy.and.callFake((refreshUserCallback: () => void) => {
        refreshUserCallback();
      });

      loadOmnibarWithNotifications();

      fireMessageEvent({
        messageType: 'get-token',
        tokenRequestId: 123
      });

      pushNotificationsConnectSpy.and.callFake(() => {
        pushNotificationsDisconnectSpy.and.callFake(() => {
          expect(toastContainerDestroySpy).toHaveBeenCalled();
          done();
        });

        getTokenFake = () => Promise.reject('The user is not logged in');

        fireMessageEvent({
          messageType: 'get-token',
          tokenRequestId: 124
        });
      });
    });

    it('should not connect to push notifications again when the user session changes', (done) => {
      startTrackingSpy.and.callFake((refreshUserCallback: () => void) => {
        refreshUserCallback();
        refreshUserCallback();

        // There's no great way to test that the toast container init method has only been called once
        // since there's nothing that happens the second time, hence the setTimeout().
        setTimeout(() => {
          expect(toastContainerInitSpy).toHaveBeenCalledTimes(1);

          done();
        });
      });

      loadOmnibarWithNotifications();

      fireMessageEvent({
        messageType: 'get-token',
        tokenRequestId: 123
      });
    });

    it('should notify the omnibar to open the push notifications menu', (done) => {
      startTrackingSpy.and.callFake((refreshUserCallback: () => void) => {
        refreshUserCallback();
      });

      toastContainerInitSpy.and.callFake((args: BBOmnibarToastContainerInitArgs) => {
        args.openMenuCallback();

        expect(postOmnibarMessageSpy).toHaveBeenCalledWith(
          getIframeEl(),
          {
            messageType: 'push-notifications-open'
          }
        );

        done();
      });

      loadOmnibarWithNotifications();

      fireMessageEvent({
        messageType: 'get-token',
        tokenRequestId: 123
      });
    });

    it('should not connect to push notifications if the required entitlement is missing', (done) => {
      startTrackingSpy.and.callFake((refreshUserCallback: () => void) => {
        refreshUserCallback();

        setTimeout(() => {
          expect(toastContainerInitSpy).not.toHaveBeenCalled();

          done();
        });
      });

      getTokenFake = () => Promise.resolve(testTokenWithoutNotificationEntitlement);

      loadOmnibarWithNotifications();

      fireMessageEvent({
        messageType: 'get-token',
        tokenRequestId: 123
      });
    });

    it('should connect to push notifications if the required entitlement is in an array in the JWT', (done) => {
      startTrackingSpy.and.callFake((refreshUserCallback: () => void) => {
        refreshUserCallback();

        setTimeout(() => {
          expect(toastContainerInitSpy).toHaveBeenCalled();

          expect(toastContainerUpdateUrlSpy).toHaveBeenCalledWith(location.href);

          done();
        });
      });

      getTokenFake = () => Promise.resolve(testTokenWithNotificationEntitlement);

      loadOmnibarWithNotifications();

      fireMessageEvent({
        messageType: 'get-token',
        tokenRequestId: 123
      });
    });

    describe('when connecting to notifications', () => {

      function testSvcId(
        svcId: string,
        tokenSpyCalled: boolean,
        notificationsInitialized: boolean
      ): Promise<void> {
        return new Promise((resolve) => {
          startTrackingSpy.and.callFake((refreshUserCallback: () => void) => {
            refreshUserCallback();

            setTimeout(() => {
              let allArgsExpectation = expect(getTokenSpy.calls.allArgs());
              if (!tokenSpyCalled) {
                allArgsExpectation = allArgsExpectation.not;
              }
              allArgsExpectation.toContain(
                [{
                  disableRedirect: true,
                  envId: 'envid',
                  leId: 'leid',
                  permissionScope: 'Notifications'
                }]
              );

              let toastContainerExpectation = expect(toastContainerInitSpy);
              if (!notificationsInitialized) {
                toastContainerExpectation = toastContainerExpectation.not;
              }
              toastContainerExpectation.toHaveBeenCalled();

              getTokenSpy.calls.reset();
              toastContainerInitSpy.calls.reset();
              destroyOmnibar();

              resolve();
            });
          });

          loadOmnibar({
            envId: 'envid',
            leId: 'leid',
            svcId
          });

          fireMessageEvent({
            messageType: 'get-token',
            tokenRequestId: 123
          });
        });
      }

      it('should respect the notification settings for a given service ID', async () => {
        await testSvcId('renxt', true, true);
        await testSvcId('fenxt', true, true);
        await testSvcId('skydev', false, true);
        await testSvcId('skydevhome', false, true);
        await testSvcId('skyux', false, true);
        await testSvcId('other', false, false);
        await testSvcId('faith', true, true);
        await testSvcId('tcs', true, true);
        await testSvcId('chrch', true, true);
      });

    });

  });

  describe('pushNotificationsEnabled() method', () => {

    it('should return false if the omnibar has not been initialized', (done) => {
      BBOmnibar.pushNotificationsEnabled()
        .then((enabled) => {
          expect(enabled).toBe(false);
          done();
        });
    });

    it('should check the token for the notif entitlement', (done) => {
      loadOmnibarWithNotifications();

      getTokenFake = () => Promise.resolve(testTokenWithoutNotificationEntitlement);

      BBOmnibar.pushNotificationsEnabled()
        .then((enabledWithoutNotif) => {
          expect(enabledWithoutNotif).toBe(false);

          getTokenFake = () => Promise.resolve(testTokenWithNotificationEntitlement);

          BBOmnibar.pushNotificationsEnabled()
            .then((enabledWithNotif) => {
              expect(enabledWithNotif).toBe(true);
              done();
            });
        });
    });

    it('should return false if retrieving a token fails', (done) => {
      loadOmnibarWithNotifications();

      getTokenFake = () => Promise.reject('The user is not logged in');

      BBOmnibar.pushNotificationsEnabled()
        .then((enabled) => {
          expect(enabled).toBe(false);
          done();
        });
    });

  });

  describe('vertical navigation', () => {

    it('should be loaded when the theme is modern and the URL contains a flag', () => {
      spyOn(BBAuthInterop, 'getCurrentUrl').and.returnValue('https://example.com?leftnav=1');
      spyOn(BBOmnibarVertical, 'load');

      const config = {
        theme: {
          name: 'modern'
        }
      };

      loadOmnibar(config);

      expect(BBOmnibarVertical.load).toHaveBeenCalledWith(config, getIframeEl());

      fireMessageEvent({
        messageType: 'ready'
      });

      expect(postOmnibarMessageSpy.calls.argsFor(1)).toEqual([
        getIframeEl(),
        jasmine.objectContaining({
          compactNavOnly: true
        })
      ]);
    });

    it('should ignore the anchor portion of the URL if present', () => {
      spyOn(BBAuthInterop, 'getCurrentUrl').and.returnValue('https://example.com?foo=bar#leftnav=1');
      spyOn(BBOmnibarVertical, 'load');

      const config = {
        theme: {
          name: 'modern'
        }
      };

      loadOmnibar(config);

      expect(BBOmnibarVertical.load).not.toHaveBeenCalled();
    });

    it('should notify the vertical omnibar when the current user data should be refreshed', (done) => {
      spyOn(BBAuthInterop, 'getCurrentUrl').and.returnValue('https://example.com?leftnav=1');
      spyOn(BBOmnibarVertical, 'load');

      spyOn(BBOmnibarVertical, 'refreshUser').and.callFake(() => {
        done();
      });

      startTrackingSpy.and.callFake((refreshUserCallback: () => void) => {
        refreshUserCallback();
      });

      loadOmnibar(
        {
          theme: {
            name: 'modern'
          }
        }
      );

      fireMessageEvent({
        messageType: 'get-token',
        tokenRequestId: 123
      });
    });
  });

});
