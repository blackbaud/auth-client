import {
  BBAuth,
  BBAuthTokenErrorCode
} from '../auth';

import { BBAuthInterop } from '../shared/interop';

import { BBCsrfXhr } from '../shared/csrf-xhr';
import { BBAuthNavigator } from '../shared/navigator';

import { BBContextNavigation } from './context-navigation';
import { BBContextProvider } from './context-provider';

describe('Context provider', () => {
  let messageIsFromOmnibarReturnValue: boolean;

  let testNavSingleEnvironment: BBContextNavigation;
  let testNavMultipleEnvironments: BBContextNavigation;
  let testNavNoEnvironments: BBContextNavigation;

  let getTokenSpy: jasmine.Spy;
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

  function replyWithNavigation(svcId: string, navigation: BBContextNavigation) {
    getTokenFake = () => Promise.resolve('some_token');

    spyOn(BBCsrfXhr, 'requestWithToken').and.callFake(
      (url: string, token: string) : Promise<BBContextNavigation> => {
        expect(url).toBe(
          'https://s21anavnavaf00blkbapp01.sky.blackbaud.com/user/services?svcid=' + encodeURIComponent(svcId)
        );

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

    getTokenSpy = spyOn(
      BBAuth,
      'getToken'
    ).and.callFake(() => {
      return getTokenFake();
    });

    messageIsFromOmnibarSpy.calls.reset();
    redirectToErrorSpy.calls.reset();
    postOmnibarMessageSpy.calls.reset();

    testNavSingleEnvironment = {
      environments: [
        {
          id: '1'
        }
      ]
    };

    testNavMultipleEnvironments = {
      environments: [
        {
          id: '1'
        },
        {
          id: '2'
        }
      ]
    };

    testNavNoEnvironments = {
      environments: []
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

  it('should automatically resolve if environment ID is not required', (done) => {
    BBContextProvider.ensureContext({
      envIdRequired: false
    })
      .then((args) => {
        expect(args.envId).toBeUndefined();
        done();
      });
  });

  it('should automatically resolve if environment ID is required but provided', (done) => {
    BBContextProvider.ensureContext({
      envId: '123',
      envIdRequired: true
    })
      .then((args) => {
        expect(args.envId).toBe('123');
        done();
      });
  });

  it('should redirect to an error page if environment ID is required but the user is not in an environment', (done) => {
    replyWithNavigation(
      'abc',
      {
        environments: []
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

  it('should redirect to an error page if environment ID is required but service ID is not specified', () => {
    replyWithNavigation(
      'abc',
      testNavNoEnvironments
    );

    BBContextProvider.ensureContext({
      envIdRequired: true
    });

    expect(redirectToErrorSpy).toHaveBeenCalledWith(
      BBAuthTokenErrorCode.InvalidEnvironment
    );
  });

  it('should automatically resolve if the user is only in one environment', (done) => {
    replyWithNavigation(
      'abc',
      testNavSingleEnvironment
    );

    BBContextProvider.ensureContext({
      envIdRequired: true,
      svcId: 'abc'
    })
      .then((args) => {
        expect(args.envId).toBe('1');
        done();
      });
  });

  it('should show the welcome screen if the user is in more than one environment', (done) => {
    replyWithNavigation(
      'abc',
      testNavMultipleEnvironments
    );

    BBContextProvider.ensureContext({
      envIdRequired: true,
      svcId: 'abc',
      url: 'https://example.com'
    })
      .then((args) => {
        expect(args.envId).toBe('2');

        done();
      });

    whenIframeLoaded().then((iframeEl) => {
      expect(iframeEl.src).toBe('about:blank?hosted=1&svcid=abc&url=https%3A%2F%2Fexample.com');

      fireMessageEvent({
        messageType: 'ready'
      });

      fireMessageEvent({
        envId: '2',
        messageType: 'welcome-environment-selected'
      });
    });
  });

  it('should close the welcome screen if the user cancels', (done) => {
    replyWithNavigation(
      'abc',
      testNavMultipleEnvironments
    );

    BBContextProvider.ensureContext({
      envIdRequired: true,
      svcId: 'abc',
      url: 'https://example.com'
    })
      .then(
        (args) => {
          // Do nothing
        },
        (args) => {
          expect(args.reason).toBe('canceled');
          done();
        }
      );

    whenIframeLoaded().then((iframeEl) => {
      fireMessageEvent({
        messageType: 'ready'
      });

      fireMessageEvent({
        envId: '2',
        messageType: 'welcome-cancel'
      });
    });
  });

  it('should notify the welcome page when a requested token is available', (done) => {
    replyWithNavigation(
      'abc',
      testNavMultipleEnvironments
    );

    BBContextProvider.ensureContext({
      envIdRequired: true,
      svcId: 'abc'
    });

    whenIframeLoaded().then((iframeEl) => {
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
  });

  it('should notify the welcome page when a requested token is not available', (done) => {
    replyWithNavigation(
      'abc',
      testNavMultipleEnvironments
    );

    BBContextProvider.ensureContext({
      envIdRequired: true,
      svcId: 'abc'
    });

    whenIframeLoaded().then((iframeEl) => {
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
  });

  it('should ignore messages that do not originate from the welcome page', (done) => {
    messageIsFromOmnibarReturnValue = false;

    replyWithNavigation(
      'abc',
      testNavMultipleEnvironments
    );

    BBContextProvider.ensureContext({
      envIdRequired: true,
      svcId: 'abc',
      url: 'https://example.com'
    });

    whenIframeLoaded().then((iframeEl) => {
      fireMessageEvent({
        messageType: 'ready'
      }, false);

      expect(postOmnibarMessageSpy).not.toHaveBeenCalled();

      done();
    });
  });

});
