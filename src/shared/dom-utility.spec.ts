import { BBAuthDomUtility } from './dom-utility';

describe('DOM utility', () => {
  let testEls: HTMLElement[];
  let testStyleEls: HTMLStyleElement[];

  beforeEach(() => {
    testEls = [];
    testStyleEls = [];
  });

  afterEach(() => {
    if (testEls) {
      for (const testEl of testEls) {
        BBAuthDomUtility.removeEl(testEl);
      }
    }

    if (testStyleEls) {
      for (const testStyleEl of testStyleEls) {
        BBAuthDomUtility.removeCss(testStyleEl);
      }
    }

    testEls = undefined;
    testStyleEls = undefined;
  });

  it("should add CSS elements to the document's head", () => {
    const testCss = '.test-class { color: green }';

    const styleEl = BBAuthDomUtility.addCss(testCss);

    testStyleEls.push(styleEl);

    expect(document.head.contains(styleEl)).toBe(true);
    expect(styleEl.textContent).toBe(testCss);
  });

  it('should add a nonce to CSS elements if specified', () => {
    const testCss = '.test-class { color: green }';

    const styleEl = BBAuthDomUtility.addCss(testCss, 'abc');

    testStyleEls.push(styleEl);

    expect(styleEl.nonce).toBe('abc');
  });

  it('should allow elements to be added to the top of the body', () => {
    const el = document.createElement('div');

    testEls.push(el);

    BBAuthDomUtility.addElToBodyTop(el);

    expect(document.body.firstChild).toBe(el);
  });

  it('should allow IFRAMEs to be added', () => {
    const iframeEl = BBAuthDomUtility.addIframe(
      'about:blank',
      'test-class',
      'Test title'
    );

    testEls.push(iframeEl);

    expect(document.body.firstChild).toBe(iframeEl);
    expect(iframeEl.src).toBe('about:blank');
    expect(iframeEl.className).toBe('test-class');
    expect(iframeEl.title).toBe('Test title');
  });

  it('should not error if an attempt is made to remove a non-existent element', () => {
    expect(() => BBAuthDomUtility.removeEl(undefined)).not.toThrowError();
    expect(() =>
      BBAuthDomUtility.removeEl(document.createElement('div'))
    ).not.toThrowError();
  });
});
