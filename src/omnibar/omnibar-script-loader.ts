export class BBOmnibarScriptLoader {

  public static registerScript(url: string): Promise<any> {
    return new Promise<any>((resolve: any, reject: any) => {
      let scriptEl = document.createElement('script');

      scriptEl.onload = resolve;
      scriptEl.onerror = reject;

      scriptEl.src = url;

      document.body.appendChild(scriptEl);
    });
  }

  public static smartRegisterScript(url: string, minVersion: string, currentVersion?: string): Promise<any>{
      if(currentVersion && this.isVersionMet(minVersion, currentVersion)){
          return new Promise<any>((resolve: any, reject: any) => {
              resolve();
          });
      }
      return this.registerScript(url);
  }

  public static isVersionMet(min: string, cur: string){
    let minVersion = this.parseVersionString(min),
        currentVersion = this.parseVersionString(cur);

    if (currentVersion.major !== minVersion.major) {
        return (currentVersion.major > minVersion.major);
    }
    if (currentVersion.minor !== minVersion.minor) {
        return (currentVersion.minor > minVersion.minor);
    }
    if (currentVersion.patch !== minVersion.patch) {
        return (currentVersion.patch > minVersion.patch);
    }
    return true;
  }

  private static parseVersionString(str: string): Object{
    var maj,
        min,
        pat,
        x;

    x = str.split('.');
    // parse from string or default to 0 if can't parse
    maj = parseInt(x[0], 10) || 0;
    min = parseInt(x[1], 10) || 0;
    pat = parseInt(x[2], 10) || 0;
    return {major: maj, minor: min, patch: pat};
  }

}
