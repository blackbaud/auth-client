
const thirdPartyDomainSTSUrls: { [domain: string]: string; } = {
  'bryonwilkins.com': 'https://sts.bryonwilkins.com'
};
const defaultSTSUrl = 'https://s21aidntoken00blkbapp01.nxt.blackbaud.com';

export class BBAuthGetDomain {

  public static getSTSDomain(domain: string = window.location.hostname) {
    return domain in thirdPartyDomainSTSUrls ? thirdPartyDomainSTSUrls[domain] : defaultSTSUrl;
  }

}
