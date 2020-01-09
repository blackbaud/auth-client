
const thirdPartyDomainSTSUrlMappings: { [domain: string]: string; } = {
  'bbk12.com': 'https://sts-sso.bbk12.com'
};
const defaultSTSUrl = 'https://s21aidntoken00blkbapp01.nxt.blackbaud.com';

export class BBAuthDomain {

  public static CURRENT_DOMAIN = window.location.hostname;

  public static getRegisteredDomain(): string {
    let domain;

    Object.keys(thirdPartyDomainSTSUrlMappings).forEach((d) => {
      const domainEndCompare = `.${d}`;

      if (this.CURRENT_DOMAIN === d || this.CURRENT_DOMAIN.substr(-domainEndCompare.length) === domainEndCompare) {
        domain = d;
      }
    });

    return domain;
  }

  public static getSTSDomain(): string {
    const registeredDomain = this.getRegisteredDomain();
    return thirdPartyDomainSTSUrlMappings[registeredDomain] || defaultSTSUrl;
  }
}
