function parseVersionString(str: string): number[] {
  const splitVersion = str.split('.');
  const parsedVersion: number[] = [];

  for (const num of splitVersion) {
    const versionNum: number = parseInt(num, 10) || 0;
    parsedVersion.push(versionNum);
  }
  return parsedVersion;
}

function isVersionMet(min: string, cur: string): boolean {
  const minVersion = parseVersionString(min);
  const currentVersion = parseVersionString(cur);

  for (let idx = 0; idx < minVersion.length; idx++) {
    if (idx < currentVersion.length) {
      if (currentVersion[idx] > minVersion[idx]) {
        return true;
      } else if (currentVersion[idx] < minVersion[idx]) {
        return false;
      }
    }
  }
  return true;
}

export class BBOmnibarScriptLoader {
  public static registerScript(url: string): Promise<any> {
    return new Promise<any>((resolve: any, reject: any) => {
      const scriptEl = document.createElement('script');

      scriptEl.onload = resolve;
      scriptEl.onerror = reject;

      scriptEl.src = url;

      document.body.appendChild(scriptEl);
    });
  }

  public static smartRegisterScript(
    url: string,
    minVersion: string,
    currentVersion?: string
  ): Promise<any> {
    if (currentVersion && isVersionMet(minVersion, currentVersion)) {
      return Promise.resolve();
    }

    return BBOmnibarScriptLoader.registerScript(url);
  }
}
