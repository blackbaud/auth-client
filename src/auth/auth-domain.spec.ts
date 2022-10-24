import { BBAuthDomain } from './auth-domain';

describe('Auth Get Domain', () => {
  describe('getRegisteredDomain', () => {
    it('returns registered domain when user is on the registered domain', () => {
      BBAuthDomain.CURRENT_DOMAIN = 'bbk12.com';
      expect(BBAuthDomain.getRegisteredDomain()).toBe('bbk12.com');
    });

    it('returns registered domain when user is on a valid subdomain ', () => {
      BBAuthDomain.CURRENT_DOMAIN = 'app.bbk12.com';
      expect(BBAuthDomain.getRegisteredDomain()).toBe('bbk12.com');
    });

    it('returns undefined for an unregistered domain', () => {
      BBAuthDomain.CURRENT_DOMAIN = 'unregistered.com';
      expect(BBAuthDomain.getRegisteredDomain()).toBeUndefined();
    });

    it('returns undefined for unregistered subdomain', () => {
      BBAuthDomain.CURRENT_DOMAIN = 'badappbbk12.com';
      expect(BBAuthDomain.getRegisteredDomain()).toBeUndefined();
    });
  });

  describe('getSTSDomain', () => {
    // tslint:disable-next-line:max-line-length
    it('returns CNAME STS Url when user is on a registered third party domain which has declared a CNAME STS endpoint', () => {
      BBAuthDomain.CURRENT_DOMAIN = 'bbk12.com';
      expect(BBAuthDomain.getSTSDomain()).toBe('https://sts-sso.bbk12.com');
    });

    it('returns default STS Url when user is on a Blackbaud domain', () => {
      BBAuthDomain.CURRENT_DOMAIN = 'blackbaud.com';
      expect(BBAuthDomain.getSTSDomain()).toBe('https://sts.sky.blackbaud.com');
    });

    // tslint:disable-next-line:max-line-length
    it('returns default STS Url when user is on a registered third party domain which has NOT declared a CNAME STS endpoint', () => {
      BBAuthDomain.CURRENT_DOMAIN = 'unregisteredthirdparty.com';
      expect(BBAuthDomain.getSTSDomain()).toBe('https://sts.sky.blackbaud.com');
    });

    // tslint:disable-next-line:max-line-length
    it('returns CNAME STS Url when user is on a registered third party subdomain which has declared a CNAME STS endpoint', () => {
      BBAuthDomain.CURRENT_DOMAIN = 'app.bbk12.com';
      expect(BBAuthDomain.getSTSDomain()).toBe('https://sts-sso.bbk12.com');
    });
  });
});
