import { BBOmnibarLegacy } from './omnibar-legacy';

import { BBOmnibarScriptLoader } from './omnibar-script-loader';

describe('Omnibar', () => {
  let registerScriptSpy: jasmine.Spy;
  let fakeAuth: typeof window.BBAUTH;

  beforeAll(() => {
    registerScriptSpy = spyOn(
      BBOmnibarScriptLoader,
      'registerScript'
    ).and.callFake(() => {
      window.BBAUTH = fakeAuth;

      return Promise.resolve();
    });
  });

  beforeEach(() => {
    registerScriptSpy.calls.reset();

    fakeAuth = {
      Omnibar: {
        load: jasmine
          .createSpy('load')
          .and.callFake((_, config: { afterLoad: () => void }) => {
            config.afterLoad();
          }),
      },
    };
  });

  afterEach(() => {
    registerScriptSpy.calls.reset();
    window.jQuery = undefined;
  });

  it('should register the required JavaScript libraries', (done) => {
    BBOmnibarLegacy.load({
      serviceName: 'test',
    }).then(() => {
      expect(registerScriptSpy.calls.argsFor(0)).toEqual([
        'https://cdnjs.cloudflare.com/ajax/libs/jquery/2.1.0/jquery.js',
      ]);

      expect(registerScriptSpy.calls.argsFor(1)).toEqual([
        'https://cdnjs.cloudflare.com/ajax/libs/easyXDM/2.4.17.1/easyXDM.min.js',
      ]);

      expect(registerScriptSpy.calls.argsFor(2)).toEqual([
        'https://signin.blackbaud.com/Omnibar.min.js',
      ]);

      done();
    });
  });

  it('should not register jQuery if a higher or equal version is already registered', (done) => {
    // defining a jQuery verion
    window.jQuery = {
      fn: {
        jquery: '3.2.1',
      },
    };

    BBOmnibarLegacy.load({
      serviceName: 'test',
    }).then(() => {
      expect(registerScriptSpy.calls.argsFor(0)).toEqual([
        'https://cdnjs.cloudflare.com/ajax/libs/easyXDM/2.4.17.1/easyXDM.min.js',
      ]);

      expect(registerScriptSpy.calls.argsFor(1)).toEqual([
        'https://signin.blackbaud.com/Omnibar.min.js',
      ]);

      done();
    });
  });

  it('should add the required omnibar elements to the page', (done) => {
    BBOmnibarLegacy.load({
      serviceName: 'test',
    }).then(() => {
      expect(
        document.querySelectorAll('.bb-omnibar-height-padding')
      ).not.toBeNull();

      done();
    });
  });

  it('should register jQuery if current version is less than the minimum version', (done) => {
    // defining a jQuery version
    window.jQuery = {
      fn: {
        jquery: '1.10.0',
      },
    };

    BBOmnibarLegacy.load({
      serviceName: 'test',
    }).then(() => {
      expect(registerScriptSpy.calls.argsFor(0)).toEqual([
        'https://cdnjs.cloudflare.com/ajax/libs/jquery/2.1.0/jquery.js',
      ]);

      expect(registerScriptSpy.calls.argsFor(1)).toEqual([
        'https://cdnjs.cloudflare.com/ajax/libs/easyXDM/2.4.17.1/easyXDM.min.js',
      ]);

      expect(registerScriptSpy.calls.argsFor(2)).toEqual([
        'https://signin.blackbaud.com/Omnibar.min.js',
      ]);

      done();
    });
  });

  it('should add the required omnibar elements to the page', (done) => {
    BBOmnibarLegacy.load({
      serviceName: 'test',
    }).then(() => {
      expect(
        document.querySelectorAll('.bb-omnibar-height-padding')
      ).not.toBeNull();

      done();
    });
  });

  it('should ensure that menuEl is a jQuery object if specified', (done) => {
    const menuEl = {};
    const jQueryMenuEl = {};

    window.jQuery = () => jQueryMenuEl;

    (fakeAuth.Omnibar.load as jasmine.Spy).and.callFake(
      (_: unknown, config: { menuEl: unknown }) => {
        expect(config.menuEl).toBe(jQueryMenuEl);

        done();
      }
    );

    BBOmnibarLegacy.load({
      menuEl,
      serviceName: 'test',
    });
  });

  it('should pass the expected config to the base omnibar load method', (done) => {
    BBOmnibarLegacy.load({
      serviceName: 'test',
    }).then(() => {
      expect(fakeAuth.Omnibar.load).toHaveBeenCalledWith(
        document.body.querySelector('[data-omnibar-el]'),
        {
          afterLoad: jasmine.any(Function),
          serviceName: 'test',
          'z-index': 1000,
        }
      );

      done();
    });
  });

  it('should support an undefined config', (done) => {
    BBOmnibarLegacy.load(undefined).then(() => {
      expect(fakeAuth.Omnibar.load).toHaveBeenCalledWith(
        document.body.querySelector('[data-omnibar-el]'),
        {
          afterLoad: jasmine.any(Function),
          'z-index': 1000,
        }
      );

      done();
    });
  });
});
