import { BBAuthGetDomain } from './auth-get-domain';

describe('Auth Get Domain', () => {

  describe('getDomain', () => {
    // tslint:disable-next-line:max-line-length
    it('returns CNAME STS Url when provided a white listed third party domain which has declared a CNAME STS endpoint', () => {
      expect(BBAuthGetDomain.getSTSDomain('bryonwilkins.com')).toBe('https://sts.bryonwilkins.com');
    });

    it('returns s21 STS Url when provided a blackbaud domain', () => {
      expect(BBAuthGetDomain.getSTSDomain('blackbaud.com')).toBe('https://s21aidntoken00blkbapp01.nxt.blackbaud.com');
    });

    // tslint:disable-next-line:max-line-length
    it('returns s21 STS Url when provided a white listed third party domain which has NOT declared a CNAME STS endpoint', () => {
      expect(BBAuthGetDomain.getSTSDomain('thirdparty.com')).toBe('https://s21aidntoken00blkbapp01.nxt.blackbaud.com');
    });
  });
});
