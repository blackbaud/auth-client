import { BBAuthTokenErrorCode } from '../auth';

const SIGNIN_BASE_URL = 'https://signin.blackbaud.com/signin/';
const ERROR_BASE_URL = 'https://app.blackbaud.com/errors/';

const euc = encodeURIComponent;

function paramsToQS(params: any) {
  const qs = [];

  for (const p in params) {
    /* istanbul ignore else */
    if (params.hasOwnProperty(p)) {
      qs.push(`${euc(p)}=${euc(params[p])}`);
    }
  }

  return qs.join('&');
}

function createSigninUrl(inactive?: boolean) {
  let url = `${SIGNIN_BASE_URL}?redirectUrl=${euc(location.href)}`;

  if (inactive) {
    url += '&inactivity=1';
  }

  return url;
}

export class BBAuthNavigator {
  /* istanbul ignore next */
  public static navigate(url: string, replace?: boolean) {
    if (replace) {
      location.replace(url);
    } else {
      location.href = url;
    }
  }

  public static redirectToSignin(signinRedirectParams?: any) {
    let signinUrl = createSigninUrl();

    if (signinRedirectParams) {
      signinUrl += '&' + paramsToQS(signinRedirectParams);
    }

    this.navigate(signinUrl);
  }

  public static redirectToSignoutForInactivity() {
    const signinUrl = createSigninUrl(true);
    const signoutUrl = `${SIGNIN_BASE_URL}sign-out?redirectUrl=${euc(signinUrl)}`;

    this.navigate(signoutUrl);
  }

  public static redirectToError(code: BBAuthTokenErrorCode) {
    let path: string;
    let errorCode: string;

    switch (code) {
      case BBAuthTokenErrorCode.InvalidEnvironment:
        errorCode = 'invalid_env';
        path = 'security';
        break;
      default:
        path = 'broken';
        break;
    }

    let url = `${ERROR_BASE_URL}${path}?source=auth-client&url=${euc(location.href)}`;

    if (errorCode) {
      url += `&code=${euc(errorCode)}`;
    }

    this.navigate(url);
  }
}
