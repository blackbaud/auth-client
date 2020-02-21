const thirdPartyDomainSTSUrlMappings: { [domain: string]: string; } = {
  'bbk12.com': 'https://sts-sso.bbk12.com',
  'donorcentral.com': 'https://sts-dc.donorcentral.com'
};
const defaultSTSUrl = 'https://s21aidntoken00blkbapp01.nxt.blackbaud.com';

export class BBAuthDomain {

  public static CURRENT_DOMAIN = window.location.hostname;

  public static getRegisteredDomain(): string {

    return Object.keys(thirdPartyDomainSTSUrlMappings).find((d) => {
      const domainEndCompare = `.${d}`;

      return this.CURRENT_DOMAIN === d || this.CURRENT_DOMAIN.substr(-domainEndCompare.length) === domainEndCompare;
    });
  }

  public static getSTSDomain(): string {
    const registeredDomain = this.getRegisteredDomain();
    return thirdPartyDomainSTSUrlMappings[registeredDomain] || defaultSTSUrl;
  }
}
