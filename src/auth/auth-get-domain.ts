const thirdPartyDomainSTSUrlMappings: { [domain: string]: string; } = {
  'bbk12.com': 'https://sts-sso.bbk12.com'
};
const defaultSTSUrl = 'https://s21aidntoken00blkbapp01.nxt.blackbaud.com';

export class BBAuthGetDomain {

  private static cacheDictionary: any = {};

  public static isRegisteredDomain(domain: string = window.location.hostname): boolean {
    if (domain in this.cacheDictionary) {
      return this.cacheDictionary[domain].isRegistered;
    }
    let isRegistered = false;
    Object.keys(thirdPartyDomainSTSUrlMappings).forEach((d) => {
      let domainEndingCompare = d;
      if (!domainEndingCompare.startsWith('.')) {
        domainEndingCompare = '.' + domainEndingCompare;
      }
      if (domain === d || domain.endsWith(domainEndingCompare)) {
        isRegistered = true;
        this.cacheDictionary[domain] = { isRegistered: true, domainKey: d };
      }
    });
    if (!isRegistered) { this.cacheDictionary[domain] = { isRegistered: false }; }
    return isRegistered;
  }

  public static getSTSDomain(domain: string = window.location.hostname): string {
    return this.isRegisteredDomain(domain) ?
     thirdPartyDomainSTSUrlMappings[this.cacheDictionary[domain].domainKey] : defaultSTSUrl;
  }
}
