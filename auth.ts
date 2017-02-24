export class BBAuth {
  private static lastToken: string;
  private static expirationTime: number;

  public static getToken(): Promise<string> {
    const tokenInteraction = new BBAuthTokenIntegration(
      'https://signin.blackbaud.com/api/v2/csrf',
      'https://signin.blackbaud.com/api/v2/oauth/token',
      'https://signin.blackbaud.com'
    );

    const now = new Date().valueOf();

    if (
      BBAuth.lastToken &&
      BBAuth.expirationTime &&
      (BBAuth.expirationTime - now > 60 * 1000) /* Refresh if within 1 minute of expiration */
    ) {
      // Return the stored token.
      return new Promise<string>((resolve: any, reject: any) => {
        resolve(BBAuth.lastToken);
      });
    } else {
      return tokenInteraction.getToken().then((tokenResponse: any) => {
        BBAuth.expirationTime = new Date().valueOf() + tokenResponse['expires_in'] * 1000;
        BBAuth.lastToken = tokenResponse['access_token'];
        return BBAuth.token;
      });
    }
  }
}

class BBAuthTokenIntegration {

  constructor(
    private csrfUrl: string,
    private tokenUrl: string,
    private signInUrl: string
  ) { }

  public getToken() {
    return new Promise((resolve: any, reject: any) => {
      // First get the CSRF token
      this.requestToken(this.csrfUrl, 'token_needed')
        .then((csrfResponse: any) => {
          // Next get the access token, and then pass it to the callback.
          return this.requestToken(this.tokenUrl, csrfResponse['csrf_token']);
        })
        .then(resolve)
        .catch(() => {
          // Not logged in, so go back to Auth Svc.
          location.href = this.signInUrl + '?redirectUrl=' + encodeURIComponent(location.href);
        });
    });
  }

  private requestToken(url: string, csrfValue: string) {
    return new Promise((resolve: any, reject: any) => {
      this.post(
        url,
        {
          name: 'X-CSRF',
          value: csrfValue
        },
        (text: string) => {
          const response = JSON.parse(text);
          resolve(response);
        },
        reject
      );
    });
  }

  private post(
    url: string,
    header: {
      name: string,
      value: string
    },
    okCB: Function,
    unuthCB: Function
  ) {
    const xhr = new XMLHttpRequest();

    xhr.onreadystatechange = () => {
      if (xhr.readyState === 4 && xhr.status === 401) {
        if (unuthCB) {
          unuthCB();
        }
      } else if (xhr.readyState === 4 && xhr.status === 200) {
        okCB(xhr.responseText);
      }
    };

    xhr.open('POST', url, true);

    if (header) {
      xhr.setRequestHeader(header.name, header.value);
    }

    xhr.setRequestHeader('Accept', 'application/json');
    xhr.withCredentials = true;
    xhr.send(undefined);
  }
}
