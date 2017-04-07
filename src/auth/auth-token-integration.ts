export class BBAuthTokenIntegration {

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
