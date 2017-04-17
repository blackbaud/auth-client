import { BBAuth } from './auth';
import { BBAuthTokenIntegration } from './auth-token-integration';

describe('Auth', () => {
  beforeAll(() => {
    spyOn(BBAuthTokenIntegration.prototype, 'getToken')
      .and.callFake(() => {
        return Promise.resolve({
          access_token: 'xyz',
          expires_in: 5
        });
      });
  });

  afterEach(() => {
    BBAuth.mock = false;
    (<any> BBAuth).lastToken = undefined;
    (<any> BBAuth).expirationTime = undefined;
  });

  it('should return a mock token when mock = true', (done) => {
    BBAuth.mock = true;

    BBAuth.getToken().then((token: string) => {
      expect(token).toBe('mock_access_token_auth-client@blackbaud.com');
      done();
    });
  });

  it('should return the cached token if it has not expired', (done) => {
    (<any> BBAuth).lastToken = 'abc';
    (<any> BBAuth).expirationTime = new Date().valueOf() + 100000;

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
    (<any> BBAuth).lastToken = 'abc';
    (<any> BBAuth).expirationTime = new Date().valueOf() - 100000;

    BBAuth.getToken().then((token: string) => {
      expect(token).toBe('xyz');
      done();
    });
  });

  it('should cache new tokens', (done) => {
    BBAuth.getToken().then((token: string) => {
      expect((<any> BBAuth).lastToken).toBe('xyz');
      expect((<any> BBAuth).expirationTime).toBeGreaterThan(new Date().valueOf());
      done();
    });
  });
});
