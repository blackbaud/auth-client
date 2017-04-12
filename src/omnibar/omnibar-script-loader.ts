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

}
