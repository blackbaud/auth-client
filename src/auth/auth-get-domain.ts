
const thirdPartyDomainSTSUrls: { [domain: string]: string; } = {
  'bryonwilkins.com': 'https://sts.bryonwilkins.com'
};
const defaultSTSUrl = 'https://s21aidntoken00blkbapp01.nxt.blackbaud.com';

export class BBAuthGetDomain {

  public static getSTSDomain(domain: string) {
    // User is on BB domain -> regular STS endpoint
    // User is on 3rd party domain AND has NOT declared a CNAME STS endpoint -> regular STS endpoint
    // User is on 3rd party domain AND they have declared a CNAME STS endpoint -> special CNAME STS endpoint
    // (currently no one, but will be cross domain loopers)

    return domain in thirdPartyDomainSTSUrls ? thirdPartyDomainSTSUrls[domain] : defaultSTSUrl;
  }

}
