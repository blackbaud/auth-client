import { BBAuthTokenErrorCode } from '../auth';

const SIGNIN_BASE_URL = 'https://signin.blackbaud.com/signin/';
const ERROR_BASE_URL = 'https://host.nxt.blackbaud.com/errors/';

function paramsToQS(params: Record<string, unknown>) {
  const qs = [];

  for (const p in params) {
    /* istanbul ignore else */
    if (params.hasOwnProperty(p)) {
      qs.push(
        `${encodeURIComponent(p)}=${encodeURIComponent(
          params[p] as string | number | boolean
        )}`
      );
    }
  }

  return qs.join('&');
}

function createSigninUrl(inactive?: boolean) {
  let url = `${SIGNIN_BASE_URL}?redirectUrl=${encodeURIComponent(
    location.href
  )}`;

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

  public static redirectToSignin(
    signinRedirectParams?: Record<string, unknown>
  ) {
    let signinUrl = createSigninUrl();

    if (signinRedirectParams) {
      signinUrl += '&' + paramsToQS(signinRedirectParams);
    }

    this.navigate(signinUrl);
  }

  public static redirectToSignoutForInactivity() {
    const signinUrl = createSigninUrl(true);
    const signoutUrl = `${SIGNIN_BASE_URL}sign-out?redirectUrl=${encodeURIComponent(
      signinUrl
    )}`;

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

    let url = `${ERROR_BASE_URL}${path}?source=auth-client&url=${encodeURIComponent(
      location.href
    )}`;

    if (errorCode) {
      url += `&code=${encodeURIComponent(errorCode)}`;
    }

    this.navigate(url);
  }
}
