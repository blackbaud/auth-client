import { BBAuthNavigator } from '../shared/navigator';
import { BBCsrfXhr } from './csrf-xhr';

import {
  BBAuthTokenError,
  BBAuthTokenErrorCode
} from '../auth';

import 'jasmine-ajax';

describe('Auth token integration', () => {
  let navigateSpy: jasmine.Spy;

  beforeAll(() => {
    jasmine.Ajax.install();

    navigateSpy = spyOn(BBAuthNavigator, 'navigate');
  });

  beforeEach(() => {

    navigateSpy.and.stub();
    navigateSpy.calls.reset();
  });

  afterAll(() => {
    jasmine.Ajax.uninstall();
  });

  it('should redirect to the signin page if the user is not signed in', (done) => {
    navigateSpy.and.callFake((url: string) => {
      expect(url).toBe('https://signin.blackbaud.com/signin/?redirectUrl=' + encodeURIComponent(location.href));
      done();
    });

    BBCsrfXhr.request('https://example.com/token');
    const request = jasmine.Ajax.requests.mostRecent();

    request.respondWith({
      responseText: undefined,
      status: 401
    });
  });

  it('should not redirect to the signin page when redirecting is disabled', (done) => {
    BBCsrfXhr.request('https://example.com/token', undefined, true)
      .catch((reason: BBAuthTokenError) => {
        expect(reason.code).toBe(BBAuthTokenErrorCode.NotLoggedIn);
        expect(reason.message).toBe('The user is not logged in.');
        done();
      });

    const request = jasmine.Ajax.requests.mostRecent();

    request.respondWith({
      responseText: undefined,
      status: 401
    });
  });

  it('should redirect when the user is not a member of the specified environment', (done) => {
    navigateSpy.and.callFake((url: string) => {
      expect(url).toBe(
        'https://host.nxt.blackbaud.com/errors/security?source=auth-client&url=' +
        encodeURIComponent(location.href) +
        '&code=invalid_env'
      );

      done();
    });

    BBCsrfXhr.request('https://example.com/token');

    const request = jasmine.Ajax.requests.mostRecent();

    request.respondWith({
      responseText: undefined,
      status: 403
    });
  });

  it('should redirect when an unknown error occurs', (done) => {
    navigateSpy.and.callFake((url: string) => {
      expect(url).toBe(
        'https://host.nxt.blackbaud.com/errors/broken?source=auth-client&url=' +
        encodeURIComponent(location.href)
      );

      done();
    });

    BBCsrfXhr.request('https://example.com/token');

    const request = jasmine.Ajax.requests.mostRecent();

    request.respondWith({
      responseText: undefined,
      status: 500
    });
  });

  it('should return a token if the user is signed in', (done) => {
    const tokenPromise = BBCsrfXhr.request('https://example.com/token');
    const csrfRequest = jasmine.Ajax.requests.mostRecent();

    csrfRequest.respondWith({
      responseText: JSON.stringify({
        csrf_token: 'abc'
      }),
      status: 200
    });

    // Wait for the token request to kick off.
    const intervalId = setInterval(() => {
      const tokenRequest = jasmine.Ajax.requests.mostRecent();

      if (tokenRequest.url === 'https://example.com/token') {
        clearInterval(intervalId);

        tokenRequest.respondWith({
          responseText: JSON.stringify({
            access_token: 'xyz',
            expires_in: 12345
          }),
          status: 200
        });

        tokenPromise.then((tokenResponse: any) => {
          expect(tokenResponse).toEqual({
            access_token: 'xyz',
            expires_in: 12345
          });

          done();
        });
      }
    });
  });

  it('should not try to parse an empty response', () => {
    BBCsrfXhr.request('https://example.com/token');
    const request = jasmine.Ajax.requests.mostRecent();

    const parseSpy = spyOn(JSON, 'parse').and.callThrough();

    request.respondWith({
      responseText: undefined,
      status: 200
    });

    expect(parseSpy).not.toHaveBeenCalled();
  });

  it('should append the specified signin URL params when redirected to signin', (done) => {
    navigateSpy.and.callFake((url: string) => {
      expect(url).toBe(
        'https://signin.blackbaud.com/signin/?redirectUrl=' +
        encodeURIComponent(location.href) +
        '&%3Dfoo%3D=b%26r'
      );
      done();
    });

    BBCsrfXhr.request(
      'https://example.com/token',
      {
        '=foo=': 'b&r'
      }
    );

    const request = jasmine.Ajax.requests.mostRecent();

    request.respondWith({
      responseText: undefined,
      status: 401
    });
  });

  it('should add the environment ID to the request body', (done) => {
    BBCsrfXhr.request(
      'https://example.com/token',
      undefined,
      undefined,
      'abc'
    );

    const csrfRequest = jasmine.Ajax.requests.mostRecent();

    csrfRequest.respondWith({
      responseText: JSON.stringify({
        csrf_token: 'abc'
      }),
      status: 200
    });

    // Wait for the token request to kick off.
    const intervalId = setInterval(() => {
      const tokenRequest = jasmine.Ajax.requests.mostRecent();

      if (tokenRequest.url === 'https://example.com/token') {
        clearInterval(intervalId);

        const requestData: any = tokenRequest.data();

        expect(requestData).toEqual({
          environment_id: 'abc'
        });

        done();
      }
    });
  });

  it('should add the environment ID and permission scope to the request body', (done) => {
    BBCsrfXhr.request(
      'https://example.com/token',
      undefined,
      undefined,
      'abc',
      '123'
    );

    const csrfRequest = jasmine.Ajax.requests.mostRecent();

    csrfRequest.respondWith({
      responseText: JSON.stringify({
        csrf_token: 'abc'
      }),
      status: 200
    });

    // Wait for the token request to kick off.
    const intervalId = setInterval(() => {
      const tokenRequest = jasmine.Ajax.requests.mostRecent();

      if (tokenRequest.url === 'https://example.com/token') {
        clearInterval(intervalId);

        const requestData: any = tokenRequest.data();

        expect(requestData).toEqual({
          environment_id: 'abc',
          permission_scope: '123'
        });

        done();
      }
    });
  });

  it('should require environment ID when permission scope is specified', (done) => {
    BBCsrfXhr.request(
      'https://example.com/token',
      undefined,
      undefined,
      undefined,
      '123'
    ).catch((reason: BBAuthTokenError) => {
      expect(reason.code).toBe(BBAuthTokenErrorCode.PermissionScopeNoEnvironment);
      expect(reason.message).toBe('You must also specify an environment when specifying a permission scope.');
      done();
    });
  });

  it('should provide a method for making a request with a BBID token', (done) => {
    BBCsrfXhr.requestWithToken(
      'https://example.com/token',
      'abc'
    ).then((response) => {
      expect(response).toEqual({
        success: true
      });

      done();
    });

    const request = jasmine.Ajax.requests.mostRecent();

    expect(request.url).toBe('https://example.com/token');
    expect(request.method).toBe('GET');

    expect(request.requestHeaders).toEqual({
      Accept: 'application/json',
      Authorization: 'Bearer abc'
    });

    request.respondWith({
      responseText: JSON.stringify({
        success: true
      }),
      status: 200
    });
  });

  it('should handle errors when making a request with a BBID token', (done) => {
    BBCsrfXhr.requestWithToken(
      'https://example.com/token',
      'abc'
    ).then(
      () => {
        /* do nothing */
      },
      () => {
        done();
      }
    );

    const request = jasmine.Ajax.requests.mostRecent();

    request.respondWith({
      status: 401
    });
  });

});
