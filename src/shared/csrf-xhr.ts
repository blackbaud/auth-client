import {
  BBAuthTokenError,
  BBAuthTokenErrorCode
} from '../auth';

import { BBAuthDomain } from '../auth/auth-get-domain';
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
        case 0:
          unuthCB({
            code: BBAuthTokenErrorCode.Offline,
            message: 'The user is offline.'
          });
          break;
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
          if (xhr.status >= 400) {
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

function addToRequestBody(body: any, key: string, value: string, condition?: boolean): any {
  if (condition || (condition === undefined && value)) {
    body = body || {};

    body[key] = value;
  }

  return body;
}

function requestToken(url: string, csrfValue: string, envId?: string, permissionScope?: string, leId?: string) {
  let body: any;

  body = addToRequestBody(body, 'environment_id', envId);
  body = addToRequestBody(body, 'legal_entity_id', leId);
  body = addToRequestBody(body, 'permission_scope', permissionScope, !!((envId || leId) && permissionScope));

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
    permissionScope?: string,
    leId?: string,
    bypassCsrf?: boolean
  ) {
    if (permissionScope && !envId && !leId) {
      return Promise.reject({
        code: BBAuthTokenErrorCode.PermissionScopeNoEnvironment,
        message: 'You must also specify an environment or legal entity when specifying a permission scope.'
      });
    }

    return new Promise((resolve: any, reject: any) => {
      // First get the CSRF token

      new Promise((resolveCsrf: any, rejectCsrf: any) => {
        if (bypassCsrf) {
          resolveCsrf({
            csrf_token: 'token_needed'
          });
        } else {
          requestToken(BBAuthDomain.getSTSDomain() + '/session/csrf', 'token_needed')
            .then(resolveCsrf)
            .catch(rejectCsrf);
        }
      })
        .then((csrfResponse: any) => {
          // Next get the access token, and then pass it to the callback.
          return requestToken(url, csrfResponse['csrf_token'], envId, permissionScope, leId);
        })
        .then(resolve)
        .catch((reason: BBAuthTokenError) => {
          if (disableRedirect || reason.code === BBAuthTokenErrorCode.Offline) {
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
