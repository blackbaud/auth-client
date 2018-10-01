//#region imports

import {
  BBAuthDomUtility
} from '../shared/dom-utility';

import {
  BBAuthInterop
} from '../shared/interop';

import {
  BBOmnibarUserActivityPrompt
} from './omnibar-user-activity-prompt';

import {
  BBOmnibarUserActivityPromptShowArgs
} from './omnibar-user-activity-prompt-show-args';

//#endregion

describe('User activity prompt', () => {

  const PROMPT_URL = 'about:blank';

  let postOmnibarMessageSpy: jasmine.Spy;
  let messageIsFromOmnibarSpy: jasmine.Spy;

  let messageIsFromOmnibarReturnValue = true;

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

  function getIframeEl() {
    return document.querySelector('iframe.sky-omnibar-inactivity-iframe');
  }

  beforeAll(() => {
    postOmnibarMessageSpy = spyOn(BBAuthInterop, 'postOmnibarMessage');

    messageIsFromOmnibarSpy = spyOn(
      BBAuthInterop,
      'messageIsFromOmnibar'
    ).and.callFake(() => {
      return messageIsFromOmnibarReturnValue;
    });

  });

  beforeEach(() => {
    BBOmnibarUserActivityPrompt.url = PROMPT_URL;
  });

  afterEach(() => {
    BBOmnibarUserActivityPrompt.hide();
  });

  it('should load the activity prompt IFRAME', () => {
    BBOmnibarUserActivityPrompt.show({
      sessionRenewCallback: () => undefined
    });

    const iframeEl = getIframeEl();

    expect(iframeEl).not.toBeNull();

    const iframeStyle = getComputedStyle(iframeEl);

    expect(iframeStyle.backgroundColor).toBe('rgba(0, 0, 0, 0)');
    expect(iframeStyle.borderStyle).toBe('none');
    expect(iframeStyle.height).toBe(document.documentElement.clientHeight + 'px');
    expect(iframeStyle.left).toBe('0px');
    expect(iframeStyle.position).toBe('fixed');
    expect(iframeStyle.top).toBe('0px');
    expect(iframeStyle.visibility).toBe('hidden');
    expect(iframeStyle.width).toBe(document.documentElement.clientWidth + 'px');
    expect(iframeStyle.zIndex).toBe('100000');
  });

  it('should post the host-ready message and show the IFRAME when the inactivity prompt IFRAME is ready', () => {
    BBOmnibarUserActivityPrompt.show({
      sessionRenewCallback: () => undefined
    });

    fireMessageEvent({
      messageType: 'ready'
    });

    const iframeEl = getIframeEl();

    expect(postOmnibarMessageSpy).toHaveBeenCalledWith(
      iframeEl,
      jasmine.objectContaining({
        messageType: 'host-ready'
      })
    );

    expect(getComputedStyle(iframeEl).visibility).toBe('visible');
  });

  it('should call the session renew callback when the session is renewed', () => {
    const sessionRenewCallbackSpy = jasmine.createSpy('sessionRenewCallback');

    BBOmnibarUserActivityPrompt.show({
      sessionRenewCallback: sessionRenewCallbackSpy
    });

    fireMessageEvent({
      messageType: 'session-renew'
    });

    expect(sessionRenewCallbackSpy).toHaveBeenCalled();
  });

  it('should ignore messages not from the inactivity prompt IFRAME', () => {
    messageIsFromOmnibarReturnValue = false;

    const sessionRenewCallbackSpy = jasmine.createSpy('sessionRenewCallback');

    BBOmnibarUserActivityPrompt.show({
      sessionRenewCallback: sessionRenewCallbackSpy
    });

    fireMessageEvent({
      messageType: 'session-renew'
    });

    expect(sessionRenewCallbackSpy).not.toHaveBeenCalled();
  });

  it('should remove the activity prompt IFRAME', () => {
    BBOmnibarUserActivityPrompt.show({
      sessionRenewCallback: () => undefined
    });

    expect(getIframeEl()).not.toBeNull();

    BBOmnibarUserActivityPrompt.hide();

    expect(getIframeEl()).toBeNull();
  });

});
