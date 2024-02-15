import { BBAuthTokenError, BBAuthTokenErrorCode } from '../auth';

import { BBAuthDomain } from '../auth/auth-domain';

import { BBAuthNavigator } from './navigator';

function post(
  url: string,
  header: {
    name: string;
    value: string;
  },
  body: unknown,
  okCB: (response: unknown) => unknown,
  unuthCB: (reason: BBAuthTokenError) => unknown
) {
  const xhr = new XMLHttpRequest();

  xhr.onreadystatechange = () => {
    if (xhr.readyState === 4) {
      switch (xhr.status) {
        case 0:
          unuthCB({
            code: BBAuthTokenErrorCode.Offline,
            message: 'The user is offline.',
          });
          break;
        case 200:
          okCB(xhr.responseText);
          break;
        case 401:
          unuthCB({
            code: BBAuthTokenErrorCode.NotLoggedIn,
            message: 'The user is not logged in.',
          });
          break;
        case 403:
          unuthCB({
            code: BBAuthTokenErrorCode.InvalidEnvironment,
            message: 'The user is not a member of the specified environment.',
          });
          break;
        default:
          /* istanbul ignore else */
          if (xhr.status >= 400) {
            unuthCB({
              code: BBAuthTokenErrorCode.Unspecified,
              message: 'An unknown error occurred.',
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

function addToRequestBody(
  body: Record<string, string>,
  key: string,
  value: string,
  condition?: boolean
): Record<string, string> {
  if (condition || (condition === undefined && value)) {
    body = body || {};

    body[key] = value;
  }

  return body;
}

function requestToken(
  url: string,
  csrfValue: string,
  envId?: string,
  permissionScope?: string,
  leId?: string,
  svcId?: string
) {
  let body: Record<string, string>;

  body = addToRequestBody(body, 'environment_id', envId);
  body = addToRequestBody(body, 'legal_entity_id', leId);
  body = addToRequestBody(
    body,
    'permission_scope',
    permissionScope,
    !!((envId || leId) && permissionScope)
  );
  body = addToRequestBody(body, 'svc_id', svcId);

  return new Promise<unknown>((resolve, reject) => {
    post(
      url,
      {
        name: 'X-CSRF',
        value: csrfValue,
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
    signinRedirectParams?: Record<string, unknown>,
    disableRedirect?: boolean,
    envId?: string,
    permissionScope?: string,
    leId?: string,
    bypassCsrf?: boolean,
    svcId?: string
  ) {
    if (permissionScope && !envId && !leId) {
      return Promise.reject({
        code: BBAuthTokenErrorCode.PermissionScopeNoEnvironment,
        message:
          'You must also specify an environment or legal entity when specifying a permission scope.',
      });
    }

    return new Promise((resolve, reject) => {
      // First get the CSRF token

      new Promise((resolveCsrf, rejectCsrf) => {
        if (bypassCsrf) {
          resolveCsrf({
            csrf_token: 'token_needed',
          });
        } else {
          requestToken(
            BBAuthDomain.getSTSDomain() + '/session/csrf',
            'token_needed'
          )
            .then(resolveCsrf)
            .catch(rejectCsrf);
        }
      })
        .then((csrfResponse: Record<string, string>) => {
          // Next get the access token, and then pass it to the callback.
          return requestToken(
            url,
            csrfResponse['csrf_token'],
            envId,
            permissionScope,
            leId,
            svcId
          );
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

  public static postWithCSRF(url: string) {
    return new Promise((resolve, reject) => {
      // First get the CSRF token
      new Promise<Record<string, string>>((resolveCsrf, rejectCsrf) => {
        requestToken(
          BBAuthDomain.getSTSDomain() + '/session/csrf',
          'token_needed'
        )
          .then(resolveCsrf)
          .catch(rejectCsrf);
      })
        .then((csrfResponse) => {
          // Next issue the request with the csrf token
          return new Promise((res, rej) => {
            post(
              url,
              {
                name: 'X-CSRF',
                value: csrfResponse['csrf_token'],
              },
              undefined,
              (result) => {
                res(result);
              },
              rej
            );
          });
        })
        .then(resolve)
        .catch((reason: BBAuthTokenError) => {
          if (reason.code === BBAuthTokenErrorCode.Offline) {
            reject(reason);
          } else {
            switch (reason.code) {
              case BBAuthTokenErrorCode.NotLoggedIn:
                BBAuthNavigator.redirectToSignin();
                break;
              default:
                BBAuthNavigator.redirectToError(reason.code);
                break;
            }
          }
        });
    });
  }

  public static requestWithToken<T = unknown>(
    url: string,
    token: string,
    verb = 'GET',
    body?: unknown
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      xhr.onreadystatechange = () => {
        if (xhr.readyState === 4) {
          switch (xhr.status) {
            case 200:
              let result: T;

              if (xhr.responseText) {
                result = JSON.parse(xhr.responseText);
              }

              resolve(result);
              break;
            default:
              reject(xhr);
              break;
          }
        }
      };

      xhr.open(verb, url, true);

      xhr.setRequestHeader('Authorization', 'Bearer ' + token);
      xhr.setRequestHeader('Accept', 'application/json');

      switch (verb) {
        case 'GET':
          xhr.send();
          break;
        case 'PATCH':
        case 'POST':
          xhr.setRequestHeader('Content-Type', 'application/json');
          xhr.send(JSON.stringify(body));
          break;
      }
    });
  }
}
