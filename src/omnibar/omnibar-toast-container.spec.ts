//#region imports

import {
  BBAuth
} from '../auth';

import {
  BBOmnibarToastContainer
} from './omnibar-toast-container';

import {
  BBAuthInterop
} from '../shared/interop';

//#endregion

describe('Omnibar toast container', () => {
  const CONTAINER_URL = 'about:blank';

  // tslint:disable-next-line:max-line-length
  const testToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCIxYmIuZW50aXRsZW1lbnRzIjoibm90aWYifQ.9geiUl3O3ZlEzZVNm28clN0SmZCfn3OSBnfZxNcymHc';

  let messageIsFromToastContainerReturnValue: boolean;
  let openMenuCallbackSpy: jasmine.Spy;
  let postOmnibarMessageSpy: jasmine.Spy;
  let previousContainerUrl: string;
  let navigateCallbackSpy: jasmine.Spy;
  let navigateUrlCallbackSpy: jasmine.Spy;
  let pushNotificationsChangeCallbackSpy: jasmine.Spy;

  let getTokenFake: () => Promise<string>;

  function fireMessageEvent(data: any, includeSource = true): void {
    if (includeSource) {
      data.source = 'skyux-spa-omnibar-toast-container';
    }

    window.dispatchEvent(
      new MessageEvent('message', {
        data
      })
    );
  }

  function loadToastContainer(): Promise<any> {
    const initPromise = BBOmnibarToastContainer.init({
      envId: 'abc',
      leId: '123',
      navigateCallback: navigateCallbackSpy,
      navigateUrlCallback: navigateUrlCallbackSpy,
      openMenuCallback: openMenuCallbackSpy,
      pushNotificationsChangeCallback: pushNotificationsChangeCallbackSpy,
      svcId: 'xyz',
      url: 'https://example.com/init'
    });

    fireMessageEvent({
      messageType: 'toast-ready'
    });

    return initPromise;
  }

  function getIframeEl(): HTMLIFrameElement {
    return document.querySelector('.sky-omnibar-toast-container');
  }

  function validateIframeVisible(visible: boolean, height?: string, top?: string): void {
    const iframeEl = getIframeEl();

    expect(getComputedStyle(iframeEl).visibility).toBe(visible ? 'visible' : 'hidden');

    if (height) {
      expect(getComputedStyle(iframeEl).height).toBe(height);
    }

    if (top) {
      expect(getComputedStyle(iframeEl).top).toBe(top);
    }
  }

  function removeFakeOmnibar() {
    const omnibarEl = document.querySelector('.sky-omnibar-iframe');

    if (omnibarEl) {
      omnibarEl.remove();
    }

    const envEl = document.querySelector('.sky-omnibar-environment');

    if (envEl) {
      envEl.remove();
    }
  }

  function createFakeOmnibar(omnibarHeight: number, environmentHeight: number): void {
    removeFakeOmnibar();

    const omnibarEl = document.createElement('div');
    omnibarEl.className = 'sky-omnibar-iframe';
    omnibarEl.style.height = omnibarHeight + 'px';

    document.body.appendChild(omnibarEl);

    const envEl = document.createElement('div');
    envEl.className = 'sky-omnibar-environment';
    envEl.style.height = environmentHeight + 'px';

    document.body.appendChild(envEl);
  }

  beforeAll(() => {
    previousContainerUrl = BBOmnibarToastContainer.CONTAINER_URL;

    (BBOmnibarToastContainer as any).CONTAINER_URL = CONTAINER_URL;

    messageIsFromToastContainerReturnValue = true;
  });

  beforeEach(() => {
    messageIsFromToastContainerReturnValue = true;

    postOmnibarMessageSpy = spyOn(BBAuthInterop, 'postOmnibarMessage');
    openMenuCallbackSpy = jasmine.createSpy('openMenuCallback');
    navigateCallbackSpy = jasmine.createSpy('navigateCallback');
    navigateUrlCallbackSpy = jasmine.createSpy('navigateUrlCallback');
    pushNotificationsChangeCallbackSpy = jasmine.createSpy('pushNotificationsChangeCallback');

    getTokenFake = () => Promise.resolve(testToken);

    spyOn(
      BBAuth,
      'getToken'
    ).and.callFake(() => {
      return getTokenFake();
    });

    spyOn(
      BBAuthInterop,
      'messageIsFromToastContainer'
    ).and.callFake(() => {
      return messageIsFromToastContainerReturnValue;
    });
  });

  afterEach(() => {
    BBOmnibarToastContainer.destroy();

    removeFakeOmnibar();
  });

  afterAll(() => {
    (BBOmnibarToastContainer as any).CONTAINER_URL = previousContainerUrl;
  });

  it('should load the toast container IFRAME', () => {
    loadToastContainer();

    fireMessageEvent({
      messageType: 'toast-ready'
    });

    const iframeEl = getIframeEl();

    expect(iframeEl.src).toBe(CONTAINER_URL);
    expect(getComputedStyle(iframeEl).visibility).toBe('hidden');
    expect(iframeEl.title).toBe('Toast container');
  });

  it('should not create another toast container IFRAME if it has already been created', async () => {
    await loadToastContainer();
    await loadToastContainer();

    expect(document.querySelectorAll('.sky-omnibar-toast-container').length).toBe(1);
  });

  it('should ignore messages that do not originate from the toast container', () => {
    messageIsFromToastContainerReturnValue = false;

    loadToastContainer();

    fireMessageEvent(
      {
        height: 50,
        messageType: 'toast-container-change'
      },
      false
    );

    validateIframeVisible(false);
  });

  it('should adjust the visibility of the toast container based on the displayed toasts', () => {
    loadToastContainer();

    fireMessageEvent({
      messageType: 'toast-ready'
    });

    fireMessageEvent({
      height: 50,
      messageType: 'toast-container-change'
    });

    validateIframeVisible(true, '50px', '20px');

    createFakeOmnibar(50, 20);

    fireMessageEvent({
      messageType: 'toast-ready'
    });

    fireMessageEvent({
      height: 50,
      messageType: 'toast-container-change'
    });

    validateIframeVisible(true, '50px', '90px');

    createFakeOmnibar(80, 0);

    fireMessageEvent({
      height: 60,
      messageType: 'toast-container-change'
    });

    validateIframeVisible(true, '60px', '100px');

    fireMessageEvent({
      height: 0,
      messageType: 'toast-container-change'
    });

    validateIframeVisible(false);
  });

  it('should pass new notifications to the toast container IFRAME', () => {
    const testNotifications = {
      notifications: [
        {
          notificationId: '1',
          shortMessage: 'Hello world'
        }
      ]
    };

    loadToastContainer();

    const iframeEl = getIframeEl();

    BBOmnibarToastContainer.showNewNotifications(testNotifications);

    expect(postOmnibarMessageSpy).toHaveBeenCalledWith(
      iframeEl,
      {
        messageType: 'push-notifications-update',
        pushNotifications: testNotifications
      }
    );
  });

  it('should provide a method to destory the toast container IFRAME', () => {
    loadToastContainer();

    let iframeEl = getIframeEl();

    expect(iframeEl).not.toBeNull();

    BBOmnibarToastContainer.destroy();

    iframeEl = getIframeEl();

    expect(getIframeEl()).toBeNull();
  });

  it('should call the specified open menu callback when the push notifications menu should open', () => {
    loadToastContainer();

    fireMessageEvent({
      messageType: 'toast-ready'
    });

    expect(openMenuCallbackSpy).not.toHaveBeenCalled();

    fireMessageEvent({
      messageType: 'push-notifications-open'
    });

    expect(openMenuCallbackSpy).toHaveBeenCalled();
  });

  it('should call the specified callback when push notifications are updated', () => {
    const testNotifications = [
      {
        id: '123',
        read: true,
        touched: true
      }
    ];

    loadToastContainer();

    fireMessageEvent({
      messageType: 'toast-ready'
    });

    expect(pushNotificationsChangeCallbackSpy).not.toHaveBeenCalled();

    fireMessageEvent({
      messageType: 'push-notifications-change',
      notifications: testNotifications
    });

    expect(pushNotificationsChangeCallbackSpy).toHaveBeenCalledWith(testNotifications);
  });

  it('should call the specified navigate callback', () => {
    loadToastContainer();

    fireMessageEvent({
      messageType: 'toast-ready'
    });

    expect(navigateCallbackSpy).not.toHaveBeenCalled();

    fireMessageEvent({
      messageType: 'navigate',
      navItem: {
        url: 'https://example.com/navigate'
      }
    });

    expect(navigateCallbackSpy).toHaveBeenCalledWith({
      url: 'https://example.com/navigate'
    });
  });

  it('should call the specified navigate URL callback', () => {
    loadToastContainer();

    fireMessageEvent({
      messageType: 'toast-ready'
    });

    expect(navigateUrlCallbackSpy).not.toHaveBeenCalled();

    fireMessageEvent({
      messageType: 'navigate-url',
      url: 'https://example.com/navigate-url'
    });

    expect(navigateUrlCallbackSpy).toHaveBeenCalledWith('https://example.com/navigate-url');
  });

  it('should post a message with the current URL', () => {
    loadToastContainer();

    fireMessageEvent({
      messageType: 'toast-ready'
    });

    const iframeEl = getIframeEl();

    // Validate the initial URL is posted after receiving the `toast-ready` message.
    expect(postOmnibarMessageSpy).toHaveBeenCalledWith(
      iframeEl,
      {
        href: 'https://example.com/init',
        messageType: 'location-change'
      }
    );

    BBOmnibarToastContainer.updateUrl('https://example.com/2');

    // Validate subsequent URLs are posted.
    expect(postOmnibarMessageSpy).toHaveBeenCalledWith(
      iframeEl,
      {
        href: 'https://example.com/2',
        messageType: 'location-change'
      }
    );
  });

  it('should not post a message with the current URL if the toast container has not been initialized', () => {
    BBOmnibarToastContainer.updateUrl('https://example.com/2');

    // Validate subsequent URLs are posted.
    expect(postOmnibarMessageSpy).not.toHaveBeenCalled();
  });

  it('should notify the toast container when a requested token is available', (done) => {
    loadToastContainer();

    postOmnibarMessageSpy.calls.reset();

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

    fireMessageEvent({
      messageType: 'get-token',
      tokenRequestId: 123
    });
  });

  it('should notify the toast container when a requested token is not available', (done) => {
    getTokenFake = () => {
      return Promise.reject('The user is not logged in.');
    };

    loadToastContainer();

    postOmnibarMessageSpy.calls.reset();

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
