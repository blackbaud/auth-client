//#region imports

import {
  BBOmnibarToastContainer
} from './omnibar-toast-container';

import {
  BBAuthInterop
} from '../shared/interop';

//#endregion

describe('Omnibar toast container', () => {

  const CONTAINER_URL = 'about:blank';

  let messageIsFromOmnibarReturnValue: boolean;
  let openMenuCallbackSpy: jasmine.Spy;
  let postOmnibarMessageSpy: jasmine.Spy;
  let previousContainerUrl: string;

  function fireMessageEvent(data: any, includeSource = true): void {
    if (includeSource) {
      data.source = 'skyux-spa-omnibar';
    }

    window.dispatchEvent(
      new MessageEvent('message', {
        data
      })
    );
  }

  function loadToastContainer(): Promise<any> {
    const initPromise = BBOmnibarToastContainer.init(openMenuCallbackSpy);

    fireMessageEvent({
      messageType: 'toast-ready'
    });

    return initPromise;
  }

  function getIframeEl(): HTMLIFrameElement {
    return document.querySelector('.sky-omnibar-toast-container');
  }

  function validateIframeVisible(visible: boolean, height?: string) {
    const iframeEl = getIframeEl();

    expect(getComputedStyle(iframeEl).visibility).toBe(visible ? 'visible' : 'hidden');

    if (height) {
      expect(getComputedStyle(iframeEl).height).toBe(height);
    }
  }

  beforeAll(() => {
    previousContainerUrl = BBOmnibarToastContainer.CONTAINER_URL;

    (BBOmnibarToastContainer as any).CONTAINER_URL = CONTAINER_URL;

    messageIsFromOmnibarReturnValue = true;
  });

  beforeEach(() => {
    messageIsFromOmnibarReturnValue = true;

    postOmnibarMessageSpy = spyOn(BBAuthInterop, 'postOmnibarMessage');
    openMenuCallbackSpy = jasmine.createSpy('openMenuCallback');

    spyOn(
      BBAuthInterop,
      'messageIsFromOmnibar'
    ).and.callFake(() => {
      return messageIsFromOmnibarReturnValue;
    });
  });

  afterEach(() => {
    BBOmnibarToastContainer.destroy();
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
    messageIsFromOmnibarReturnValue = false;

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

    validateIframeVisible(true, '50px');

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

});
