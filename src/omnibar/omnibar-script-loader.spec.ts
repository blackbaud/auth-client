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
    const appendChildSpy = spyOn(
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

});
