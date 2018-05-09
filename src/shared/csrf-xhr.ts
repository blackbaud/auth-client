const CSRF_URL = 'https://s21aidntoken00blkbapp01.nxt.blackbaud.com/session/csrf';

import {
  BBAuthTokenError,
  BBAuthTokenErrorCode
} from '../auth';

import { BBAuthNavigator } from './navigator';

function post(
  url: string,
  header: {
    name: string,
    value: string
  },
  body: any,
  okCB: (responseText: string) => any,
  unuthCB: (reason: BBAuthTokenError) => any
) {
  const xhr = new XMLHttpRequest();

  xhr.onreadystatechange = () => {
    if (xhr.readyState === 4) {
      switch (xhr.status) {
        case 200:
          okCB(xhr.responseText);
          break;
        case 401:
          unuthCB({
            code: BBAuthTokenErrorCode.NotLoggedIn,
            message: 'The user is not logged in.'
          });
          break;
        case 403:
          unuthCB({
            code: BBAuthTokenErrorCode.InvalidEnvironment,
            message: 'The user is not a member of the specified environment.'
          });
          break;
        default:
          /* istanbul ignore else */
          if (xhr.status === 0 || xhr.status >= 400) {
            unuthCB({
              code: BBAuthTokenErrorCode.Unspecified,
              message: 'An unknown error occurred.'
            });
          }
          break;
      }
    }
  };

  xhr.open('POST', url, true);

  xhr.setRequestHeader(header.name, header.value);
  xhr.setRequestHeader('Accept', 'application/json');
  xhr.setRequestHeader('Content-Type', 'application/json');

  xhr.withCredentials = true;

  if (body) {
    xhr.send(JSON.stringify(body));
  } else {
    xhr.send();
  }
}

function requestToken(url: string, csrfValue: string, envId?: string, permissionScope?: string) {
  let body: {
    environment_id?: string,
    permission_scope?: string
  };

  if (envId) {
    body = {
      environment_id: envId
    };

    if (permissionScope) {
      body.permission_scope = permissionScope;
    }
  }

  return new Promise((resolve: any, reject: any) => {
    post(
      url,
      {
        name: 'X-CSRF',
        value: csrfValue
      },
      body,
      (text: string) => {
        const response = text ? JSON.parse(text) : undefined;
        resolve(response);
      },
      reject
    );
  });
}

export class BBCsrfXhr {
  public static request(
    url: string,
    signinRedirectParams?: any,
    disableRedirect?: boolean,
    envId?: string,
    permissionScope?: string
  ) {
    if (permissionScope && !envId) {
      return Promise.reject({
        code: BBAuthTokenErrorCode.PermissionScopeNoEnvironment,
        message: 'You must also specify an environment when specifying a permission scope.'
      });
    }

    return new Promise((resolve: any, reject: any) => {
      // Get the access token, and then pass it to the callback.
      requestToken(url, 'token_needed', envId, permissionScope)
        .then(resolve)
        .catch((reason: BBAuthTokenError) => {
          if (disableRedirect) {
            reject(reason);
          } else {
            switch (reason.code) {
              case BBAuthTokenErrorCode.NotLoggedIn:
                BBAuthNavigator.redirectToSignin(signinRedirectParams);
                break;
              default:
                BBAuthNavigator.redirectToError(reason.code);
                break;
            }
          }
        });
    });
  }

  public static requestWithToken(
    url: string,
    token: string
  ) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      xhr.onreadystatechange = () => {
        if (xhr.readyState === 4) {
          switch (xhr.status) {
            case 200:
              resolve(JSON.parse(xhr.responseText));
              break;
            default:
              reject();
              break;
          }
        }
      };

      xhr.open('GET', url, true);

      xhr.setRequestHeader('Authorization', 'Bearer ' + token);
      xhr.setRequestHeader('Accept', 'application/json');

      xhr.send();
    });
  }
}
