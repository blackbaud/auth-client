import { BBOmnibarScriptLoader } from './omnibar-script-loader';

describe('Omnibar script loader', () => {

  it('should register the specified script', (done) => {
    const appendChildSpy = spyOn(
      document.body,
      'appendChild'
    )
      .and.callFake((el: any) => {
        el.onload();
      });

    BBOmnibarScriptLoader
      .registerScript('https://example.com/')
      .then(() => {
        expect(appendChildSpy).toHaveBeenCalledWith(
          jasmine.objectContaining({
            src: 'https://example.com/'
          })
        );

        done();
      });
  });

  it('should handle scripts that fail to load', (done) => {
    spyOn(
      document.body,
      'appendChild'
    )
      .and.callFake((el: any) => {
        el.onerror();
      });

    BBOmnibarScriptLoader
      .registerScript('https://example.com/')
      .then(() => {
        done.fail('Calling onerror should have caused the promise to fail.');
      })
      .catch(() => {
        done();
      });
  });

  it('should not register a script if a higher version is already registered', (done) => {
    const appendChildSpy = spyOn(
      document.body,
      'appendChild'
    )
      .and.callFake((el: any) => {
        el.onload();
      });

    BBOmnibarScriptLoader
      .smartRegisterScript('https://example.com/', '2.3.4', '3.1.0')
      .then(() => {
        expect(appendChildSpy).not.toHaveBeenCalledWith(
          jasmine.objectContaining({
            src: 'https://example.com/'
          })
        );
        done();
      });
  });

  it('should support comparing version numbers of varying segment lengths', (done) => {
    const appendChildSpy = spyOn(
      document.body,
      'appendChild'
    )
      .and.callFake((el: any) => {
        el.onload();
      });

    BBOmnibarScriptLoader
      .smartRegisterScript('https://example.com/', '2.3.4', '2.3.3')
      .then(() => {
        expect(appendChildSpy).toHaveBeenCalledWith(
          jasmine.objectContaining({
            src: 'https://example.com/'
          })
        );
        done();
      });
  });

  it('should not register a script if the same version is already registered', (done) => {
    const appendChildSpy = spyOn(
      document.body,
      'appendChild'
    )
      .and.callFake((el: any) => {
        el.onload();
      });

    BBOmnibarScriptLoader
      .smartRegisterScript('https://example.com/', '2.3.4', '2.3.4')
      .then(() => {
        expect(appendChildSpy).not.toHaveBeenCalledWith(
          jasmine.objectContaining({
            src: 'https://example.com/'
          })
        );
        done();
      });
  });

  it('should register a script if a lower version is already registered', (done) => {
    const appendChildSpy = spyOn(
      document.body,
      'appendChild'
    )
      .and.callFake((el: any) => {
        el.onload();
      });

    BBOmnibarScriptLoader
      .smartRegisterScript('https://example.com/', '2.3.4', '2.3.3')
      .then(() => {
        expect(appendChildSpy).toHaveBeenCalledWith(
          jasmine.objectContaining({
            src: 'https://example.com/'
          })
        );
        done();
      });
  });

  it('should support comparing version numbers when they are the same except for the patch segment', (done) => {
    const appendChildSpy = spyOn(
      document.body,
      'appendChild'
    )
      .and.callFake((el: any) => {
        el.onload();
      });

    BBOmnibarScriptLoader
      .smartRegisterScript('https://example.com/', '2.4.1', '2.4')
      .then(() => {
        expect(appendChildSpy).not.toHaveBeenCalledWith(
          jasmine.objectContaining({
            src: 'https://example.com/'
          })
        );
        done();
      });
  });
});
