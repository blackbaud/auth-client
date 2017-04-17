import { BBAuthInterop } from '../shared/interop';
import { BBAuthTokenIntegration } from './auth-token-integration';

import 'jasmine-ajax';

describe('Auth token integration', () => {
  let tokenIteraction: BBAuthTokenIntegration;

  beforeEach(() => {
    jasmine.Ajax.install();

    tokenIteraction = new BBAuthTokenIntegration(
      'https://example.com/csrf/',
      'https://example.com/token/',
      'https://example.com/'
    );
  });

  afterEach(() => {
    jasmine.Ajax.uninstall();
  });

  it('should redirect to the signin page if the user is not signed in', (done) => {
    const navigateSpy = spyOn(BBAuthInterop, 'navigate').and.callFake((url: string) => {
      expect(url).toBe('https://example.com/?redirectUrl=' + encodeURIComponent(location.href));
      done();
    });

    const tokenPromise = tokenIteraction.getToken();
    const request = jasmine.Ajax.requests.mostRecent();

    request.respondWith({
      responseText: undefined,
      status: 401
    });
  });

  it('should return a token if the user is signed in', (done) => {
    const tokenPromise = tokenIteraction.getToken();
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

      if (tokenRequest.url === 'https://example.com/token/') {
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

});
