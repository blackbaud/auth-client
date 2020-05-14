const thirdPartyDomainSTSUrlMappings: { [domain: string]: string; } = {
  'bbk12.com': 'https://sts-sso.bbk12.com',
  'donorcentral.com': 'https://sts-dc.donorcentral.com',
  'mycampus-app.com': 'https://sts-sso.mycampus-app.com',
  'myschoolapp.com': 'https://sts-sso.myschoolapp.com',
  'myschoolautomation.com': 'https://sts-sso.myschoolautomation.com',
  'myschooldemo.com': 'https://sts-sso.myschooldemo.com',
  'myschooltraining.com': 'https://sts-sso.myschooltraining.com',
  'blackbaudfaith.com': 'https://sts.blackbaudfaith.com'
};
const defaultSTSUrl = 'https://s21aidntoken00blkbapp01.nxt.blackbaud.com';

export class BBAuthDomain {

  public static CURRENT_DOMAIN = window.location.hostname;

  public static getRegisteredDomain(): string {
    for (const d of Object.keys(thirdPartyDomainSTSUrlMappings)) {
      const domainEndCompare = `.${d}`;

      if (this.CURRENT_DOMAIN === d || this.CURRENT_DOMAIN.substr(-domainEndCompare.length) === domainEndCompare) {
        return d;
      }
    }
  }

  public static getSTSDomain(): string {
    const registeredDomain = this.getRegisteredDomain();
    return thirdPartyDomainSTSUrlMappings[registeredDomain] || defaultSTSUrl;
  }
}
