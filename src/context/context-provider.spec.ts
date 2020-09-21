//#region imports

import {
  BBAuth,
  BBAuthTokenErrorCode
} from '../auth';

import {
  BBAuthInterop
} from '../shared/interop';

import {
  BBCsrfXhr
} from '../shared/csrf-xhr';

import {
  BBAuthNavigator
} from '../shared/navigator';

import {
  BBContextArgs
} from './context-args';

import {
  BBContextProvider
} from './context-provider';

import {
  BBContextDestinations
} from './context-destinations';

//#endregion

describe('Context provider', () => {
  let messageIsFromOmnibarReturnValue: boolean;

  let testDestinationsSingle: BBContextDestinations;
  let testDestinationsMultiple: BBContextDestinations;
  let testDestinationsNone: BBContextDestinations;

  let postOmnibarMessageSpy: jasmine.Spy;
  let messageIsFromOmnibarSpy: jasmine.Spy;
  let redirectToErrorSpy: jasmine.Spy;

  let getTokenFake: () => Promise<string>;

  function getIframeEl(): HTMLIFrameElement {
    return document.querySelector('.sky-omnibar-welcome-iframe') as HTMLIFrameElement;
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

  function replyWithDestinations(svcId: string, referringUrl: string, navigation: BBContextDestinations) {
    getTokenFake = () => Promise.resolve('some_token');

    spyOn(BBCsrfXhr, 'requestWithToken').and.callFake(
      (url: string, token: string): Promise<BBContextDestinations> => {
        let expectedUrl = 'https://s21anavnavaf00blkbapp01.sky.blackbaud.com/user/destinations?svcid=' +
          encodeURIComponent(svcId);

        if (referringUrl) {
          expectedUrl += '&referringurl=' + encodeURIComponent(referringUrl);
        }

        expect(url).toBe(expectedUrl);

        expect(token).toBe('some_token');

        return Promise.resolve(navigation);
      }
    );
  }

  function whenIframeLoaded() {
    return new Promise<HTMLIFrameElement>((resolve) => {
      const interval = setInterval(() => {
        const iframeEl = getIframeEl();

        if (iframeEl) {
          clearInterval(interval);
          resolve(iframeEl);
        }
      }, 100);
    });
  }

  beforeEach(() => {
    BBContextProvider.url = 'about:blank';

    postOmnibarMessageSpy = spyOn(BBAuthInterop, 'postOmnibarMessage');

    messageIsFromOmnibarSpy = spyOn(
      BBAuthInterop,
      'messageIsFromOmnibar'
    ).and.callFake(() => {
      return messageIsFromOmnibarReturnValue;
    });

    redirectToErrorSpy = spyOn(BBAuthNavigator, 'redirectToError');

    spyOn(
      BBAuth,
      'getToken'
    ).and.callFake(() => {
      return getTokenFake();
    });

    messageIsFromOmnibarSpy.calls.reset();
    redirectToErrorSpy.calls.reset();
    postOmnibarMessageSpy.calls.reset();

    testDestinationsSingle = {
      items: [
        {
          entitlementName: 'Entitlement 1',
          url: 'https://example.com/entitlement-1'
        }
      ]
    };

    testDestinationsMultiple = {
      items: [
        {
          entitlementName: 'Entitlement 1',
          url: 'https://example.com/entitlement-1'
        },
        {
          entitlementName: 'Entitlement 2',
          url: 'https://example.com/entitlement-2'
        }
      ]
    };

    testDestinationsNone = {
      items: []
    };
  });

  afterEach(() => {
    getTokenFake = undefined;

    messageIsFromOmnibarSpy.calls.reset();
    redirectToErrorSpy.calls.reset();
    postOmnibarMessageSpy.calls.reset();

    messageIsFromOmnibarReturnValue = true;

    fireMessageEvent({
      messageType: 'welcome-cancel'
    });
  });

  it('should automatically resolve if environment ID is not required', async (done) => {
    const args = await BBContextProvider.ensureContext({
      envIdRequired: false
    });

    expect(args.envId).toBeUndefined();
    done();
  });

  it('should automatically resolve if environment ID is required but provided', async (done) => {
    const args = await BBContextProvider.ensureContext({
      envId: '123',
      envIdRequired: true
    });

    expect(args.envId).toBe('123');
    done();
  });

  it('should redirect to an error page if environment ID is required but the user is not in an environment', (done) => {
    replyWithDestinations(
      'abc',
      '',
      {
        context: {},
        items: []
      }
    );

    BBContextProvider.ensureContext({
      envIdRequired: true,
      svcId: 'abc'
    });

    setTimeout(() => {
      expect(redirectToErrorSpy).toHaveBeenCalledWith(
        BBAuthTokenErrorCode.InvalidEnvironment
      );

      done();
    });
  });

  it(
    'should not redirect if disableRedirect and environment ID is required but the user is not in an environment',
    async (done) => {
      const expectedArgs: BBContextArgs = {
        url: 'custom-url'
      };

      const invalidContextHandler = jasmine.createSpy('invalidContextHandler')
        .and
        .returnValue(expectedArgs);

      replyWithDestinations(
        'abc',
        '',
        {
          context: {},
          items: []
        }
      );

      const args = {
        disableRedirect: true,
        envIdRequired: true,
        svcId: 'abc'
      };

      expectAsync(BBContextProvider.ensureContext(args)).toBeRejectedWith(
        BBAuthTokenErrorCode.InvalidEnvironment
      );

      done();
    }
  );

  it('should redirect to an error page if environment ID is required but service ID is not specified', () => {
    replyWithDestinations(
      'abc',
      '',
      testDestinationsNone
    );

    BBContextProvider.ensureContext({
      envIdRequired: true
    });

    expect(redirectToErrorSpy).toHaveBeenCalledWith(
      BBAuthTokenErrorCode.InvalidEnvironment
    );
  });

  it('should automatically resolve if the user is only in one environment', async (done) => {
    replyWithDestinations(
      'abc',
      '',
      testDestinationsSingle
    );

    const args = await BBContextProvider.ensureContext({
      envIdRequired: true,
      svcId: 'abc'
    });

    expect(args.url).toBe('https://example.com/entitlement-1');
    done();
  });

  it('should show the welcome screen if the user is in more than one environment', async (done) => {
    replyWithDestinations(
      'abc',
      'https://example.com',
      testDestinationsMultiple
    );

    const contextPromise = BBContextProvider.ensureContext({
      envIdRequired: true,
      svcId: 'abc',
      url: 'https://example.com'
    });

    const iframeEl = await whenIframeLoaded();

    expect(iframeEl.src).toBe('about:blank?hosted=1&svcid=abc&url=https%3A%2F%2Fexample.com');

    fireMessageEvent({
      messageType: 'ready'
    });

    fireMessageEvent({
      envId: '2',
      messageType: 'welcome-environment-selected'
    });

    const args = await contextPromise;

    expect(args.envId).toBe('2');

    done();
  });

  it('should close the welcome screen if the user cancels', async (done) => {
    replyWithDestinations(
      'abc',
      'https://example.com',
      testDestinationsMultiple
    );

    const contextPromise = BBContextProvider.ensureContext({
      envIdRequired: true,
      svcId: 'abc',
      url: 'https://example.com'
    });

    await whenIframeLoaded();

    fireMessageEvent({
      messageType: 'ready'
    });

    fireMessageEvent({
      envId: '2',
      messageType: 'welcome-cancel'
    });

    try {
      await contextPromise;
    } catch (ex) {
      expect(ex.reason).toBe('canceled');
      done();
    }
  });

  it('should notify the welcome page when a requested token is available', async (done) => {
    replyWithDestinations(
      'abc',
      '',
      testDestinationsMultiple
    );

    BBContextProvider.ensureContext({
      envIdRequired: true,
      svcId: 'abc'
    });

    await whenIframeLoaded();

    fireMessageEvent({
      messageType: 'ready'
    });

    postOmnibarMessageSpy.and.callFake(() => {
      expect(postOmnibarMessageSpy).toHaveBeenCalledWith(
        getIframeEl(),
        {
          messageType: 'token',
          token: 'some_token',
          tokenRequestId: 123
        }
      );

      done();
    });

    fireMessageEvent({
      messageType: 'get-token',
      tokenRequestId: 123
    });
  });

  it('should notify the welcome page when a requested token is not available', async (done) => {
    replyWithDestinations(
      'abc',
      '',
      testDestinationsMultiple
    );

    BBContextProvider.ensureContext({
      envIdRequired: true,
      svcId: 'abc'
    });

    await whenIframeLoaded();

    fireMessageEvent({
      messageType: 'ready'
    });

    getTokenFake = () => {
      return Promise.reject('The user is not logged in.');
    };

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

    fireMessageEvent({
      disableRedirect: false,
      messageType: 'get-token',
      tokenRequestId: 123
    });
  });

  it('should ignore messages that do not originate from the welcome page', async (done) => {
    messageIsFromOmnibarReturnValue = false;

    replyWithDestinations(
      'abc',
      'https://example.com',
      testDestinationsMultiple
    );

    BBContextProvider.ensureContext({
      envIdRequired: true,
      svcId: 'abc',
      url: 'https://example.com'
    });

    await whenIframeLoaded();

    fireMessageEvent({
      messageType: 'ready'
    }, false);

    expect(postOmnibarMessageSpy).not.toHaveBeenCalled();

    done();
  });

});
