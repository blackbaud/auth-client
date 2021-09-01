const thirdPartyDomainSTSUrlMappings: { [domain: string]: string; } = {
  'bbk12.com': 'https://sts-sso.bbk12.com',
  'blackbaudfaith.com': 'https://sts.blackbaudfaith.com',
  'blackbaudhosting.com': 'https://sts.blackbaudhosting.com',
  'blackbaudportal.com': 'https://sts.blackbaudportal.com',
  'donorcentral.com': 'https://sts-dc.donorcentral.com',
  'etapestry.com': 'https://sts.etapestry.com',
  'mycampus-app.com': 'https://sts-sso.mycampus-app.com',
  'myschoolapp.com': 'https://sts-sso.myschoolapp.com',
  'myschoolautomation.com': 'https://sts-sso.myschoolautomation.com',
  'myschooldemo.com': 'https://sts-sso.myschooldemo.com',
  'myschooltraining.com': 'https://sts-sso.myschooltraining.com',
  'smartaidforparents-com-stage.smarttuition.net': 'https://account.smartaidforparents-com-stage.smarttuition.net',
  'smartaidforparents.com': 'https://account.smartaidforparents.com',
  'smarttuition.com': 'https://account.smarttuition.com',
  'blackbaud.school': 'https://account.blackbaud.school',
  'blackbaud.school.stage.d04.io': 'https://account.blackbaud.school.stage.d04.io'
};
const defaultSTSUrl = 'https://sts.sky.blackbaud.com';

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
