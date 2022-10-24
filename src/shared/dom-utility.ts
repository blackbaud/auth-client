export class BBAuthDomUtility {
  public static addCss(css: string): HTMLStyleElement {
    const styleEl = document.createElement('style');

    styleEl.appendChild(document.createTextNode(css));

    document.head.appendChild(styleEl);

    return styleEl;
  }

  public static createIframe(src: string, className: string, title: string) {
    const iframeEl = document.createElement('iframe');
    iframeEl.className = className;
    iframeEl.title = title;
    iframeEl.src = src;

    return iframeEl;
  }

  public static addIframe(
    src: string,
    className: string,
    title: string
  ): HTMLIFrameElement {
    const iframeEl = this.createIframe(src, className, title);

    this.addElToBodyTop(iframeEl);

    return iframeEl;
  }

  public static removeCss(styleEl: HTMLStyleElement) {
    this.removeEl(styleEl, document.head);
  }

  public static removeEl(el: HTMLElement, parentEl = document.body) {
    if (parentEl.contains(el)) {
      parentEl.removeChild(el);
    }
  }

  public static addElToBodyTop(el: Element) {
    const body = document.body;

    /* istanbul ignore else */
    /* This can't be tested without clearing out all child elements of body which is not practical in a unit test */
    if (body.firstChild) {
      body.insertBefore(el, body.firstChild);
    } else {
      body.appendChild(el);
    }
  }
}
