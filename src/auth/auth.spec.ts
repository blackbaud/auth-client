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
    let rejectTokenPromise: any;

    tokenRequestCount = 0;

    authIntegrationGetTokenFake = () => {
        tokenRequestCount = tokenRequestCount + 1;
        return new Promise((resolve: any, reject: any) => {
          resolveTokenPromise = resolve;
          rejectTokenPromise = reject;
        });
      };

    const tokenPromise1 = BBAuth.getToken();
    const tokenPromise2 = BBAuth.getToken();

    // Only one auth integration request should have been made, since the second getToken call
    // occured before the first promise resolved
    expect(tokenRequestCount).toBe(1);
    expect(tokenPromise1).toBe(tokenPromise2);

    resolveTokenPromise({
        access_token: 'tok',
        expires_in: 10
      });

    tokenPromise1.then((token: string) => {
      const tokenPromise3 = BBAuth.getToken();
      const tokenPromise4 = BBAuth.getToken();

      // Since the first getToken promise has resolved, calling getToken again should result in a second
      // auth integration requset
      expect(tokenRequestCount).toBe(2);
      expect(tokenPromise3).toBe(tokenPromise4);

      rejectTokenPromise();

      tokenPromise3.catch(() => {
        done();
        const tokenPromise5 = BBAuth.getToken();
        const tokenPromise6 = BBAuth.getToken();

        // Since the pending getToken promise has rejected, calling getToken again should result in a new
        // auth integration requset
        expect(tokenRequestCount).toBe(3);
        expect(tokenPromise5).toBe(tokenPromise6);
      });
    });
  });
});
