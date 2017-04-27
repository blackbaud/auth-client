import { BBAuth } from './auth';
import { BBAuthTokenIntegration } from './auth-token-integration';

describe('Auth', () => {
  let authIntegrationGetTokenFake: any;

  beforeAll(() => {
    authIntegrationGetTokenFake = () => {
        return Promise.resolve({
          access_token: 'xyz',
          expires_in: 5
        });
      };

    spyOn(BBAuthTokenIntegration.prototype, 'getToken')
      .and.callFake(() => {
        return authIntegrationGetTokenFake();
      });
  });

  afterEach(() => {
    BBAuth.mock = false;
    (BBAuth as any).lastToken = undefined;
    (BBAuth as any).expirationTime = undefined;
  });

  it('should return a mock token when mock = true', (done) => {
    BBAuth.mock = true;

    BBAuth.getToken().then((token: string) => {
      expect(token).toBe('mock_access_token_auth-client@blackbaud.com');
      done();
    });
  });

  it('should return the cached token if it has not expired', (done) => {
    (BBAuth as any).lastToken = 'abc';
    (BBAuth as any).expirationTime = new Date().valueOf() + 100000;

    BBAuth.getToken().then((token: string) => {
      expect(token).toBe('abc');
      done();
    });
  });

  it('should return a new token if there is no cached token', (done) => {
    BBAuth.getToken().then((token: string) => {
      expect(token).toBe('xyz');
      done();
    });
  });

  it('should return a new token if the cached token is expired', (done) => {
    (BBAuth as any).lastToken = 'abc';
    (BBAuth as any).expirationTime = new Date().valueOf() - 100000;

    BBAuth.getToken().then((token: string) => {
      expect(token).toBe('xyz');
      done();
    });
  });

  it('should cache new tokens', (done) => {
    BBAuth.getToken().then((token: string) => {
      expect((BBAuth as any).lastToken).toBe('xyz');
      expect((BBAuth as any).expirationTime).toBeGreaterThan(new Date().valueOf());
      done();
    });
  });

  it('should not issue a second request if there is a pending promise to get a new tokens', (done) => {
    let tokenRequestCount: number;
    let resolveTokenPromise: any;

    tokenRequestCount = 0;

    authIntegrationGetTokenFake = () => {
        tokenRequestCount = tokenRequestCount + 1;
        return new Promise((resolve: any) => {
          resolveTokenPromise = resolve;
        });
      };

    const firstTokenPromise = BBAuth.getToken();
    const secondTokenPromise = BBAuth.getToken();

    // Only one auth integration request should have been made, since the second getToken call
    // occured before the first promise resolved
    expect(tokenRequestCount).toBe(1);
    expect(firstTokenPromise).toBe(secondTokenPromise);

    resolveTokenPromise({
        access_token: 'tok',
        expires_in: 10
      });

    firstTokenPromise.then((token: string) => {
      BBAuth.getToken();
      BBAuth.getToken();

      // Since the first getToken promise has resolved, calling getToken again should result in a second
      // auth integration requset
      expect(tokenRequestCount).toBe(2);

      done();
    });
  });
});
