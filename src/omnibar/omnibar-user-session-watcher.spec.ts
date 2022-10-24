import { BBOmnibarUserSessionWatcher } from './omnibar-user-session-watcher';

import { BBAuthInterop } from '../shared/interop';
import { BBAuthNavigator } from '../shared/navigator';

describe('Omnibar user session watcher', () => {
  const TEST_LEGACY_KEEP_ALIVE_ORIGIN = 'https://example.com';
  const SIGNIN_URL = 'https://signin.blackbaud.com/signin/';

  let navigateSpy: jasmine.Spy;
  let refreshUserCallbackSpy: jasmine.Spy;
  let stateChangeSpy: jasmine.Spy;

  function postSessionChange(refreshId: string, sessionId: string) {
    window.dispatchEvent(
      new MessageEvent('message', {
        data: JSON.stringify({
          message: {
            refreshId,
            sessionId,
          },
          messageType: 'session_change',
        }),
        origin:
          BBOmnibarUserSessionWatcher.IDENTITY_SECURITY_TOKEN_SERVICE_ORIGIN,
      })
    );
  }

  function postLegacyKeepAliveReady(
    legacyTtl: number,
    legacySigninUrl?: string
  ) {
    window.dispatchEvent(
      new MessageEvent('message', {
        data: {
          messageType: 'ready',
          signinUrl: legacySigninUrl,
          ttl: legacyTtl,
        },
        origin: TEST_LEGACY_KEEP_ALIVE_ORIGIN,
      })
    );
  }

  function getWatcherIFrame() {
    return document.querySelectorAll('.sky-omnibar-iframe-session-watcher');
  }

  function getLegacyKeepAliveIFrame() {
    return document.querySelectorAll('.sky-omnibar-iframe-legacy-keep-alive');
  }

  function startWatching(allowAnonymous = false, legacyKeepAliveUrl?: string) {
    BBOmnibarUserSessionWatcher.start(
      allowAnonymous,
      legacyKeepAliveUrl,
      refreshUserCallbackSpy,
      stateChangeSpy
    );
  }

  beforeAll(() => {
    navigateSpy = spyOn(BBAuthNavigator, 'navigate');
    refreshUserCallbackSpy = jasmine.createSpy('refreshUserCallback');
    stateChangeSpy = jasmine.createSpy('stateChange');
  });

  beforeEach(() => {
    navigateSpy.calls.reset();
    refreshUserCallbackSpy.calls.reset();
    stateChangeSpy.calls.reset();
  });

  afterEach(() => {
    BBOmnibarUserSessionWatcher.stop();
  });

  it('should not start watching again if watching has already started', () => {
    startWatching();

    let watcherIFrameEl = getWatcherIFrame();

    startWatching();

    expect(getWatcherIFrame().length).toBe(1);
    expect(getWatcherIFrame()[0]).toBe(watcherIFrameEl[0]);

    watcherIFrameEl = undefined;
  });

  it('should start watching again if watching has already started and the allow anonymous flag changes', () => {
    startWatching(undefined);

    let watcherIFrameEl = getWatcherIFrame();
    let legacyKeepAliveIFrameEl = getLegacyKeepAliveIFrame();

    startWatching(true, TEST_LEGACY_KEEP_ALIVE_ORIGIN + '/legacy');

    // When tracking is restarted, the IFRAMEs should be removed from the DOM and
    // new ones created and added to the DOM.
    expect(getWatcherIFrame().length).toBe(1);
    expect(getWatcherIFrame()[0]).not.toBe(watcherIFrameEl[0]);

    expect(getLegacyKeepAliveIFrame().length).toBe(1);
    expect(getLegacyKeepAliveIFrame()[0]).not.toBe(legacyKeepAliveIFrameEl[0]);

    watcherIFrameEl = undefined;
    legacyKeepAliveIFrameEl = undefined;
  });

  it("should call the specified callback when the current user's info changes", () => {
    startWatching();

    postSessionChange('abc', '123');

    expect(refreshUserCallbackSpy).not.toHaveBeenCalled();

    postSessionChange('abc', '456');

    expect(refreshUserCallbackSpy).toHaveBeenCalled();
  });

  it('should notify the caller when the legacy TTL value has changed', () => {
    startWatching(false, TEST_LEGACY_KEEP_ALIVE_ORIGIN + '/legacy');

    postLegacyKeepAliveReady(123);

    expect(stateChangeSpy).toHaveBeenCalledWith({
      legacyTtl: 123,
    });

    stateChangeSpy.calls.reset();

    postLegacyKeepAliveReady(456);

    expect(stateChangeSpy).toHaveBeenCalledWith({
      legacyTtl: 456,
    });
  });

  it("should notify the legacy keep-alive IFRAME when the user's session is refreshed", () => {
    startWatching(false, TEST_LEGACY_KEEP_ALIVE_ORIGIN + '/legacy');

    const postOmnibarMessageSpy = spyOn(BBAuthInterop, 'postOmnibarMessage');

    postLegacyKeepAliveReady(123);

    postSessionChange('abc', '123');
    postSessionChange('def', '123');

    expect(postOmnibarMessageSpy).toHaveBeenCalledWith(
      getLegacyKeepAliveIFrame()[0],
      {
        messageType: 'session-refresh',
      },
      TEST_LEGACY_KEEP_ALIVE_ORIGIN
    );
  });

  it("should attempt to post a message to the legacy keep-alive IFRAME if it doesn't exist", () => {
    startWatching(false);

    const postOmnibarMessageSpy = spyOn(BBAuthInterop, 'postOmnibarMessage');

    postLegacyKeepAliveReady(123);

    postSessionChange('abc', '123');
    postSessionChange('def', '123');

    expect(postOmnibarMessageSpy).not.toHaveBeenCalled();
  });

  it('should redirect the user to the login page if the user logs out in another browser tab', () => {
    startWatching();

    window.dispatchEvent(
      new MessageEvent('message', {
        data: JSON.stringify({
          message: {
            sessionId: undefined,
          },
          messageType: 'session_change',
        }),
        origin:
          BBOmnibarUserSessionWatcher.IDENTITY_SECURITY_TOKEN_SERVICE_ORIGIN,
      })
    );

    expect(navigateSpy).toHaveBeenCalledWith(
      SIGNIN_URL + '?redirectUrl=' + encodeURIComponent(location.href)
    );
  });

  it('should redirect the user to the legacy sign in page if specified', () => {
    startWatching(false, TEST_LEGACY_KEEP_ALIVE_ORIGIN + '/legacy');

    postLegacyKeepAliveReady(10000, 'https://example.com/legacy-signin');

    window.dispatchEvent(
      new MessageEvent('message', {
        data: JSON.stringify({
          message: {
            sessionId: undefined,
          },
          messageType: 'session_change',
        }),
        origin:
          BBOmnibarUserSessionWatcher.IDENTITY_SECURITY_TOKEN_SERVICE_ORIGIN,
      })
    );

    expect(navigateSpy).toHaveBeenCalledWith(
      'https://example.com/legacy-signin'
    );
  });

  it('should hide session tracker IFRAMEs from assistive technology', () => {
    function validateIframe(iframeEl: Element) {
      expect(iframeEl.getAttribute('tabindex')).toBe('-1');
      expect(iframeEl.getAttribute('aria-hidden')).toBe('true');
    }

    startWatching(false, TEST_LEGACY_KEEP_ALIVE_ORIGIN + '/legacy');

    validateIframe(getWatcherIFrame()[0]);
    validateIframe(getLegacyKeepAliveIFrame()[0]);
  });

  it('should not take up any space', () => {
    startWatching(false, TEST_LEGACY_KEEP_ALIVE_ORIGIN + '/legacy');

    const iframeEl = getWatcherIFrame()[0];
    expect(iframeEl.getAttribute('style')).toContain('display: block');
    expect(iframeEl.getAttribute('height')).toBe('0');
    expect(iframeEl.getAttribute('width')).toBe('0');
  });

  it('should ignore unexpected event data without throwing an error', () => {
    startWatching();

    window.dispatchEvent(
      new MessageEvent('message', {
        data: {
          foo: 'bar',
        },
        origin:
          BBOmnibarUserSessionWatcher.IDENTITY_SECURITY_TOKEN_SERVICE_ORIGIN,
      })
    );

    window.dispatchEvent(
      new MessageEvent('message', {
        data: 'asdf',
        origin:
          BBOmnibarUserSessionWatcher.IDENTITY_SECURITY_TOKEN_SERVICE_ORIGIN,
      })
    );

    window.dispatchEvent(
      new MessageEvent('message', {
        data: JSON.stringify({
          messageType: 'foo',
        }),
        origin:
          BBOmnibarUserSessionWatcher.IDENTITY_SECURITY_TOKEN_SERVICE_ORIGIN,
      })
    );

    window.dispatchEvent(
      new MessageEvent('message', {
        data: JSON.stringify({
          messageType: 'session_change',
        }),
        origin: undefined,
      })
    );
  });

  it('should restart watching when the legacy keep alive URL changes', () => {
    const sessionWatcherStopSpy = spyOn(
      BBOmnibarUserSessionWatcher,
      'stop'
    ).and.callThrough();

    function validateWatch(callCount: number, legacyIFramePresent: boolean) {
      expect(sessionWatcherStopSpy.calls.count()).toBe(callCount);

      const iframeEl = document.querySelector(
        '.sky-omnibar-iframe-legacy-keep-alive'
      ) as HTMLIFrameElement;

      if (legacyIFramePresent) {
        expect(iframeEl).not.toBeNull();
        expect(iframeEl.src).toBe('https://example.com/keep-alive');
      } else {
        expect(iframeEl).toBeNull();
      }
    }

    startWatching(false, undefined);
    validateWatch(1, false);

    startWatching(false, undefined);
    validateWatch(1, false);

    startWatching(false, 'https://example.com/keep-alive');
    validateWatch(2, true);

    startWatching(false, undefined);
    validateWatch(3, false);
  });
});
