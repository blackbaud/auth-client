const SIGNIN_URL = 'https://signin.blackbaud.com/signin/';
const CSRF_URL = 'https://s21aidntoken00blkbapp01.nxt.blackbaud.com/session/csrf';

import { BBAuthInterop } from './interop';

export class BBCsrfXhr {

  public static request(url: string) {
    return new Promise((resolve: any, reject: any) => {
      // First get the CSRF token
      this.requestToken(CSRF_URL, 'token_needed')
        .then((csrfResponse: any) => {
          // Next get the access token, and then pass it to the callback.
          return this.requestToken(url, csrfResponse['csrf_token']);
        })
        .then(resolve)
        .catch(() => {
          // Not logged in, so go back to Auth Svc.
          BBAuthInterop.navigate(
            SIGNIN_URL + '?redirectUrl=' + encodeURIComponent(location.href)
          );
        });
    });
  }

  private static requestToken(url: string, csrfValue: string) {
    return new Promise((resolve: any, reject: any) => {
      this.post(
        url,
        {
          name: 'X-CSRF',
          value: csrfValue
        },
        (text: string) => {
          const response = text ? JSON.parse(text) : undefined;
          resolve(response);
        },
        reject
      );
    });
  }

  private static post(
    url: string,
    header: {
      name: string,
      value: string
    },
    okCB: (responseText: string) => any,
    unuthCB: () => any
  ) {
    const xhr = new XMLHttpRequest();

    xhr.onreadystatechange = () => {
      if (xhr.readyState === 4 && xhr.status === 401) {
        unuthCB();
      } else if (xhr.readyState === 4 && xhr.status === 200) {
        okCB(xhr.responseText);
      }
    };

    xhr.open('POST', url, true);
    xhr.setRequestHeader(header.name, header.value);

    xhr.setRequestHeader('Accept', 'application/json');
    xhr.withCredentials = true;
    xhr.send();
  }
}
