import { BBAuthDomain } from '../auth/auth-domain';
import { BBCsrfXhr } from '../shared/csrf-xhr';

let ttlCache: {
  allowAnonymous: boolean,
  promise: Promise<number>,
  refreshId: string
};

function getExpirationFromAuthTtl(refreshId: string, allowAnonymous: boolean): Promise<number> {
  if (ttlCache && ttlCache.refreshId === refreshId && ttlCache.allowAnonymous === allowAnonymous) {
    return ttlCache.promise;
  }

  const promise = new Promise<number>((resolve, reject) => {
    BBCsrfXhr.request(
      BBAuthDomain.getSTSDomain() + '/session/ttl',
      undefined,
      allowAnonymous
    )
      .then(
        (ttl: number) => {
          const expirationDate = (ttl === null) ? null : Date.now() + ttl * 1000;

          resolve(expirationDate);
        },
        () => {
          resolve(null);
        }
      );
  });

  ttlCache = {
    allowAnonymous,
    promise,
    refreshId
  };

  return promise;
}

export class BBOmnibarUserSessionExpiration {

  public static getSessionExpiration(refreshId: string, legacyTtl: number, allowAnonymous: boolean): Promise<number> {
    const authTtlPromise = getExpirationFromAuthTtl(refreshId, allowAnonymous);

    return new Promise((resolve, reject) => {
      authTtlPromise.then((authExpirationDate: number) => {
        let expirationDate: number;

        if (authExpirationDate === null) {
          expirationDate = null;
        } else if (typeof legacyTtl === 'number') {
          const legacyExpirationDate = Date.now() + legacyTtl;
          expirationDate = Math.min(authExpirationDate, legacyExpirationDate);
        } else {
          expirationDate = authExpirationDate;
        }

        resolve(expirationDate);
      });
    });
  }

  public static reset() {
    ttlCache = undefined;
  }

}
