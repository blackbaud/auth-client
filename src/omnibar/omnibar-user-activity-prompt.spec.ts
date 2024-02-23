//#region imports

import { BBAuthInterop } from '../shared/interop';

import { BBOmnibarUserActivityPrompt } from './omnibar-user-activity-prompt';
import { getNonceStyleCount } from './testing/omnibar-test-utility';

//#endregion

describe('User activity prompt', () => {
  const PROMPT_URL = 'about:blank';

  let postOmnibarMessageSpy: jasmine.Spy;

  let messageIsFromOmnibarReturnValue = true;

  function fireMessageEvent(
    data: Record<string, unknown>,
    includeSource = true
  ) {
    if (includeSource) {
      data.source = 'skyux-spa-omnibar';
    }

    window.dispatchEvent(
      new MessageEvent('message', {
        data,
      })
    );
  }

  function getIframeEl() {
    return document.querySelector('iframe.sky-omnibar-inactivity-iframe');
  }

  beforeAll(() => {
    postOmnibarMessageSpy = spyOn(BBAuthInterop, 'postOmnibarMessage');

    spyOn(BBAuthInterop, 'messageIsFromOmnibar').and.callFake(() => {
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
      sessionRenewCallback: () => undefined,
    });

    const iframeEl = getIframeEl();

    expect(iframeEl).not.toBeNull();

    const iframeStyle = getComputedStyle(iframeEl);

    expect(iframeStyle.backgroundColor).toEqual(
      jasmine.stringMatching(/^transparent|rgba\(0, 0, 0, 0\)$/gi)
    );
    expect(iframeStyle.borderStyle).toEqual(
      jasmine.stringMatching(/^|none$/gi)
    );
    expect(iframeStyle.height).toBe(
      document.documentElement.clientHeight + 'px'
    );
    expect(iframeStyle.left).toBe('0px');
    expect(iframeStyle.position).toBe('fixed');
    expect(iframeStyle.top).toBe('0px');
    expect(iframeStyle.visibility).toBe('hidden');
    expect(iframeStyle.width).toBe(document.documentElement.clientWidth + 'px');
    expect(iframeStyle.zIndex).toBe('100000');
  });

  it('should add the specified nonce to dynamic styles', () => {
    const nonce = '0mn1bar-Us3r-1nact1v1ty';

    expect(getNonceStyleCount(nonce)).toBe(0);

    BBOmnibarUserActivityPrompt.show({
      sessionRenewCallback: () => undefined,
      nonce,
    });

    expect(getNonceStyleCount(nonce)).toBe(1);
  });

  it('should post the host-ready message and show the IFRAME when the inactivity prompt IFRAME is ready', () => {
    BBOmnibarUserActivityPrompt.show({
      sessionRenewCallback: () => undefined,
    });

    fireMessageEvent({
      messageType: 'ready',
    });

    const iframeEl = getIframeEl();

    expect(postOmnibarMessageSpy).toHaveBeenCalledWith(
      iframeEl,
      jasmine.objectContaining({
        messageType: 'host-ready',
      })
    );

    expect(getComputedStyle(iframeEl).visibility).toBe('visible');
  });

  it('should call the session renew callback when the session is renewed', () => {
    const sessionRenewCallbackSpy = jasmine.createSpy('sessionRenewCallback');

    BBOmnibarUserActivityPrompt.show({
      sessionRenewCallback: sessionRenewCallbackSpy,
    });

    fireMessageEvent({
      messageType: 'session-renew',
    });

    expect(sessionRenewCallbackSpy).toHaveBeenCalled();
  });

  it('should ignore messages not from the inactivity prompt IFRAME', () => {
    messageIsFromOmnibarReturnValue = false;

    const sessionRenewCallbackSpy = jasmine.createSpy('sessionRenewCallback');

    BBOmnibarUserActivityPrompt.show({
      sessionRenewCallback: sessionRenewCallbackSpy,
    });

    fireMessageEvent({
      messageType: 'session-renew',
    });

    expect(sessionRenewCallbackSpy).not.toHaveBeenCalled();
  });

  it('should remove the activity prompt IFRAME', () => {
    BBOmnibarUserActivityPrompt.show({
      sessionRenewCallback: () => undefined,
    });

    expect(getIframeEl()).not.toBeNull();

    BBOmnibarUserActivityPrompt.hide();

    expect(getIframeEl()).toBeNull();
  });
});
