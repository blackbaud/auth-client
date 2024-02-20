//#region imports

import { BBCsrfXhr } from '../shared/csrf-xhr';
import { BBAuth } from './auth';
import { BBAuthDomain } from './auth-domain';

import { BBAuthTokenIntegration } from './auth-token-integration';

//#endregion

describe('Auth', () => {
  let authIntegrationGetTokenFake: () => Promise<unknown>;
  let getTokenSpy: jasmine.Spy;

  beforeAll(() => {
    getTokenSpy = spyOn(BBAuthTokenIntegration, 'getToken').and.callFake(() => {
      return authIntegrationGetTokenFake();
    });
  });

  beforeEach(() => {
    authIntegrationGetTokenFake = () => {
      return Promise.resolve({
        access_token: 'xyz',
        expires_in: 5,
      });
    };
  });

  afterEach(() => {
    BBAuth.mock = false;
    BBAuth.tokenCache = {};

    getTokenSpy.calls.reset();
  });

  it('should return a mock token when mock = true', (done) => {
    BBAuth.mock = true;

    BBAuth.getToken().then((token: string) => {
      expect(token).toBe('mock_access_token_auth-client@blackbaud.com');
      done();
    });
  });

  it('should return the cached token if it has not expired', (done) => {
    const tokenCache = BBAuth.tokenCache;

    tokenCache['token|-|-|-'] = {
      expirationTime: new Date().valueOf() + 100000,
      lastToken: 'abc',
    };

    BBAuth.getToken().then((token: string) => {
      expect(token).toBe('abc');
      done();
    });
  });

  it('should return a new token if requested even if there is a cached token', (done) => {
    const tokenCache = BBAuth.tokenCache;

    tokenCache['token|-|-|-'] = {
      expirationTime: new Date().valueOf() + 100000,
      lastToken: 'abc',
    };

    BBAuth.getToken({
      forceNewToken: true,
    }).then((token: string) => {
      expect(token).toBe('xyz');
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
    const tokenCache = BBAuth.tokenCache;

    tokenCache['token|-|-|-'] = {
      expirationTime: new Date().valueOf() - 100000,
      lastToken: 'abc',
    };

    BBAuth.getToken().then((token: string) => {
      expect(token).toBe('xyz');
      done();
    });
  });

  it('should cache new tokens', (done) => {
    BBAuth.getToken().then(() => {
      const tokenCache = BBAuth.tokenCache;

      expect(tokenCache['token|-|-|-'].lastToken).toBe('xyz');
      expect(tokenCache['token|-|-|-'].expirationTime).toBeGreaterThan(
        new Date().valueOf()
      );
      done();
    });
  });

  it('should cache tokens based on the specified legal entity ID, environment ID, and permission scope', (done) => {
    BBAuth.getToken({
      envId: '123',
      leId: 'foo',
      permissionScope: 'abc',
    }).then(() => {
      const tokenCache = BBAuth.tokenCache;

      expect(tokenCache['token|foo|123|abc'].lastToken).toBe('xyz');
      expect(tokenCache['token|foo|123|abc'].expirationTime).toBeGreaterThan(
        new Date().valueOf()
      );
      done();
    });
  });

  it('should cache tokens based on the specified environment ID and permission scope', (done) => {
    BBAuth.getToken({
      envId: '123',
      permissionScope: 'abc',
    }).then(() => {
      const tokenCache = BBAuth.tokenCache;

      expect(tokenCache['token|-|123|abc'].lastToken).toBe('xyz');
      expect(tokenCache['token|-|123|abc'].expirationTime).toBeGreaterThan(
        new Date().valueOf()
      );
      done();
    });
  });

  it('should not issue a second request if there is a pending promise to get a new tokens', (done) => {
    let tokenRequestCount: number;
    let resolveTokenPromise: (_: unknown) => void;
    let rejectTokenPromise: () => void;

    tokenRequestCount = 0;

    authIntegrationGetTokenFake = () => {
      tokenRequestCount = tokenRequestCount + 1;
      return new Promise((resolve, reject) => {
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
      expires_in: 10,
    });

    tokenPromise1.then(() => {
      const tokenPromise3 = BBAuth.getToken();
      const tokenPromise4 = BBAuth.getToken();

      // Since the first getToken promise has resolved, calling getToken again should result in a second
      // auth integration requset
      expect(tokenRequestCount).toBe(2);
      expect(tokenPromise3).toBe(tokenPromise4);

      rejectTokenPromise();

      tokenPromise3.catch(() => {
        const tokenPromise5 = BBAuth.getToken();
        const tokenPromise6 = BBAuth.getToken();

        // Since the pending getToken promise has rejected, calling getToken again should result in a new
        // auth integration requset
        expect(tokenRequestCount).toBe(3);
        expect(tokenPromise5).toBe(tokenPromise6);

        done();
      });
    });
  });

  it('should allow redirecting to signin to be disabled', (done) => {
    BBAuth.getToken({
      disableRedirect: true,
    }).then(() => {
      expect(getTokenSpy).toHaveBeenCalledWith(
        true,
        undefined,
        undefined,
        undefined,
        undefined
      );
      done();
    });
  });

  it('should pass environment ID and permission scope', (done) => {
    BBAuth.getToken({
      envId: 'abc',
      permissionScope: '123',
    }).then(() => {
      expect(getTokenSpy).toHaveBeenCalledWith(
        undefined,
        'abc',
        '123',
        undefined,
        undefined
      );
      done();
    });
  });

  it('should pass legal entity ID', (done) => {
    BBAuth.getToken({
      leId: 'bar',
    }).then(() => {
      expect(getTokenSpy).toHaveBeenCalledWith(
        undefined,
        undefined,
        undefined,
        'bar',
        undefined
      );
      done();
    });
  });

  it('should pass legal entity ID, environment ID, and permission scope', (done) => {
    BBAuth.getToken({
      envId: 'abc',
      leId: 'baz',
      permissionScope: '123',
    }).then(() => {
      expect(getTokenSpy).toHaveBeenCalledWith(
        undefined,
        'abc',
        '123',
        'baz',
        undefined
      );
      done();
    });
  });

  it('should pass legal entity ID, environment ID, permission scope, and svc ID', (done) => {
    BBAuth.getToken({
      envId: 'abc',
      leId: 'baz',
      permissionScope: '123',
      svcId: 'cool-svc',
    }).then(() => {
      expect(getTokenSpy).toHaveBeenCalledWith(
        undefined,
        'abc',
        '123',
        'baz',
        'cool-svc'
      );
      done();
    });
  });

  it('should convert tokenized urls and honor the hard-coded zone.', (done) => {
    BBAuth.getUrl('1bb://eng-hub00-pusa01/version').then((url: string) => {
      expect(url).toBe('https://eng-pusa01.app.blackbaud.net/hub00/version');
      done();
    });
  });

  it('should convert tokenized urls and get zone from the token.', (done) => {
    BBAuth.getUrl('1bb://eng-hub00/version', {
      zone: 'p-can01',
    }).then((url: string) => {
      expect(url).toBe('https://eng-pcan01.app.blackbaud.net/hub00/version');
      done();
    });
  });

  it('should return session TTL.', (done) => {
    const postSpy = spyOn(BBCsrfXhr, 'postWithCSRF').and.returnValue(
      Promise.resolve(1234)
    );
    spyOn(BBAuthDomain, 'getSTSDomain').and.returnValue(
      'https://sts.sky.blackbaud.com'
    );

    BBAuth.getTTL().then((ttl: number) => {
      expect(ttl).toBe(1234);
      expect(postSpy).toHaveBeenCalledWith(
        'https://sts.sky.blackbaud.com/session/ttl'
      );
      done();
    });
  });

  it('should renew the session.', (done) => {
    const postSpy = spyOn(BBCsrfXhr, 'postWithCSRF').and.returnValue(
      Promise.resolve()
    );
    spyOn(BBAuthDomain, 'getSTSDomain').and.returnValue(
      'https://sts.sky.blackbaud.com'
    );

    BBAuth.renewSession().then((result) => {
      expect(result).toBe(undefined);
      expect(postSpy).toHaveBeenCalledWith(
        'https://sts.sky.blackbaud.com/session/renew'
      );
      done();
    });
  });
});
