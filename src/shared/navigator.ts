const SIGNIN_URL = 'https://signin.blackbaud.com/signin/';

function paramsToQS(params: any) {
  const qs = [];

  for (const p in params) {
    /* istanbul ignore else */
    if (params.hasOwnProperty(p)) {
      qs.push(`${encodeURIComponent(p)}=${encodeURIComponent(params[p])}`);
    }
  }

  return qs.join('&');
}

export class BBAuthNavigator {
  /* istanbul ignore next */
  public static navigate(url: string) {
    location.href = url;
  }

  public static redirectToSignin(signinRedirectParams?: any) {
    let signinUrl = SIGNIN_URL + '?redirectUrl=' + encodeURIComponent(location.href);

    if (signinRedirectParams) {
      signinUrl += '&' + paramsToQS(signinRedirectParams);
    }

    this.navigate(signinUrl);
  }
}
