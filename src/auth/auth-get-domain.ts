
const thirdPartyDomainSTSUrls: { [domain: string]: string; } = {
  'bryonwilkins.com': 'https://sts.bryonwilkins.com'
};
const defaultSTSUrl = 'https://s21aidntoken00blkbapp01.nxt.blackbaud.com';

export class BBAuthGetDomain {

  public static isRegisteredDomain(domain: string = window.location.hostname): boolean {
    console.log('checking if domain is registered');
    return domain in thirdPartyDomainSTSUrls;
  }

  public static getSTSDomain(domain: string = window.location.hostname): string {
    return domain in thirdPartyDomainSTSUrls ? thirdPartyDomainSTSUrls[domain] : defaultSTSUrl;
  }

}
