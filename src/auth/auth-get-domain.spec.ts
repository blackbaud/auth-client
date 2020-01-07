import { BBAuthGetDomain } from './auth-get-domain';

describe('Auth Get Domain', () => {

  describe('isRegisteredDomain', () => {
    it('returns true for registered domain', () => {
      expect(BBAuthGetDomain.isRegisteredDomain('bbk12.com')).toBe(true);
    });

    it('returns true for registered subdomain', () => {
      expect(BBAuthGetDomain.isRegisteredDomain('app.bbk12.com')).toBe(true);
    });

    it('returns false for unregistered domain', () => {
      expect(BBAuthGetDomain.isRegisteredDomain('unregistered.com')).toBe(false);
    });

    it('returns false for unregistered subdomain', () => {
      expect(BBAuthGetDomain.isRegisteredDomain('badappbbk12.com')).toBe(false);
    });
  });

  describe('getSTSDomain', () => {
    // tslint:disable-next-line:max-line-length
    it('returns CNAME STS Url when provided a white listed third party domain which has declared a CNAME STS endpoint', () => {
      expect(BBAuthGetDomain.getSTSDomain('bbk12.com')).toBe('https://sts-sso.bbk12.com');
    });

    it('returns s21 STS Url when provided a blackbaud domain', () => {
      expect(BBAuthGetDomain.getSTSDomain('blackbaud.com')).toBe('https://s21aidntoken00blkbapp01.nxt.blackbaud.com');
    });

    // tslint:disable-next-line:max-line-length
    it('returns s21 STS Url when provided a white listed third party domain which has NOT declared a CNAME STS endpoint', () => {
      expect(BBAuthGetDomain.getSTSDomain('thirdparty.com')).toBe('https://s21aidntoken00blkbapp01.nxt.blackbaud.com');
    });

    // tslint:disable-next-line:max-line-length
    it('returns CNAME STS Url when provided a white listed third party subdomain which has declared a CNAME STS endpoint', () => {
      expect(BBAuthGetDomain.getSTSDomain('app.bbk12.com')).toBe('https://sts-sso.bbk12.com');
    });
  });
});
